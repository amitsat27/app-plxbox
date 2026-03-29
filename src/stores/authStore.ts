// 🔐 Auth Store - Zustand
// Manages user authentication and profile state

import { create } from 'zustand';
import type { User, UserProfile, UserPreferences } from '../types';

// Persistence disabled for now to avoid AsyncStorage issues

interface AuthState {
  // State
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    // Initial state
    user: null,
    profile: null,
    loading: true,
    error: null,
    isAuthenticated: false,

    // Actions
    setUser: (user) =>
      set({
        user,
        isAuthenticated: !!user,
        loading: false,
        error: null,
      }),

    setProfile: (profile) => set({ profile }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    updatePreferences: (preferences) =>
      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              preferences: { ...state.user.preferences, ...preferences },
            }
          : null,
        profile: state.profile
          ? {
              ...state.profile,
              preferences: { ...state.profile.preferences, ...preferences },
            }
          : null,
      })),

    updateProfile: (updates) =>
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        user: state.user ? { ...state.user, ...updates } : null,
      })),

    logout: () =>
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      }),
  })
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectProfile = (state: AuthState) => state.profile;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectLoading = (state: AuthState) => state.loading;
export const selectError = (state: AuthState) => state.error;
