import { useCallback, useEffect, useState } from 'react';
import { firebaseService } from '@/src/services/FirebaseService';
import type { ServiceRecord } from '@/src/types';

export function useServices(applianceId: string) {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applianceId) {
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseService.getApplianceServiceRecords(applianceId, (data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
      );
      setRecords(sorted);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [applianceId]);

  const addRecord = useCallback(
    async (record: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);
        await firebaseService.addApplianceServiceRecord(applianceId, record);
      } catch (err: any) {
        const message = err?.message || 'Failed to add service record';
        setError(message);
        throw err;
      }
    },
    [applianceId],
  );

  const updateRecord = useCallback(
    async (recordId: string, updates: Partial<ServiceRecord>) => {
      try {
        setError(null);
        setRecords((prev) =>
          prev
            .map((r) =>
              r.id === recordId
                ? { ...r, ...updates, updatedAt: new Date() } as ServiceRecord
                : r,
            )
            .sort(
              (a, b) =>
                new Date(b.serviceDate).getTime() -
                new Date(a.serviceDate).getTime(),
            ),
        );
        await firebaseService.updateServiceRecord(recordId, updates);
      } catch (err: any) {
        const message = err?.message || 'Failed to update service record';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteRecord = useCallback(async (recordId: string) => {
    try {
      setError(null);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      await firebaseService.deleteServiceRecord(recordId);
    } catch (err: any) {
      const message = err?.message || 'Failed to delete service record';
      setError(message);
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = firebaseService.getApplianceServiceRecords(
      applianceId,
      (data) => {
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.serviceDate).getTime() -
            new Date(a.serviceDate).getTime(),
        );
        setRecords(sorted);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [applianceId]);

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch,
  };
}
