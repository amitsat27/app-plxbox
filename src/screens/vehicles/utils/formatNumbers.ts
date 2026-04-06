/**
 * Number formatting utilities for vehicle data display
 */

export function formatOdometer(km: number): string {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1).replace(/\.0$/, '')}k km`;
  }
  return `${km.toLocaleString('en-IN')} km`;
}

export function formatMileage(value: number): string {
  return `${value} km/l`;
}

export function formatTankCapacity(value: number): string {
  return `${value} L`;
}
