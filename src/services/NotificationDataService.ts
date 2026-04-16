import { getFirebaseDb } from '../config/firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const SECTION_SEARCH_TERMS: Record<string, string> = {
  electric: 'electricity bill meter',
  gas: 'gas cylinder cooking',
  wifi: 'wifi router internet',
  property: 'house building',
  vehicles: 'car vehicle',
  appliances: 'home appliances',
};

const FALLBACK_IMAGES: Record<string, string> = {
  electric: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  gas: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
  wifi: 'https://images.unsplash.com/photo-1544177620-c1c708f3356e?w=400',
  property: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
  vehicles: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
  appliances: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
};

export interface SmartNotificationData {
  section: string;
  title: string;
  message: string;
  imageUrl?: string;
  imageKey?: string;
  billAmount?: string;
  billMonth?: string;
  dueDate?: string;
  lastBillAmount?: string;
  lastBillMonth?: string;
  pendingAmount?: string;
  pendingCount?: number;
}

export interface SectionTemplate {
  key: string;
  label: string;
  icon: string;
  imageKey: string;
  getData: () => Promise<SmartNotificationData>;
}

export const NOTIFICATION_IMAGE_KEYS: Record<string, string> = {
  electric: 'electric',
  gas: 'gas',
  wifi: 'wifi',
  property: 'property',
  vehicles: 'vehicles',
  appliances: 'appliances',
};

export const SECTION_ICONS: Record<string, string> = {
  electric: '⚡',
  gas: '🔥',
  wifi: '📶',
  property: '🏠',
  vehicles: '🚗',
  appliances: '📺',
};

export function getSectionImage(section: string): string | undefined {
  return FALLBACK_IMAGES[section];
}

const getDb = () => getFirebaseDb();

async function fetchElectricData(): Promise<SmartNotificationData> {
  try {
    const db = getDb();
    const q = query(collection(db, 'pulsebox', 'electricbills', 'pune'), orderBy('lastDateToPay', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0].data();
      return {
        section: 'electric',
        title: 'Electricity Bill Update',
        message: `Your latest electricity bill is ₹${doc.billAmount || 0} for ${doc.billMonth || 'this month'}`,
        billAmount: doc.billAmount || '0',
        billMonth: doc.billMonth || '',
        dueDate: doc.lastDateToPay ? new Date(doc.lastDateToPay.seconds ? doc.lastDateToPay.seconds * 1000 : doc.lastDateToPay).toLocaleDateString() : '',
        lastBillAmount: doc.billAmount || '0',
        lastBillMonth: doc.billMonth || '',
        imageUrl: FALLBACK_IMAGES.electric,
        imageKey: 'electric',
      };
    }
  } catch (e) {
    console.log('Electric data fetch error:', e);
  }
  return {
    section: 'electric',
    title: 'Electricity Bill Reminder',
    message: 'Time to check your electricity bill',
    imageUrl: FALLBACK_IMAGES.electric,
    imageKey: 'electric',
  };
}

async function fetchGasData(): Promise<SmartNotificationData> {
  try {
    const db = getDb();
    const q = query(collection(db, 'pulsebox', 'gasbills', 'pune'), orderBy('billGenerationMonth', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0].data();
      return {
        section: 'gas',
        title: 'Gas Bill Update',
        message: `Your latest gas bill is ₹${doc.billAmount || 0} for ${doc.billGenerationMonth || 'this month'}`,
        billAmount: doc.billAmount || '0',
        billMonth: doc.billGenerationMonth || '',
        dueDate: doc.dueDate ? new Date(doc.dueDate.seconds ? doc.dueDate.seconds * 1000 : doc.dueDate).toLocaleDateString() : '',
        lastBillAmount: doc.billAmount || '0',
        lastBillMonth: doc.billGenerationMonth || '',
        imageUrl: FALLBACK_IMAGES.gas,
        imageKey: 'gas',
      };
    }
  } catch (e) {
    console.log('Gas data fetch error:', e);
  }
  return {
    section: 'gas',
    title: 'Gas Bill Reminder',
    message: 'Time to check your gas bill',
    imageUrl: FALLBACK_IMAGES.gas,
    imageKey: 'gas',
  };
}

