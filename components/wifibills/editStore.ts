/**
 * Shared store for edit-triggered navigation between WiFi bill screens
 * Detail screen sets this and navigates back; list screen reads on focus
 */

export const pendingWifiEdit: { current: string; city: string } = { current: "", city: "" };

export function markWifiBillForEdit(id: string, city: string) {
  pendingWifiEdit.current = id;
  pendingWifiEdit.city = city;
}
