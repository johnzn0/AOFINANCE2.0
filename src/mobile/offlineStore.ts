/**
 * Mobile Offline Cache Manager
 * Caches categories, transactions, accounts, profile, and settings locally for instant loading and offline fallback on Android and iOS.
 */

import { AppState, UserProfile } from '../types';

const OFFLINE_CACHE_KEY = 'aofinance_mobile_offline_cache_v1';
const PROFILE_CACHE_KEY = 'aofinance_mobile_profile_cache_v1';
const SYNC_TIMESTAMP_KEY = 'aofinance_mobile_last_sync_v1';

export interface OfflineSyncStatus {
  lastSyncedAt: Date | null;
  isOnline: boolean;
  hasCachedData: boolean;
}

export function saveStateToOfflineCache(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(OFFLINE_CACHE_KEY, serialized);
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[OfflineStore] Error saving offline state:', err);
  }
}

export function loadStateFromOfflineCache(): AppState | null {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch (err) {
    console.warn('[OfflineStore] Error loading offline state:', err);
    return null;
  }
}

export function saveProfileToOfflineCache(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[OfflineStore] Error saving offline profile:', err);
  }
}

export function loadProfileFromOfflineCache(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.warn('[OfflineStore] Error loading offline profile:', err);
    return null;
  }
}

export function getOfflineSyncStatus(): OfflineSyncStatus {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const lastSyncStr = localStorage.getItem(SYNC_TIMESTAMP_KEY);
  const hasCachedData = !!localStorage.getItem(OFFLINE_CACHE_KEY);

  return {
    isOnline,
    lastSyncedAt: lastSyncStr ? new Date(lastSyncStr) : null,
    hasCachedData,
  };
}
