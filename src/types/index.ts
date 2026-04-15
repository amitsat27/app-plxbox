// 📦 Pulsebox Type Definitions
// Comprehensive TypeScript types for the entire application
// Production-ready with strict typing

// ============================================
// USER & AUTH TYPES
// ============================================
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  currency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultCity: 'pune' | 'nashik' | 'jalgaon' | 'other';
}

export interface UserProfile extends User {
  totalApplianceCost: number;
  totalServiceSpent: number;
  totalBillsPaid: number;
  pendingBillsCount: number;
  overdueBillsCount: number;
}

// ============================================
// BILL TYPES (All categories)
// ============================================
export type BillCategory = 'electric' | 'water' | 'gas' | 'wifi' | 'property' | 'mgl';

export type BillStatus = 'paid' | 'pending' | 'overdue' | 'draft';

export type PaymentMode = 'cash' | 'bank' | 'upi' | 'card' | 'cheque' | 'other';

export interface BaseBill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: Date;
  status: BillStatus;
  category: BillCategory;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidDate?: Date;
  paymentMode?: PaymentMode;
  receiptUrl?: string;
  isRecurring: boolean;
  recurrenceFrequency?: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  tags?: string[];
}

// Electric Bill (with meter readings)
export interface ElectricBill extends BaseBill {
  category: 'electric';
  consumerNumber: string;
  consumerName?: string;
  billingUnitNumber?: string;
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
  billMonth: string; // "June 2023"
  lastReading: number;
  currentReading: number;
  totalUnits: number;
  billDocumentURL?: string;
  slabRates?: SlabRate[];
  powerFactor?: number;
  fixedCharges: number;
  electricityDuty: number;
  taxAmount: number;
  surcharge?: number;
}

export interface SlabRate {
  from: number;
  to: number;
  rate: number;
}

// Water Bill
export interface WaterBill extends BaseBill {
  category: 'water';
  consumerNumber: string;
  location: 'pune' | 'nashik' | 'other';
  billPeriodStart: Date;
  billPeriodEnd: Date;
  waterUsage: number;
  meterReading: number;
  connectionType: 'domestic' | 'commercial' | 'industrial';
}

// Gas Bill (MGL)
export interface GasBill extends BaseBill {
  category: 'gas';
  consumerNumber: string;
  connectionType: 'domestic' | 'commercial';
  cylinderCount?: number;
  cylinderSize?: '14.2kg' | '5kg' | '19kg';
  consumption?: number;
  gstNumber?: string;
}

// WiFi Bill
export interface WifiBill extends BaseBill {
  category: 'wifi';
  provider: string;
  planName: string;
  planSpeed: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  macAddress?: string;
  ipAddress?: string;
  dataUsageGB?: number;
  unlimitedPlan: boolean;
}

// Property Tax Bill
export interface PropertyTaxBill extends BaseBill {
  category: 'property';
  propertyId: string;
  propertyAddress: string;
  propertyType: 'residential' | 'commercial' | 'mixed';
  areaSqFt: number;
  taluka: string;
  village: string;
  surveyNumber: string;
  taxYear: number;
  assessmentYear: number;
  ownerName: string;
}

// Union type for all bill types
export type Bill = ElectricBill | WaterBill | GasBill | WifiBill | PropertyTaxBill;

// Bill summary stats
export interface BillStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byCategory: Record<BillCategory, CategoryStats>;
}

export interface CategoryStats {
  count: number;
  totalAmount: number;
  avgAmount: number;
}

