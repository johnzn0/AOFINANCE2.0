import { auth } from './firebase';

const TOKEN_KEY = 'aofinance_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const storedToken = getStoredToken();
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  } else if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn('Failed to get auth token', e);
    }
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    if (storedToken && (res.status === 401 || res.status === 404)) {
      removeStoredToken();
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function registerWithApi(email: string, pass: string, name?: string) {
  const data = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass, name }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function loginWithApi(email: string, pass: string) {
  const data = await fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function getCurrentUserProfile() {
  return fetchWithAuth('/api/auth/me', { method: 'GET' });
}

export async function syncUserWithCloudSql() {
  return fetchWithAuth('/api/auth/sync', { method: 'POST' });
}

export async function loadStateFromCloudSql() {
  const data = await fetchWithAuth('/api/user/state', { method: 'GET' });
  return data.state;
}

export async function saveStateToCloudSql(state: any) {
  return fetchWithAuth('/api/user/state', {
    method: 'POST',
    body: JSON.stringify({ state }),
  });
}

export async function fetchAdminUsers() {
  return fetchWithAuth('/api/admin/users', { method: 'GET' });
}

export async function updateAdminUser(targetUid: string, data: any) {
  return fetchWithAuth(`/api/admin/users/${targetUid}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
