export interface ApplianceAlert {
  id: string;
  type: 'warranty' | 'amc';
  severity: 'critical' | 'warning' | 'info';
  applianceId: string;
  applianceName: string;
  message: string;
  dueDate: Date;
  daysLeft: number;
}

export interface SmartInsight {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

export interface CategoryFilterOption {
  key: string;
  label: string;
  icon: any;
}
