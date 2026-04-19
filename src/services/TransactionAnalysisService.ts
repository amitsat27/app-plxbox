/**
 * Transaction Analysis Service
 * Handles PDF picking, upload to Firebase, and transaction analysis
 */

import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { extractText, isAvailable, extractTextWithInfo } from "expo-pdf-text-extract";
import { getFirebaseStorage } from "@/src/config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Transaction {
  id: string;
  date: string;
  amount: string;
  type: "credit" | "debit" | "unknown";
  source: "gpay" | "phonepe" | "upi" | "bank" | "unknown";
  description: string;
  reference: string;
}

export interface TransactionAnalysis {
  totalTransactions: number;
  gpayTransactions: number;
  phonepeTransactions: number;
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
  transactions: Transaction[];
  period: string;
  generatedAt: Date;
}

export interface UploadedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  downloadUrl?: string;
  storagePath?: string;
}

export const pickPDF = async (): Promise<any | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error("Error picking file:", error);
    return null;
  }
};

export const uploadToFirebaseStorage = async (
  file: any,
  userId: string
): Promise<UploadedFile | null> => {
  try {
    const storage = getFirebaseStorage();
    const timestamp = Date.now();
    const fileName = file.name || `transaction_${timestamp}.pdf`;
    const storagePath = `transactions/${userId}/${timestamp}_${fileName}`;

    const storageRef = ref(storage, storagePath);

    const response = await fetch(file.uri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);

    const downloadUrl = await getDownloadURL(storageRef);

    return {
      uri: file.uri,
      name: fileName,
      size: file.size || 0,
      type: "application/pdf",
      downloadUrl,
      storagePath,
    };
  } catch (error) {
    console.error("Error uploading to Firebase:", error);
    return null;
  }
};

const extractAmount = (text: string): string => {
  const amountMatch = text.match(/[₹₨]?\s*[\d,]+\.?\d*/i);
  if (amountMatch) {
    return amountMatch[0].replace(/[₹₨,\s]/g, "");
  }
  return "";
};

const detectTransactionType = (text: string): "credit" | "debit" | "unknown" => {
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes("credited") ||
    lowerText.includes("received") ||
    lowerText.includes("cr.") ||
    lowerText.includes("+") ||
    lowerText.includes("money in")
  ) {
    return "credit";
  }
  if (
    lowerText.includes("debited") ||
    lowerText.includes("paid") ||
    lowerText.includes("dr.") ||
    lowerText.includes("-") ||
    lowerText.includes("money out") ||
    lowerText.includes("transfer")
  ) {
    return "debit";
  }
  return "unknown";
};

const detectPaymentSource = (text: string): "gpay" | "phonepe" | "upi" | "bank" | "unknown" => {
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes("gpay") ||
    lowerText.includes("google pay") ||
    lowerText.includes("tez")
  ) {
    return "gpay";
  }
  if (
    lowerText.includes("phonepe") ||
    lowerText.includes("phone pe") ||
    lowerText.includes("paytm")
  ) {
    return "phonepe";
  }
  if (
    lowerText.includes("upi") ||
    lowerText.includes("@upi") ||
    lowerText.includes("@ybl") ||
    lowerText.includes("@axl")
  ) {
    return "upi";
  }
  if (
    lowerText.includes("bank") ||
    lowerText.includes("icici") ||
    lowerText.includes("sbi") ||
    lowerText.includes("hdfc") ||
    lowerText.includes("axis") ||
    lowerText.includes("kotak") ||
    lowerText.includes("account")
  ) {
    return "bank";
  }
  return "unknown";
};

const detectTransactionSource = detectPaymentSource;

const extractDate = (text: string): string => {
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /\d{1,2}-\d{1,2}-\d{2,4}/,
    /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/i,
    /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return "";
};

const extractReference = (text: string): string => {
  const refPatterns = [
    /UPI[:\s]*([\w]+)/i,
    /Ref[:\s]*([\w]+)/i,
    /ID[:\s]*([\w@.]+)/i,
    /Txn[:\s]*([\w]+)/i,
    /RRN[:\s]*([\d]+)/i,
    /([\d]{12,})/,
  ];

  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return "";
};