// ============================================
// VEHICLE TYPES
// ============================================
export type VehicleType = 'car' | 'bike' | 'truck' | 'other';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  registrationExpiry: Date;
  insuranceExpiry: Date;
  pucExpiry?: Date;
  fuelType: FuelType;
  mileage?: number; // km/l
  odometerReading?: number;
  fuelTankCapacity?: number;
  color?: string;
  vin?: string;
  engineNumber?: string;
  chassisNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  notes?: string;
  isActive: boolean;
  images: string[]; // URLs to stored images
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
  // Service tracking
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  // Compliance document URLs
  insuranceDocumentUrl?: string;
  pucDocumentUrl?: string;
  registrationDocumentUrl?: string;
  serviceDocumentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceReceipt {
  id: string;
  url: string;
  type: 'image' | 'pdf';
  uploadedAt: Date;
  name?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId?: string;
  applianceId?: string;
  userId: string;
  serviceDate: Date;
  serviceType: 'repair' | 'maintenance' | 'warranty' | 'inspection' | 'other' | 'regular' | 'annual' | 'emergency';
  cost: number;
  provider: string;
  description?: string;
  notes?: string;
  receipts: ServiceReceipt[];
  // Vehicle-specific fields
  serviceCenter?: string;
  mechanic?: string;
  partsReplaced?: string[];
  mileageAtService?: number;
  nextServiceDue?: Date;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleServiceHistory extends ServiceRecord {
  vehicleId: string;
}

export interface VehicleStats {
  totalVehicles: number;
  activeVehicles: number;
  insuranceExpiringCount: number;
  pucExpiringCount: number;
  serviceDueCount: number;
  totalSpentOnServices: number;
  upcomingServices: VehicleServiceUpcoming[];
}

export interface VehicleServiceUpcoming {
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  dueDate: Date;
  daysLeft: number;
  estimatedCost?: number;
}

// ============================================
// APPLIANCE TYPES
// ============================================
export type ApplianceCategory =
  | 'kitchen' // refrigerator, microwave, mixer, etc.
  | 'living' // TV, AC, heater, etc.
  | 'bedroom' // washing machine, iron, etc.
  | 'bathroom' // geyser, hair dryer, etc.
  | 'other';

export interface Appliance {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  modelNumber?: string;
  serialNumber?: string;
  category: ApplianceCategory;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue?: number;
  warrantyExpiry?: Date;
  amcExpiry?: Date;
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
  images: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplianceServiceHistory extends ServiceRecord {
  applianceId: string;
}

export interface ApplianceStats {
  totalAppliances: number;
  activeAppliances: number;
  totalPurchaseCost: number;
  totalServiceSpent: number;
  warrantyExpiringCount: number;
  amcExpiringCount: number;
}

// ============================================
// CONSUMER MANAGEMENT (Electric Bills)
// ============================================
export interface Consumer {
  id: string;
  userId: string;
  consumerNumber: string;
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
  holderName: string;
  billingUnitNumber: string;
  area: string;
  registeredMobile: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SYSTEM TYPES
// ============================================
export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface BackupJob {
  id: string;
  userId: string;
  type: 'full' | 'incremental' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  sizeBytes: number;
  fileCount: number;
  errorMessage?: string;
  downloadUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'bill_due' | 'service_due' | 'insurance_expiry' | 'system' | 'promotional';
  read: boolean;
  scheduledFor: Date;
  sentAt?: Date;
  data?: Record<string, any>;
}

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
export interface DashboardMetric {
  id: string;
  userId: string;
  title: string;
  value: number | string;
  unit: string;
  icon: string;
  color: string;
  category: 'utility' | 'vehicle' | 'appliance' | 'system' | 'custom';
  timestamp: Date;
  trend?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface SpendingTrend {
  month: string;
  value: number;
  categoryBreakdown?: Record<BillCategory, number>;
}

export interface HealthScore {
  overall: number; // 0-100
  bills: number;
  vehicles: number;
  appliances: number;
  factors: {
    overdueBills: number;
    upcomingServices: number;
    expiredDocuments: number;
    maintenanceCosts: number;
  };
}

// ============================================
// UI / NAVIGATION TYPES
// ============================================
export type TabParamList = {
  index: undefined;
  explore: undefined;
  vehicles: undefined;
  bills: undefined;
  appliances: undefined;
  profile: undefined;
};

export type StackParamList = {
  root: undefined;
  login: undefined;
  dashboard: undefined;
  billDetails: { billId: string; category: BillCategory };
  vehicleDetails: { vehicleId: string };
  applianceDetails: { applianceId: string };
  addBill: { category?: BillCategory };
  addVehicle: undefined;
  addAppliance: undefined;
  serviceHistory: { parentId: string; type: 'vehicle' | 'appliance' };
  settings: undefined;
  analytics: undefined;
};

// ============================================
// FORM TYPES
// ============================================
export interface BillFormValues {
  title: string;
  amount: number;
  dueDate: Date;
  status: BillStatus;
  category: BillCategory;
  notes?: string;
  paymentMode?: PaymentMode;
  isRecurring: boolean;
  recurrenceFrequency?: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  tags?: string[];

  // Category-specific
  consumerNumber?: string;
  location?: string;
  billingUnitNumber?: string;
  billMonth?: string;
  lastReading?: number;
  currentReading?: number;
  totalUnits?: number;
  billDocument?: any; // File
  provider?: string;
  planName?: string;
  propertyAddress?: string;
}

export interface VehicleFormValues {
  name: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  registrationExpiry: Date;
  insuranceExpiry: Date;
  pucExpiry?: Date;
  fuelType: FuelType;
  mileage?: number;
  odometerReading?: number;
  fuelTankCapacity?: number;
  color?: string;
  vin?: string;
  engineNumber?: string;
  chassisNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  notes?: string;
  images?: any[];
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
}

export interface ApplianceFormValues {
  name: string;
  brand: string;
  model: string;
  modelNumber?: string;
  serialNumber?: string;
  category: ApplianceCategory;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue?: number;
  warrantyExpiry?: Date;
  amcExpiry?: Date;
  notes?: string;
  images?: any[];
  location: 'pune' | 'nashik' | 'jalgaon' | 'other';
}

export interface ServiceRecordFormValues {
  serviceDate: Date;
  serviceType: 'repair' | 'maintenance' | 'warranty' | 'inspection' | 'other';
  provider: string;
  cost: number;
  description?: string;
  notes?: string;
  receipts?: any[];
}

// ============================================
// API / NETWORK TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// STORE TYPES
// ============================================
export interface BillsStoreState {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  selectedCategory: BillCategory | 'all';
  selectedStatus: BillStatus | 'all';
  searchQuery: string;
  sortBy: 'dueDate' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  filters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    minAmount?: number;
    maxAmount?: number;
  };
}

export interface VehiclesStoreState {
  vehicles: Vehicle[];
  serviceHistory: ServiceRecord[];
  loading: boolean;
  error: string | null;
  selectedLocation: 'pune' | 'nashik' | 'all';
  searchQuery: string;
  filterActive: 'all' | 'active' | 'inactive';
}

export interface AppliancesStoreState {
  appliances: Appliance[];
  serviceHistory: ApplianceServiceHistory[];
  loading: boolean;
  error: string | null;
  selectedLocation: 'pune' | 'nashik' | 'all';
  searchQuery: string;
}

export interface UIStoreState {
  theme: 'light' | 'dark' | 'auto';
  isOffline: boolean;
  isSyncing: boolean;
  activeModal: string | null;
  activeDrawer: string | null;
  toasts: Toast[];
  snackbars: Snackbar[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface Snackbar {
  id: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
}

// ============================================
// OFFLINE & SYNC TYPES
// ============================================
export interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: number;
  syncing: boolean;
  error?: string;
}

// ============================================
// CHART & VISUALIZATION TYPES
// ============================================
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface LineChartDataset {
  key: string;
  label: string;
  data: ChartDataPoint[];
  color: string;
  strokeWidth?: number;
  fill?: boolean;
}

// ============================================
// FILE UPLOAD TYPES
// ============================================
export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number; // 0-100
  totalBytes: number;
  uploadedBytes: number;
  status: 'uploading' | 'completed' | 'error' | 'pending';
  url?: string;
  error?: string;
}

// ============================================
// SEARCH TYPES
// ============================================
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: {
    field: string;
    snippets: string[];
  }[];
}

export interface SearchFilters {
  query: string;
  categories?: BillCategory[];
  status?: BillStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  locations?: string[];
}

// All types are exported individually at their declarations above.
// No re-export needed.
