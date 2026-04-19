/**
 * useWifiBillsManager — WiFi Bill CRUD & real-time data hook
 *
 * Data stored in Firestore at: pulsebox/wifibills/{city}/{docId}
 * Fields: ispName, billAmount, payStatus, paymentMode, lastDateToPay, lastPaidBillMonth, city
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { getFirebaseDb } from '../config/firebaseConfig';
import { getFirebaseStorage } from '../config/firebaseConfig';
import { firebaseService } from '../services/FirebaseService';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WifiBillEntry {
  id: string;
  city: string;
  ispName: string;
  billAmount: number;
  payStatus: 'Paid' | 'Pending';
  paymentMode: string;
  lastDateToPay: string;   // YYYY-MM-DD
  lastPaidBillMonth: string; // "June 2023"
  originalCity: string; // For edit operations
  billDocumentURL?: string; // Bill document from Firebase Storage
}

export interface WifiBillStats {
  totalAmount: number;
  totalCount: number;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
}

export interface WifiBillFormData {
  ispName: string;
  billAmount: string;
  payStatus: 'Paid' | 'Pending';
  paymentMode: string;
  lastDateToPay: Date;
  lastPaidBillMonth: Date;
  city: string;
  fileUri?: string | null;
  existingDocumentURL?: string;
}

type Cities = 'pune' | 'nashik' | 'jalgaon';
const CITIES: Cities[] = ['pune', 'nashik', 'jalgaon'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeStats(bills: WifiBillEntry[]): WifiBillStats {
  let totalAmount = 0, totalCount = 0;
  let paidAmount = 0, paidCount = 0;
  let pendingAmount = 0, pendingCount = 0;

  for (const b of bills) {
    const amt = b.billAmount || 0;
    totalAmount += amt;
    totalCount++;
    if (b.payStatus === 'Paid') {
      paidAmount += amt;
      paidCount++;
    } else {
      pendingAmount += amt;
      pendingCount++;
    }
  }

  return { totalAmount, totalCount, paidAmount, paidCount, pendingAmount, pendingCount };
}

function mapDoc(id: string, data: any): WifiBillEntry {
  const raw = data.billAmount;
  const amount = typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '')) || 0 : typeof raw === 'number' ? raw : 0;

  return {
    id,
    city: data.city || 'pune',
    ispName: data.ispName || '',
    billAmount: amount,
    payStatus: data.payStatus === 'Paid' ? 'Paid' : 'Pending',
    paymentMode: data.paymentMode || 'N/A',
    lastDateToPay: data.lastDateToPay || '',
    lastPaidBillMonth: data.lastPaidBillMonth || '',
    originalCity: data.city || 'pune',
    billDocumentURL: data.billDocumentURL || '',
  };
}

export function parseBillMonth(raw: string): Date | null {
  if (!raw) return null;
  const parts = raw.split(' ');
  if (parts.length >= 2) {
    const monthMap: Record<string, number> = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
    };
    const m = monthMap[parts[0]];
    if (m !== undefined) return new Date(Number(parts[1]), m, 1);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useWifiBillsManager() {
  const [bills, setBills] = useState<WifiBillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cleanupsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    for (const city of CITIES) {
      try {
        const db = getFirebaseDb();
        const q = query(collection(db, 'pulsebox', 'wifibills', city));
        const unsub = onSnapshot(q, () => {
          // On every snapshot, re-fetch all cities to get merged results
          refreshAll();
        }, (err) => {
          console.error(`[WiFi Bills] Listener error for ${city}:`, err);
          setError(`Failed to listen to ${city}: ${err.message}`);
        });
        unsubscribers.push(unsub);
      } catch (err) {
        console.error(`[WiFi Bills] Setup listener error for ${city}:`, err);
      }
    }

    cleanupsRef.current = unsubscribers;

    // Initial fetch
    refreshAll();

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const all: WifiBillEntry[] = [];
    const db = getFirebaseDb();

    for (const city of CITIES) {
      try {
        const snap = await getDocs(collection(db, 'pulsebox', 'wifibills', city));
        snap.forEach((d) => all.push(mapDoc(d.id, d.data())));
      } catch (err) {
        console.warn(`[WiFi Bills] Failed to fetch ${city}:`, err);
      }
    }

    setBills(all);
    setLoading(false);
  }, []);

  const addBill = useCallback(async (data: WifiBillFormData) => {
    const db = getFirebaseDb();
    const docData: Record<string, any> = {
      city: data.city,
      ispName: data.ispName.trim(),
      billAmount: String(data.billAmount),
      payStatus: data.payStatus,
      paymentMode: data.paymentMode,
      lastDateToPay: data.lastDateToPay.toISOString().split('T')[0],
      lastPaidBillMonth: data.lastPaidBillMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };

    // Handle document upload
    if (data.fileUri) {
      const uploadedUrl = await firebaseService.uploadComplianceDocument(
        '',
        '',
        'service',
        data.fileUri
      );
      docData.billDocumentURL = uploadedUrl;
    }

    await addDoc(collection(db, 'pulsebox', 'wifibills', data.city), docData);
  }, []);

  const updateBill = useCallback(async (billId: string, city: string, data: WifiBillFormData) => {
    const db = getFirebaseDb();
    const docData: Record<string, any> = {
      city: data.city,
      ispName: data.ispName.trim(),
      billAmount: String(data.billAmount),
      payStatus: data.payStatus,
      paymentMode: data.paymentMode,
      lastDateToPay: data.lastDateToPay.toISOString().split('T')[0],
      lastPaidBillMonth: data.lastPaidBillMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };

    // Handle document upload/replacement
    if (data.fileUri) {
      // Upload new document
      const uploadedUrl = await firebaseService.uploadComplianceDocument(
        '',
        '',
        'service',
        data.fileUri
      );
      docData.billDocumentURL = uploadedUrl;
    } else if (data.existingDocumentURL === null) {
      // User removed existing document
      docData.billDocumentURL = null;
    } else if (data.existingDocumentURL) {
      // Keep existing document
      docData.billDocumentURL = data.existingDocumentURL;
    }

    await updateDoc(doc(db, 'pulsebox', 'wifibills', city, billId), docData);
  }, []);

  const deleteBill = useCallback(async (billId: string, city: string) => {
    const db = getFirebaseDb();
    const storage = getFirebaseStorage();
    
    // Get the bill first to check for document
    const billSnap = await getDoc(doc(db, 'pulsebox', 'wifibills', city, billId));
    const billData = billSnap.data();
    
    // Delete the document file if exists
    if (billData?.billDocumentURL) {
      try {
        const fileRef = ref(storage, billData.billDocumentURL);
        await deleteObject(fileRef);
      } catch (e) {
        console.log('Could not delete WiFi bill document');
      }
    }
    
    await deleteDoc(doc(db, 'pulsebox', 'wifibills', city, billId));
  }, []);

  return {
    bills,
    loading,
    error,
    stats: computeStats(bills),
    refreshAll,
    addBill,
    updateBill,
    deleteBill,
  };
}