export const analyzeTransactionsFromText = (
  text: string,
  period: string = "Document"
): TransactionAnalysis => {
  const lines = text.split(/\n|\\n/).filter((line) => line.trim().length > 0);

  const transactions: Transaction[] = [];
  let gpayCount = 0;
  let phonepeCount = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  const transactionIndicators = [
    /₹|INR|\d+\.?\d*/,
    /gpay|google pay|phonepe|paytm|upi|bank|credited|debited|paid|received|transfer/i,
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
  ];

  for (const line of lines) {
    const hasAmount = transactionIndicators[0].test(line);
    const hasPaymentMethod = transactionIndicators[1].test(line);
    const hasDate = transactionIndicators[2].test(line);

    if (hasAmount && (hasPaymentMethod || hasDate)) {
      const amountStr = extractAmount(line);
      const amount = parseFloat(amountStr.replace(/,/g, ""));

      if (!isNaN(amount) && amount > 0) {
        const type = detectTransactionType(line);
        const source = detectPaymentSource(line);
        const date = extractDate(line) || new Date().toLocaleDateString();
        const reference = extractReference(line);

        if (type === "credit") {
          totalCredit += amount;
        } else if (type === "debit") {
          totalDebit += amount;
        }

        if (source === "gpay") gpayCount++;
        if (source === "phonepe") phonepeCount++;

        transactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date,
          amount: amountStr,
          type,
          source,
          description: line.trim().substring(0, 100),
          reference,
        });
      }
    }
  }

  return {
    totalTransactions: transactions.length,
    gpayTransactions: gpayCount,
    phonepeTransactions: phonepeCount,
    totalCredit,
    totalDebit,
    netAmount: totalCredit - totalDebit,
    transactions,
    period,
    generatedAt: new Date(),
  };
};

export const generateMockAnalysis = (): TransactionAnalysis => {
  const mockTransactions: Transaction[] = [
    {
      id: "1",
      date: "15/01/2024",
      amount: "2500",
      type: "credit",
      source: "gpay",
      description: "Received from Rahul via GPay",
      reference: "GPay@rahulk",
    },
    {
      id: "2",
      date: "14/01/2024",
      amount: "850",
      type: "debit",
      source: "phonepe",
      description: "Paid to Swiggy via PhonePe",
      reference: "PhonePe@swiggy",
    },
    {
      id: "3",
      date: "13/01/2024",
      amount: "12000",
      type: "credit",
      source: "bank",
      description: "Salary Credit - ICICI Bank",
      reference: "ICICI20240113001",
    },
    {
      id: "4",
      date: "12/01/2024",
      amount: "450",
      type: "debit",
      source: "gpay",
      description: "Auto recharge via GPay",
      reference: "GPay@autorech",
    },
    {
      id: "5",
      date: "11/01/2024",
      amount: "3200",
      type: "debit",
      source: "upi",
      description: "Rent payment via UPI",
      reference: "UPI@rentpay",
    },
    {
      id: "6",
      date: "10/01/2024",
      amount: "599",
      type: "debit",
      source: "phonepe",
      description: "Movie tickets - PhonePe",
      reference: "PhonePe@bookmyshow",
    },
    {
      id: "7",
      date: "09/01/2024",
      amount: "1500",
      type: "credit",
      source: "gpay",
      description: "From Mom via GPay",
      reference: "GPay@mom",
    },
    {
      id: "8",
      date: "08/01/2024",
      amount: "2300",
      type: "debit",
      source: "bank",
      description: "EMI Payment - HDFC",
      reference: "HDFC20240108002",
    },
  ];

  return {
    totalTransactions: 8,
    gpayTransactions: 3,
    phonepeTransactions: 2,
    totalCredit: 9500,
    totalDebit: 9399,
    netAmount: 101,
    transactions: mockTransactions,
    period: "January 2024 (Sample)",
    generatedAt: new Date(),
  };
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export interface PDFReadResult {
  success: boolean;
  text?: string;
  error?: string;
  isTextBased?: boolean;
}

export const readPDFFile = async (uri: string): Promise<PDFReadResult> => {
  try {
    let text = "";
    let success = false;

    console.log("Using expo-pdf-text-extract, isAvailable:", isAvailable());

    if (isAvailable()) {
      try {
        const result = await extractTextWithInfo(uri);
        text = result.text;
        success = result.success;
        console.log("extracted text length:", text?.length || 0);
        console.log("extracted text sample:", text?.substring(0, 500));
      } catch (extractError) {
        console.log("expo-pdf-text-extract error:", extractError);
      }
    } else {
      console.log("Native module not available, falling back to JavaScript extraction");
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blobToArrayBuffer(blob);
      const uint8Array = new Uint8Array(arrayBuffer);
      text = await extractPDFTextModern(uint8Array);
      success = !!(text && text.length > 50);
    }

    if (success && text && text.length > 50) {
      return {
        success: true,
        text: text,
        isTextBased: true,
      };
    }

    return {
      success: false,
      error: "Could not extract text from PDF. The PDF may be scanned or use advanced encryption.",
      isTextBased: false,
    };
  } catch (error: any) {
    console.error("PDF Read Error:", error);
    return {
      success: false,
      error: error.message || "Failed to read PDF file",
    };
  }
};

const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

const extractPDFTextModern = async (data: Uint8Array): Promise<string> => {
  const allText: string[] = [];
  
  try {
    const pdfString = Array.from(data).map(b => String.fromCharCode(b)).join("");
    
    const streams: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      streams.push(match[1].trim());
    }
    
    for (let streamData of streams) {
      if (streamData.length > 100) {
        try {
          const streamBytes = new Uint8Array(streamData.length);
          for (let i = 0; i < streamData.length; i++) {
            streamBytes[i] = streamData.charCodeAt(i);
          }
          const pako = require("pako");
          const decompressed = pako.inflate(streamBytes) as Uint8Array;
          streamData = Array.from(decompressed).map(b => String.fromCharCode(b)).join("");
        } catch {}
      }
      
      const patterns = [
        /\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g,
        /<([0-9a-fA-F]+)>\s*Tj/g,
        /\(([A-Za-z][^\\)]{2,200})\)/g,
      ];
      
      for (const pattern of patterns) {
        let textMatch;
        while ((textMatch = pattern.exec(streamData)) !== null) {
          let content = textMatch[1];
          content = content
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")")
            .replace(/\\n/g, " ")
            .replace(/\\r/g, " ")
            .replace(/\\t/g, " ")
            .replace(/\\\\/g, "\\");
          
          if (content.length > 1) {
            allText.push(content);
          }
        }
      }
    }
    
    const btBlocks = pdfString.match(/BT([\s\S]*?)ET/g);
    if (btBlocks) {
      for (const block of btBlocks) {
        const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const content = m.replace(/\)\s*Tj/g, "").slice(1);
            if (content.length > 1 && /[a-zA-Z0-9]/.test(content)) {
              allText.push(content);
            }
          }
        }
      }
    }
    
    const result = allText
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n\r\t\u00A0-\u00FF]/g, " ")
      .trim();
    
    return result;
  } catch (error) {
    console.error("Extract error:", error);
    return allText.join(" ");
  }
};