async function fetchWifiData(): Promise<SmartNotificationData> {
  try {
    const db = getDb();
    const q = query(collection(db, 'pulsebox', 'wifibills', 'pune'), orderBy('billMonth', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0].data();
      return {
        section: 'wifi',
        title: 'WiFi Bill Update',
        message: `Your latest WiFi bill is ₹${doc.billAmount || 0} for ${doc.billMonth || 'this month'}`,
        billAmount: doc.billAmount || '0',
        billMonth: doc.billMonth || '',
        dueDate: doc.dueDate ? new Date(doc.dueDate.seconds ? doc.dueDate.seconds * 1000 : doc.dueDate).toLocaleDateString() : '',
        lastBillAmount: doc.billAmount || '0',
        lastBillMonth: doc.billMonth || '',
        imageUrl: FALLBACK_IMAGES.wifi,
        imageKey: 'wifi',
      };
    }
  } catch (e) {
    console.log('Wifi data fetch error:', e);
  }
  return {
    section: 'wifi',
    title: 'WiFi Bill Reminder',
    message: 'Time to check your WiFi bill',
    imageUrl: FALLBACK_IMAGES.wifi,
    imageKey: 'wifi',
  };
}

async function fetchPropertyData(): Promise<SmartNotificationData> {
  try {
    const db = getDb();
    const q = query(collection(db, 'pulsebox', 'propertybills', 'pune'), orderBy('year', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0].data();
      return {
        section: 'property',
        title: 'Property Tax Update',
        message: `Your property tax is ₹${doc.totalAmount || 0} for ${doc.year || 'this year'}`,
        billAmount: doc.totalAmount || '0',
        billMonth: doc.year || '',
        dueDate: doc.dueDate ? new Date(doc.dueDate.seconds ? doc.dueDate.seconds * 1000 : doc.dueDate).toLocaleDateString() : '',
        lastBillAmount: doc.totalAmount || '0',
        lastBillMonth: doc.year || '',
        imageUrl: FALLBACK_IMAGES.property,
        imageKey: 'property',
      };
    }
  } catch (e) {
    console.log('Property data fetch error:', e);
  }
  return {
    section: 'property',
    title: 'Property Tax Reminder',
    message: 'Time to check your property tax',
    imageUrl: FALLBACK_IMAGES.property,
    imageKey: 'property',
  };
}

export const sectionTemplates: SectionTemplate[] = [
  { key: 'electric', label: 'Electric Bills', icon: '⚡', imageKey: 'electric', getData: fetchElectricData },
  { key: 'gas', label: 'Gas Bills', icon: '🔥', imageKey: 'gas', getData: fetchGasData },
  { key: 'wifi', label: 'WiFi Bills', icon: '📶', imageKey: 'wifi', getData: fetchWifiData },
  { key: 'property', label: 'Property Tax', icon: '🏠', imageKey: 'property', getData: fetchPropertyData },
];

export async function getSmartNotificationData(section: string): Promise<SmartNotificationData> {
  const template = sectionTemplates.find(t => t.key === section);
  if (template) {
    return template.getData();
  }
  return { section, title: 'Reminder', message: 'Check your bills' };
}

export function generateSmartMessage(type: string, data: SmartNotificationData): string {
  switch (type) {
    case 'bill_due':
      return data.billAmount 
        ? `Your ${data.billMonth} bill of ₹${data.billAmount} is due on ${data.dueDate}`
        : `Your bill is due soon. Check now!`;
    case 'reminder':
      return data.lastBillMonth
        ? `Reminder: ${data.lastBillMonth} bill was ₹${data.lastBillAmount}`
        : `Don't forget to check your bill`;
    case 'alert':
      return data.pendingCount && data.pendingCount > 0
        ? `You have ${data.pendingCount} pending bill${data.pendingCount > 1 ? 's' : ''} totaling ₹${data.pendingAmount}`
        : data.message;
    default:
      return data.message;
  }
}