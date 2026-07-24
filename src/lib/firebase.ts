import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState, UserProfile, UserRole, UserStatus, UserPlan } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Primary Admin Email
export const ADMIN_EMAIL = 'johnozzi21@gmail.com';

// User profile management
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(db, 'user_profiles', user.uid);
  const snap = await getDoc(profileRef);

  const isAdminEmail = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    // Update last login
    const updated: UserProfile = {
      ...existing,
      lastLoginAt: new Date().toISOString(),
      displayName: user.displayName || existing.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL || existing.photoURL,
      // Ensure primary admin email remains admin & approved
      role: isAdminEmail ? 'admin' : existing.role || 'user',
      status: isAdminEmail ? 'approved' : existing.status || 'pending',
      plan: isAdminEmail ? 'pro' : existing.plan || 'free',
    };
    await setDoc(profileRef, updated, { merge: true });
    return updated;
  } else {
    // New User profile
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoURL: user.photoURL || undefined,
      role: isAdminEmail ? 'admin' : 'user',
      status: isAdminEmail ? 'approved' : 'pending',
      plan: isAdminEmail ? 'pro' : 'free',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await setDoc(profileRef, newProfile);
    return newProfile;
  }
}

export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  const profileRef = doc(db, 'user_profiles', uid);
  return onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const usersColRef = collection(db, 'user_profiles');
  return onSnapshot(usersColRef, (snap) => {
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as UserProfile);
    });
    // Sort by createdAt desc
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export async function updateUserStatus(uid: string, status: UserStatus, role?: UserRole, plan?: UserPlan) {
  const profileRef = doc(db, 'user_profiles', uid);
  const updates: Partial<UserProfile> = { status };
  if (role) updates.role = role;
  if (plan) updates.plan = plan;
  await setDoc(profileRef, updates, { merge: true });
}

// App State Firestore Sync
export async function saveStateToFirestore(userId: string, state: AppState) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        updatedAt: new Date().toISOString(),
        state,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving state to Firestore:', err);
  }
}

export async function loadStateFromFirestore(userId: string): Promise<AppState | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.state) {
      return snap.data().state as AppState;
    }
  } catch (err) {
    console.error('Error loading state from Firestore:', err);
  }
  return null;
}

export function subscribeToFirestoreState(userId: string, callback: (state: AppState) => void) {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(userDocRef, (snap) => {
    if (snap.exists() && snap.data()?.state) {
      callback(snap.data().state as AppState);
    }
  });
}
