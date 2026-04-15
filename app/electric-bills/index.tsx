export { default as BillCard } from './BillCard';
export { BillFormModal } from './BillFormModal';
export { ConsumerFormModal } from './ConsumerFormModal';
export { default as DropdownPicker } from './DropdownPicker';
export { CITIES, MONTHS, YEARS, STATUS_CONFIG } from './constants';
export { default as ConsumerInfoCard } from './ConsumerInfoCard';
export { default as ElectricBillStatCard } from './ElectricBillStatCard';
export { default as SearchBar } from './SearchBar';
export const pendingEditBillIdRef = { current: '' as string };

export function markBillForEdit(id: string) {
  pendingEditBillIdRef.current = id;
}
