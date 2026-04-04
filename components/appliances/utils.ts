/**
 * Appliance Utilities
 * Image mapping, date helpers, formatting
 */

import { ApplianceCategory, Appliance } from '@/src/types';

const UNSPLASH_IMAGES: Record<string, string> = {
  refrigerator: 'photo-1584568694244-14fbdf584541',
  fridge: 'photo-1584568694244-14fbdf584541',
  'washing machine': 'photo-1626806787461-102c1bfaaea1',
  washer: 'photo-1626806787461-102c1bfaaea1',
  tv: 'photo-1593359677879-a4bb92f829d1',
  television: 'photo-1593359677879-a4bb92f829d1',
  'air conditioner': 'photo-1631545806609-45648fce71a7',
  ac: 'photo-1631545806609-45648fce71a7',
  microwave: 'photo-1574269909862-7e1d70bb8078',
  oven: 'photo-1585232350486-a334d759e6b7',
  geyser: 'photo-1616486338812-3dadae4b4ace',
  'water heater': 'photo-1616486338812-3dadae4b4ace',
  dishwasher: 'photo-1582735689369-4fe89db7114c',
  fan: 'photo-1573698873520-9e5e46e45209',
  iron: 'photo-1585232350486-a334d759e6b7',
  mixer: 'photo-1594917467028-e5c99f60366b',
  blender: 'photo-1594917467028-e5c99f60366b',
  speaker: 'photo-1608043162065-9054e9e8d3e9',
  monitor: 'photo-1527443225639-0719303f7f2d',
  default: 'photo-1556909114-f6e7ad7d3136',
};

const CATEGORY_ICONS: Record<ApplianceCategory, string> = {
  kitchen: '🍳',
  living: '📺',
  bedroom: '👕',
  bathroom: '🚿',
  other: '🏠',
};

const CATEGORY_LABELS: Record<ApplianceCategory, string> = {
  kitchen: 'Kitchen',
  living: 'Living Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  other: 'Other',
};

/**
 * Get an Unsplash image URL for an appliance based on name + category
 */
export function getApplianceImage(appliance: Partial<Appliance>): string | null {
  // Return user-uploaded image if available
  if (appliance.images?.[0]) return appliance.images[0];

  const name = (appliance.name || '').toLowerCase();

  for (const [keyword, imageId] of Object.entries(UNSPLASH_IMAGES)) {
    if (name.includes(keyword)) {
      return `https://images.unsplash.com/${imageId}?w=400&q=80`;
    }
  }

  // Fallback: category default
  const category = appliance.category || 'other';
  const categoryImages: Record<string, string> = {
    kitchen: 'photo-1556909114-f6e7ad7d3136',
    living: 'photo-1593359677879-a4bb92f829d1',
    bedroom: 'photo-1585232350486-a334d759e6b7',
    bathroom: 'photo-1616486338812-3dadae4b4ace',
    other: 'photo-1556909114-f6e7ad7d3136',
  };
  return `https://images.unsplash.com/${categoryImages[category] || UNSPLASH_IMAGES.default}?w=400&q=80`;
}

export function getCategoryEmoji(category: ApplianceCategory): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
}

export function getCategoryLabel(category: ApplianceCategory): string {
  return CATEGORY_LABELS[category] || 'Other';
}

/** Format Indian Rupees */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Days between two dates */
export function daysBetween(from: Date, to: Date = new Date()): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Years since a date */
export function yearsSince(date: Date): string {
  const years = daysBetween(date) / 365.25;
  if (years < 1) return '< 1 yr';
  return `${Math.floor(years)} yr${Math.floor(years) !== 1 ? 's' : ''}`;
}

/** Format date as short readable string */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