export const analyzePDFFile = async (uri: string, fileName: string): Promise<TransactionAnalysis | null> => {
  const fileNameLower = fileName.toLowerCase();
  
  if (fileNameLower.includes("gpay") || fileNameLower.includes("google")) {
    const gpayAnalysis = await analyzeGPayPDF(uri);
    if (gpayAnalysis) return gpayAnalysis;
  }
  
  if (fileNameLower.includes("phonepe")) {
    const phonepeAnalysis = await analyzePhonePePDF(uri);
    if (phonepeAnalysis) return phonepeAnalysis;
  }

  const result = await readPDFFile(uri);

  if (!result.success || !result.text) {
    console.log("PDF Read failed:", result.error);
    return null;
  }

  console.log("Extracted PDF Text:", result.text.substring(0, 1000));

  const analysis = analyzeTransactionsFromText(result.text, fileName.replace(".pdf", "").replace(/_/g, " "));

  console.log("Transactions found:", analysis.transactions.length);

  if (analysis.transactions.length === 0) {
    return null;
  }

  return analysis;
};

const analyzeGPayPDF = async (uri: string): Promise<TransactionAnalysis | null> => {
  const result = await readPDFFile(uri);
  if (!result.success || !result.text) return null;

  const text = result.text;
  const transactions: Transaction[] = [];
  
  // Extract period from "Transaction statement period 01 March 2026 - 31 March 2026"
  const periodMatch = text.match(/Transaction statement period\s*(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}\s+\w+\s+\d{4})/i);
  const period = periodMatch ? `${periodMatch[1]} - ${periodMatch[2]}` : "Unknown Period";
  
  // Extract totals
  const sentMatch = text.match(/Sent\s*([₹₨]?\s*[\d,]+\.?\d*)/i);
  const receivedMatch = text.match(/Received\s*([₹₨]?\s*[\d,]+\.?\d*)/i);
  const totalSent = sentMatch ? parseFloat(sentMatch[1].replace(/[₹₨,\s]/g, "")) : 0;
  const totalReceived = receivedMatch ? parseFloat(receivedMatch[1].replace(/[₹₨,\s]/g, "")) : 0;
  
  // Split by pages to handle multi-page PDFs
  const pages = text.split(/Page \d+ of \d+/i);
  
  // Pattern: Date & time Transaction details Amount
  // Example: "01 Mar, 2026 10:57 AM Paid to Amazon India ... ₹209"
  // Example: "16 Mar, 2026 03:34 PM Received from ABHIJITH K S ... ₹1"
  
  const transactionPattern = /(\d{2}\s+\w{3},?\s+\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))?\s*(Paid to|Received from)\s+(.+?)(?:\n|UPI Transaction ID:)\s*(?:UPI Transaction ID:\s*([A-Z0-9]+))?\s*(?:Paid (?:by|to)\s+\S+(?:\s+\d+)?\s*)?([₹₨]\s*[\d,]+\.?\d*)?/gi;
  
  let match;
  while ((match = transactionPattern.exec(text)) !== null) {
    const [, date, time, type, description, reference, amountStr] = match;
    
    if (!amountStr) continue;
    
    const amount = amountStr.replace(/[₹₨,\s]/g, "");
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) continue;
    
    transactions.push({
      id: `gpay-${transactions.length + 1}`,
      date: time ? `${date} ${time}` : date,
      amount: String(parsedAmount),
      type: type.toLowerCase().includes("paid") ? "debit" : "credit",
      source: "gpay",
      description: description.trim().substring(0, 100),
      reference: reference || "",
    });
  }
  
  // Also try simpler pattern for any remaining transactions
  const simplePattern = /(\d{2}\s+\w{3},?\s+\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))?\s*((?:Paid to|Received from)\s+[^\n₹]+)([₹₨]\s*[\d,]+\.?\d*)/gi;
  while ((match = simplePattern.exec(text)) !== null) {
    const [, date, time, descPart, amountStr] = match;
    
    // Skip if already captured
    const isDuplicate = transactions.some(t => 
      t.date.includes(date.replace(",", "")) && 
      t.description.toLowerCase().includes(descPart.replace(/^(paid to|received from)\s+/i, "").trim().toLowerCase().substring(0, 20))
    );
    if (isDuplicate) continue;
    
    const amount = amountStr.replace(/[₹₨,\s]/g, "");
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) continue;
    
    const isDebit = descPart.toLowerCase().startsWith("paid to");
    
    transactions.push({
      id: `gpay-${transactions.length + 1}`,
      date: time ? `${date} ${time}` : date,
      amount: String(parsedAmount),
      type: isDebit ? "debit" : "credit",
      source: "gpay",
      description: descPart.replace(/^(paid to|received from)\s+/i, "").trim().substring(0, 100),
      reference: "",
    });
  }

  if (transactions.length === 0) {
    return null;
  }

  // Sort by date
  transactions.sort((a, b) => {
    const dateA = new Date(a.date.replace(/(\d{2})\s+(\w{3}),?\s+(\d{4})/, "$1 $2 $3"));
    const dateB = new Date(b.date.replace(/(\d{2})\s+(\w{3}),?\s+(\d{4})/, "$1 $2 $3"));
    return dateB.getTime() - dateA.getTime();
  });

  const totalCredit = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    totalTransactions: transactions.length,
    gpayTransactions: transactions.length,
    phonepeTransactions: 0,
    totalCredit,
    totalDebit,
    netAmount: totalCredit - totalDebit,
    transactions,
    period,
    generatedAt: new Date(),
  };
};

const analyzePhonePePDF = async (uri: string): Promise<TransactionAnalysis | null> => {
  const result = await readPDFFile(uri);
  if (!result.success || !result.text) return null;

  const text = result.text;
  const transactions: Transaction[] = [];
  
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    const amountMatch = line.match(/[₹₨]?\s*([\d,]+\.?\d*)/);
    if (!amountMatch) continue;
    
    const hasDebit = /debited|paid|deducted/i.test(line);
    const hasCredit = /credited|received|credited/i.test(line);
    if (!hasDebit && !hasCredit) continue;
    
    const amount = amountMatch[1].replace(/,/g, "");
    const type = hasDebit ? "debit" : "credit";
    
    transactions.push({
      id: `phonepe-${transactions.length + 1}`,
      date: "",
      amount: amount,
      type: type as "credit" | "debit",
      source: "phonepe",
      description: line.substring(0, 100),
      reference: "",
    });
  }

  const totalCredit = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const totalDebit = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

  return {
    totalTransactions: transactions.length,
    gpayTransactions: 0,
    phonepeTransactions: transactions.length,
    totalCredit,
    totalDebit,
    netAmount: totalCredit - totalDebit,
    transactions,
    period: "PhonePe Statement",
    generatedAt: new Date(),
  };
}
