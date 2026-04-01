/**
 * Number formatting utilities for Pulsebox
 * Handles currency, compact numbers, and percentages with Indian locale support
 */

/**
 * Format number as Indian Rupee currency
 * Example: 1234567 -> ₹12,34,567
 */
export const formatCurrency = (value: number, minimumFractionDigits = 0): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits: 2,
    // Use compact notation for large numbers on smaller screens
    notation: 'standard',
  }).format(value).replace('₹', '₹');
};

/**
 * Format number with Indian comma separators
 * Example: 1234567 -> 12,34,567
 */
export const formatNumberIndian = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN').format(value);
};

/**
 * Format number in compact form (K, L, Cr)
 * Example: 1500000 -> ₹15L
 */
export const formatCompactCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value) || value === 0) {
    return '₹0';
  }

  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 10000000) {
    // Crores
    formatted = (absValue / 10000000).toFixed(2) + 'Cr';
  } else if (absValue >= 100000) {
    // Lakhs
    formatted = (absValue / 100000).toFixed(2) + 'L';
  } else if (absValue >= 1000) {
    // Thousands
    formatted = (absValue / 1000).toFixed(1) + 'K';
  } else {
    formatted = absValue.toFixed(0);
  }

  return (value < 0 ? '-' : '') + formatted;
};

/**
 * Format percentage with proper decimal places
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format compact number without currency
 */
export const formatCompactNumber = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value) || value === 0) {
    return '0';
  }

  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 10000000) {
    formatted = (absValue / 10000000).toFixed(2) + 'Cr';
  } else if (absValue >= 100000) {
    formatted = (absValue / 100000).toFixed(2) + 'L';
  } else if (absValue >= 1000) {
    formatted = (absValue / 1000).toFixed(1) + 'K';
  } else {
    formatted = absValue.toFixed(0);
  }

  return (value < 0 ? '-' : '') + formatted;
};

/**
 * Format date range for charts (e.g., "Jan 2024")
 */
export const formatMonthYear = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format short month (e.g., "Jan")
 */
export const formatMonthShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
  });
};

export default {
  formatCurrency,
  formatNumberIndian,
  formatCompactCurrency,
  formatPercentage,
  formatCompactNumber,
  formatMonthYear,
  formatMonthShort,
};
