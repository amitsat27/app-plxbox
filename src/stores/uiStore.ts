// 🎨 UI Store - Zustand
// Manages theme, modals, drawers, and global UI state

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Snackbar, Toast } from "../types";

// Persistence disabled for now to avoid AsyncStorage issues

type ThemeMode = "light" | "dark" | "auto";

interface UIState {
  // Theme
  theme: ThemeMode;
  isDarkMode: boolean;

  // Network
  isOffline: boolean;
  isSyncing: boolean;
  syncQueueCount: number;

  // Modals & Drawers
  activeModal: string | null;
  activeDrawer: string | null;
  modalStack: string[];

  // Feedback
  toasts: Toast[];
  snackbars: Snackbar[];
  isLoading: boolean;
  loadingMessage: string;

  // Navigation
  currentTab: string;
  navigationHistory: string[];

  // Actions - Theme
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setIsDarkMode: (isDark: boolean) => void;

  // Actions - Network
  setIsOffline: (offline: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setSyncQueueCount: (count: number) => void;

  // Actions - Modals
  openModal: (modalId: string) => void;
  closeModal: () => void;
  closeModalById: (modalId: string) => void;

  // Actions - Drawers
  openDrawer: (drawerId: string) => void;
  closeDrawer: () => void;
  closeDrawerById: (drawerId: string) => void;

  // Actions - Toast
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (toastId: string) => void;
  clearToasts: () => void;

  // Actions - Snackbar
  showSnackbar: (snackbar: Omit<Snackbar, "id">) => void;
  removeSnackbar: (snackbarId: string) => void;
  clearSnackbars: () => void;

  // Actions - Loading
  showLoading: (message?: string) => void;
  hideLoading: () => void;

  // Actions - Navigation
  setCurrentTab: (tab: string) => void;
  pushToHistory: (route: string) => void;
  popFromHistory: () => void;
  clearHistory: () => void;
}

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useUIStore = create<UIState>()(
  devtools((set, get) => ({
    // Initial state
    theme: "light",
    isDarkMode: false,
    isOffline: false,
    isSyncing: false,
    syncQueueCount: 0,
    activeModal: null,
    activeDrawer: null,
    modalStack: [],
    toasts: [],
    snackbars: [],
    isLoading: false,
    loadingMessage: "",
    currentTab: "index",
    navigationHistory: [],

    // Theme actions
    setTheme: (theme) => set({ theme }),

    toggleTheme: () =>
      set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

    setIsDarkMode: (isDarkMode) => set({ isDarkMode }),

    // Network actions
    setIsOffline: (isOffline) => set({ isOffline }),
    setIsSyncing: (isSyncing) => set({ isSyncing }),
    setSyncQueueCount: (syncQueueCount) => set({ syncQueueCount }),

    // Modal actions
    openModal: (modalId) =>
      set((state) => {
        const newStack = [...state.modalStack, modalId];
        return {
          activeModal: modalId,
          modalStack: newStack,
        };
      }),

    closeModal: () =>
      set((state) => {
        const newStack = state.modalStack.slice(0, -1);
        return {
          activeModal: newStack[newStack.length - 1] || null,
          modalStack: newStack,
        };
      }),

    closeModalById: (modalId) =>
      set((state) => {
        const index = state.modalStack.indexOf(modalId);
        if (index === -1) return state;
        const newStack = state.modalStack.filter((id) => id !== modalId);
        return {
          activeModal: newStack[newStack.length - 1] || null,
          modalStack: newStack,
        };
      }),

    // Drawer actions
    openDrawer: (drawerId) => set({ activeDrawer: drawerId }),
    closeDrawer: () => set({ activeDrawer: null }),
    closeDrawerById: (drawerId) =>
      set((state) =>
        state.activeDrawer === drawerId ? { activeDrawer: null } : state,
      ),

    // Toast actions
    showToast: (toast) => {
      const id = generateId();
      const newToast: Toast = { ...toast, id };
      set((state) => ({
        toasts: [...state.toasts, newToast],
      }));
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 4000);
    },

    removeToast: (toastId) =>
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toastId),
      })),

    clearToasts: () => set({ toasts: [] }),

    // Snackbar actions
    showSnackbar: (snackbar) => {
      const id = generateId();
      const newSnackbar: Snackbar = { ...snackbar, id };
      set((state) => ({
        snackbars: [...state.snackbars, newSnackbar],
      }));
      setTimeout(() => {
        get().removeSnackbar(id);
      }, snackbar.duration || 3000);
    },

    removeSnackbar: (snackbarId) =>
      set((state) => ({
        snackbars: state.snackbars.filter((s) => s.id !== snackbarId),
      })),

    clearSnackbars: () => set({ snackbars: [] }),

    // Loading actions
    showLoading: (message = "Loading...") =>
      set({ isLoading: true, loadingMessage: message }),

    hideLoading: () => set({ isLoading: false, loadingMessage: "" }),

    // Navigation actions
    setCurrentTab: (currentTab) => set({ currentTab }),
    pushToHistory: (route) =>
      set((state) => ({
        navigationHistory: [...state.navigationHistory, route],
      })),
    popFromHistory: () =>
      set((state) => {
        const newHistory = state.navigationHistory.slice(0, -1);
        return {
          navigationHistory: newHistory,
          currentTab: newHistory[newHistory.length - 1] || "index",
        };
      }),
    clearHistory: () => set({ navigationHistory: [] }),
  })),
);

// Selectors
export const selectTheme = (state: UIState) => state.theme;
export const selectIsDarkMode = (state: UIState) => state.isDarkMode;
export const selectIsOffline = (state: UIState) => state.isOffline;
export const selectIsLoading = (state: UIState) => state.isLoading;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectActiveDrawer = (state: UIState) => state.activeDrawer;
export const selectToasts = (state: UIState) => state.toasts;
export const selectSnackbars = (state: UIState) => state.snackbars;

// Helper hooks
export const useTheme = () => {
  const theme = useUIStore(selectTheme);
  const isDarkMode = useUIStore(selectIsDarkMode);
  return { theme, isDarkMode };
};

export const useOffline = () => {
  const isOffline = useUIStore(selectIsOffline);
  const isSyncing = useUIStore((state) => state.isSyncing);
  return { isOffline, isSyncing };
};
