import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebaseConfig';

const DATA_BACKUPS_COLLECTION = 'app_data_backups';
const FIREBASE_PROJECT_BACKUPS_COLLECTION = 'firebase_project_backups';

export type DataBackupSource = 'manual' | 'scheduled';
export type AppDataBackupStatus = 'completed' | 'failed';

export type DataBackupRecord = {
  id: string;
  backupAt: number;
  source: DataBackupSource;
  itemCount: number;
  totalBytes: number;
  dayKey: string;
  targetMachine: string;
  status: AppDataBackupStatus;
  outputPath: string | null;
  errorMessage: string | null;
};

export type FirebaseProjectBackupSource = 'manual' | 'scheduled';
export type FirebaseProjectBackupStatus = 'requested' | 'running' | 'cancelled' | 'completed' | 'failed';

export type FirebaseProjectBackupRecord = {
  id: string;
  requestedAt: number;
  source: FirebaseProjectBackupSource;
  status: FirebaseProjectBackupStatus;
  dayKey: string;
  targetMachine: string;
  outputPath: string | null;
  errorMessage: string | null;
  cancelledAt?: number | null;
};

type DataBackupDocument = {
  backupAt: number;
  source: DataBackupSource;
  dayKey: string;
  itemCount: number;
  totalBytes: number;
  targetMachine: string;
  status: AppDataBackupStatus;
  outputPath?: string | null;
  errorMessage?: string | null;
  payload: Record<string, string>;
  updatedAt?: unknown;
};

type FirebaseProjectBackupDocument = {
  requestedAt: number;
  source: FirebaseProjectBackupSource;
  status: FirebaseProjectBackupStatus;
  dayKey: string;
  targetMachine: string;
  outputPath?: string | null;
  errorMessage?: string | null;
  cancelledAt?: number | null;
  updatedAt?: unknown;
};

function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function safeSize(value: string): number {
  return value.length;
}

export class DataBackupService {
  private userId: string | null = null;

  setUser(userId: string) {
    this.userId = userId;
  }

