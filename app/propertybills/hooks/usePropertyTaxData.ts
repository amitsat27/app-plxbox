/**
 * usePropertyTaxData — data management hook for property tax bills
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { firebaseService, PropertyTaxBillEntry } from '@/src/services/FirebaseService';

const CITIES = ['pune', 'nashik', 'jalgaon'];

export function usePropertyTaxData() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTaxIndex, setSelectedTaxIndex] = useState<string | undefined>();
  const [taxIndices, setTaxIndices] = useState<string[]>([]);
  const [bills, setBills] = useState<PropertyTaxBillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [filter, setFilter] = useState<string>('All');

  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city);
    setSelectedTaxIndex(undefined);
    setBills([]);
    setPropertyInfo(null);

    const indices = await firebaseService.getPropertyTaxConsumersByCity(city);
    setTaxIndices(indices);
    if (indices.length === 1) {
      setSelectedTaxIndex(indices[0]);
    }
  }, []);

  useEffect(() => {
    if (!selectedTaxIndex || !selectedCity) {
      setBills([]);
      setPropertyInfo(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadInfo = async () => {
      const info = await firebaseService.getPropertyTaxInfo(selectedTaxIndex);
      if (!cancelled) setPropertyInfo(info);
    };
    loadInfo();

    const unsub = firebaseService.getPropertyTaxBills(selectedCity, selectedTaxIndex, (data) => {
      if (!cancelled) {
        setBills(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedTaxIndex, selectedCity]);

  const onRefresh = useCallback(() => {
    if (!selectedTaxIndex || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getPropertyTaxInfo(selectedTaxIndex)
      .then(info => { setPropertyInfo(info); setRefreshing(false); })
      .catch(() => setRefreshing(false));
  }, [selectedTaxIndex, selectedCity]);

  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => {
      const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount;
      return s + (isFinite(a) ? a : 0);
    }, 0);
    const paid = bills.filter(b => b.payStatus === 'Paid').length;
    const pending = bills.filter(b => b.payStatus === 'Pending').length;
    const paidAmount = bills
      .filter(b => b.payStatus === 'Paid')
      .reduce((s, b) => {
        const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount;
        return s + (isFinite(a) ? a : 0);
      }, 0);
    return { total, paid, pending, paidAmount };
  }, [bills]);

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.payStatus === filter);

  return {
    CITIES,
    selectedCity, selectedTaxIndex, taxIndices, bills, loading, refreshing,
    propertyInfo, filter, setFilter, stats, filteredBills,
    handleCityChange, onRefresh, setSelectedTaxIndex,
  };
}
