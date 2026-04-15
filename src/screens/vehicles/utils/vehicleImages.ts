/**
 * Vehicle image URLs from Unsplash (free, no API key needed)
 * Optimized for mobile: w=600, h=400, fit=crop, quality=80
 */

import type { VehicleType, FuelType } from '@/src/types';

const VEHICLE_IMAGE_MAP: Record<VehicleType, string> = {
  car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop&q=80',
  bike: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
  truck: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&h=400&fit=crop&q=80',
};

const FALLBACK_GRADIENTS: Record<VehicleType, [string, string]> = {
  car: ['#3B82F6', '#93C5FD'],
  bike: ['#10B981', '#6EE7B7'],
  truck: ['#F59E0B', '#FCD34D'],
  other: ['#7C3AED', '#C4B5FD'],
};

export const FUEL_EMOJI_MAP: Record<FuelType, string> = {
  petrol: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🌿',
  cng: '🔵',
  lpg: '🔵',
};

export function getVehicleImageUrl(type: VehicleType, index?: number): string {
  const base = VEHICLE_IMAGE_MAP[type] || VEHICLE_IMAGE_MAP.other;
  return index ? `${base}&sig=${index}` : base;
}

export function getVehicleFallbackGradient(type: VehicleType): [string, string] {
  return FALLBACK_GRADIENTS[type] || FALLBACK_GRADIENTS.other;
}
