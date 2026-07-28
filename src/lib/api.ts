const TOKEN_KEY = 'aofinance_auth_token';
const CURRENT_USER_KEY = 'aofinance_current_user';
const LOCAL_USERS_KEY = 'aofinance_local_users';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getLocalUsers(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users: any[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

function saveCurrentLocalUser(user: any) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {}
}

function getCurrentLocalUser(): any | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const storedToken = getStoredToken();
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    if (storedToken && res.status === 401) {
      removeStoredToken();
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function registerWithApi(email: string, pass: string, name?: string) {
  try {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, name }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    if (data.profile) {
      saveCurrentLocalUser(data.profile);
    }
    return data;
  } catch (err: any) {
    // Fallback to local storage auth if server returns 404 or network fails
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const users = getLocalUsers();
      const cleanEmail = email.trim().toLowerCase();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error('Este e-mail já está cadastrado.');
      }
      const newUser = {
        uid: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        email: cleanEmail,
        displayName: name?.trim() || cleanEmail.split('@')[0],
        password: pass,
        role: users.length === 0 ? 'admin' : 'user',
        status: users.length === 0 ? 'approved' : 'pending',
        plan: users.length === 0 ? 'pro' : 'free',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveLocalUsers(users);

      const token = 'local_token_' + newUser.uid;
      setStoredToken(token);
      const { password, ...profile } = newUser;
      saveCurrentLocalUser(profile);
      return { token, profile };
    }
    throw err;
  }
}

export async function loginWithApi(email: string, pass: string) {
  try {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    if (data.profile) {
      saveCurrentLocalUser(data.profile);
    }
    return data;
  } catch (err: any) {
    // Fallback to local storage auth if server returns 404 or network fails
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const users = getLocalUsers();
      const cleanEmail = email.trim().toLowerCase();
      let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        // Auto-create local user on static host first login
        user = {
          uid: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          password: pass,
          role: users.length === 0 ? 'admin' : 'user',
          status: users.length === 0 ? 'approved' : 'pending',
          plan: users.length === 0 ? 'pro' : 'free',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        users.push(user);
        saveLocalUsers(users);
      } else if (user.password && user.password !== pass) {
        throw new Error('E-mail ou senha incorretos.');
      } else {
        user.lastLoginAt = new Date().toISOString();
        saveLocalUsers(users);
      }

      const token = 'local_token_' + user.uid;
      setStoredToken(token);
      const { password, ...profile } = user;
      saveCurrentLocalUser(profile);
      return { token, profile };
    }
    throw err;
  }
}

export async function resetPasswordWithApi(email: string, newPassword?: string) {
  try {
    return await fetchWithAuth('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const users = getLocalUsers();
      const cleanEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (user && newPassword) {
        user.password = newPassword;
        saveLocalUsers(users);
      }
      return { message: 'Senha redefinida com sucesso localmente.' };
    }
    throw err;
  }
}

export async function getCurrentUserProfile() {
  try {
    const profile = await fetchWithAuth('/api/auth/me', { method: 'GET' });
    if (profile) {
      saveCurrentLocalUser(profile);
    }
    return profile;
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const stored = getCurrentLocalUser();
      if (stored) return stored;
      const token = getStoredToken();
      if (token) {
        const users = getLocalUsers();
        const found = users.find((u) => token.includes(u.uid));
        if (found) {
          const { password, ...prof } = found;
          return prof;
        }
      }
      return null;
    }
    throw err;
  }
}

export async function syncUserWithCloudSql() {
  try {
    return await fetchWithAuth('/api/auth/sync', { method: 'POST' });
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      return getCurrentLocalUser();
    }
    throw err;
  }
}

export async function loadStateFromCloudSql() {
  try {
    const data = await fetchWithAuth('/api/user/state', { method: 'GET' });
    return data.state;
  } catch (err) {
    return null;
  }
}

export async function saveStateToCloudSql(state: any) {
  try {
    return await fetchWithAuth('/api/user/state', {
      method: 'POST',
      body: JSON.stringify({ state }),
    });
  } catch (err) {
    return { success: true };
  }
}

export async function fetchAdminUsers() {
  try {
    return await fetchWithAuth('/api/admin/users', { method: 'GET' });
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const users = getLocalUsers();
      return users.map(({ password, ...u }) => u);
    }
    throw err;
  }
}

export async function updateAdminUser(targetUid: string, data: any) {
  try {
    return await fetchWithAuth(`/api/admin/users/${targetUid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.uid === targetUid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        saveLocalUsers(users);
        const { password, ...prof } = users[idx];
        return prof;
      }
      return data;
    }
    throw err;
  }
}

export async function deleteAdminUser(targetUid: string) {
  try {
    return await fetchWithAuth(`/api/admin/users/${targetUid}`, {
      method: 'DELETE',
    });
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      let users = getLocalUsers();
      users = users.filter((u) => u.uid !== targetUid);
      saveLocalUsers(users);
      return { success: true };
    }
    throw err;
  }
}