  private collectionRef() {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), `users/${this.userId}/${DATA_BACKUPS_COLLECTION}`);
  }

  private docRef(backupId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(getFirebaseDb(), `users/${this.userId}/${DATA_BACKUPS_COLLECTION}/${backupId}`);
  }

  private firebaseProjectCollectionRef() {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), `users/${this.userId}/${FIREBASE_PROJECT_BACKUPS_COLLECTION}`);
  }

  private firebaseProjectDocRef(backupId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(getFirebaseDb(), `users/${this.userId}/${FIREBASE_PROJECT_BACKUPS_COLLECTION}/${backupId}`);
  }

  private getAppBackupReceiverUrl(targetMachine: string): string {
    const baseUrl = process.env.EXPO_PUBLIC_APP_BACKUP_RECEIVER_URL || `http://azopepun.taild0a42b.ts.net:8787`;
    return baseUrl.replace(/\/$/, '');
  }

  private async buildPayload(): Promise<{ payload: Record<string, string>; totalBytes: number; itemCount: number }> {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];

    const payload: Record<string, string> = {};
    let totalBytes = 0;
    for (const [key, value] of pairs) {
      if (typeof value !== 'string') continue;
      payload[key] = value;
      totalBytes += safeSize(key) + safeSize(value);
    }

    return {
      payload,
      totalBytes,
      itemCount: Object.keys(payload).length,
    };
  }

  async backupNow(targetMachine = 'azopeun'): Promise<DataBackupRecord> {
    const timestamp = Date.now();
    const backupId = `manual-${timestamp}`;
    return this.sendBackupToReceiver(backupId, 'manual', timestamp, targetMachine);
  }

  async runScheduledOverwriteBackup(targetMachine = 'azopeun'): Promise<DataBackupRecord> {
    const dayKey = getDayKey();
    const backupId = `scheduled-${dayKey}`;
    return this.sendBackupToReceiver(backupId, 'scheduled', Date.now(), targetMachine);
  }

  private async sendBackupToReceiver(backupId: string, source: DataBackupSource, backupAt: number, targetMachine: string): Promise<DataBackupRecord> {
    const { payload, totalBytes, itemCount } = await this.buildPayload();
    const dayKey = getDayKey(new Date(backupAt));
    const receiverUrl = this.getAppBackupReceiverUrl(targetMachine);

    const response = await fetch(`${receiverUrl}/api/backups/app`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        backupId,
        source,
        backupAt,
        dayKey,
        targetMachine,
        userId: this.userId,
        payload,
      }),
    });

    const responseJson = (await response.json().catch(() => ({}))) as {
      outputPath?: string | null;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(responseJson.message || `Pi backup receiver returned ${response.status}`);
    }

    const docData: DataBackupDocument = {
      backupAt,
      source,
      dayKey,
      itemCount,
      totalBytes,
      targetMachine,
      status: 'completed',
      outputPath: responseJson.outputPath || null,
      errorMessage: null,
      payload,
    };

    await setDoc(this.docRef(backupId), { ...docData, updatedAt: serverTimestamp() }, { merge: false });

    return {
      id: backupId,
      backupAt,
      source,
      dayKey,
      itemCount,
      totalBytes,
      targetMachine,
      status: 'completed',
      outputPath: responseJson.outputPath || null,
      errorMessage: null,
    };
  }

  async listBackups(): Promise<DataBackupRecord[]> {
    const snap = await getDocs(this.collectionRef());
    const backups = snap.docs.map((item) => {
      const data = item.data() as DataBackupDocument;
      return {
        id: item.id,
        backupAt: data.backupAt || 0,
        source: data.source || 'manual',
        dayKey: data.dayKey || 'unknown',
        itemCount: data.itemCount || 0,
        totalBytes: data.totalBytes || 0,
        targetMachine: data.targetMachine || 'azopeun',
        status: data.status || 'requested',
        outputPath: data.outputPath || null,
        errorMessage: data.errorMessage || null,
      } as DataBackupRecord;
    });

    backups.sort((left, right) => (right.backupAt || 0) - (left.backupAt || 0));
    return backups;
  }

  async restoreBackup(backupId: string): Promise<void> {
    const snap = await getDoc(this.docRef(backupId));
    if (!snap.exists()) throw new Error('Backup not found');

    const data = snap.data() as DataBackupDocument;
    const payload = data.payload || {};

    const entries = Object.entries(payload).filter(([key, value]) => typeof key === 'string' && typeof value === 'string');
    if (entries.length === 0) {
      throw new Error('Backup payload is empty');
    }

    await AsyncStorage.multiSet(entries);
  }

  async requestFirebaseProjectBackup(source: FirebaseProjectBackupSource, targetMachine = 'azopepun'): Promise<FirebaseProjectBackupRecord> {
    const requestedAt = Date.now();
    const dayKey = getDayKey(new Date(requestedAt));
    const backupId = source === 'scheduled' ? `scheduled-${dayKey}` : `manual-${requestedAt}`;

    const payload: FirebaseProjectBackupDocument = {
      requestedAt,
      source,
      status: 'requested',
      dayKey,
      targetMachine,
      outputPath: null,
      errorMessage: null,
      cancelledAt: null,
    };

    await setDoc(this.firebaseProjectDocRef(backupId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });

    return {
      id: backupId,
      requestedAt,
      source,
      status: 'requested',
      dayKey,
      targetMachine,
      outputPath: null,
      errorMessage: null,
      cancelledAt: null,
    };
  }

  async listFirebaseProjectBackups(): Promise<FirebaseProjectBackupRecord[]> {
    const snap = await getDocs(this.firebaseProjectCollectionRef());
    const backups = snap.docs.map((item) => {
      const data = item.data() as FirebaseProjectBackupDocument;
      return {
        id: item.id,
        requestedAt: data.requestedAt || 0,
        source: data.source || 'manual',
        status: data.status || 'requested',
        dayKey: data.dayKey || 'unknown',
        targetMachine: data.targetMachine || 'azopepun',
        outputPath: data.outputPath || null,
        errorMessage: data.errorMessage || null,
        cancelledAt: data.cancelledAt || null,
      } as FirebaseProjectBackupRecord;
    });

    backups.sort((left, right) => (right.requestedAt || 0) - (left.requestedAt || 0));
    return backups;
  }

  async cancelFirebaseProjectBackupRequest(backupId: string): Promise<void> {
    const snap = await getDoc(this.firebaseProjectDocRef(backupId));
    if (!snap.exists()) throw new Error('Backup request not found');

    const existing = snap.data() as FirebaseProjectBackupDocument;
    if (existing.status === 'completed' || existing.status === 'failed' || existing.status === 'cancelled') {
      throw new Error('This backup request can no longer be cancelled');
    }

    await setDoc(
      this.firebaseProjectDocRef(backupId),
      {
        status: 'cancelled',
        cancelledAt: Date.now(),
        errorMessage: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async deleteFirebaseProjectBackupRequest(backupId: string): Promise<void> {
    const snap = await getDoc(this.firebaseProjectDocRef(backupId));
    if (!snap.exists()) throw new Error('Backup request not found');
    await deleteDoc(this.firebaseProjectDocRef(backupId));
  }
}

export const dataBackupService = new DataBackupService();
