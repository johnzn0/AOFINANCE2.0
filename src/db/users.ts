import { db } from './index.ts';
import { users, userState } from './schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const ADMIN_EMAIL = 'johnozzi21@gmail.com';

export function hashPassword(password: string): string {
  const salt = 'aofinance_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(uid: string, email: string): string {
  const secret = process.env.JWT_SECRET || 'aofinance_secret_token_key_2026';
  const payload = JSON.stringify({ uid, email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifyToken(token: string): { uid: string; email: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'aofinance_secret_token_key_2026';
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;

    return { uid: payload.uid, email: payload.email };
  } catch (err) {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    return user || null;
  } catch (error) {
    console.error('getUserByEmail SQL error:', error);
    return null;
  }
}

export async function registerUserWithEmail(email: string, pass: string, displayName?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await getUserByEmail(cleanEmail);
  if (existing) {
    if (!existing.passwordHash) {
      const newHash = hashPassword(pass);
      const [updated] = await db
        .update(users)
        .set({
          passwordHash: newHash,
          displayName: displayName || existing.displayName,
          lastLoginAt: new Date(),
        })
        .where(eq(users.uid, existing.uid))
        .returning();
      return updated;
    }
    throw new Error('E-mail já cadastrado. Alterne para a aba "Entrar" e digite sua senha.');
  }

  const uid = 'usr_' + crypto.randomBytes(8).toString('hex');
  const passwordHash = hashPassword(pass);
  const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

  const [newUser] = await db
    .insert(users)
    .values({
      uid,
      email: cleanEmail,
      passwordHash,
      displayName: displayName || cleanEmail.split('@')[0],
      role: isAdmin ? 'admin' : 'user',
      status: isAdmin ? 'approved' : 'pending',
      plan: isAdmin ? 'pro' : 'free',
      lastLoginAt: new Date(),
    })
    .returning();

  return newUser;
}

export async function loginUserWithEmail(email: string, pass: string) {
  const cleanEmail = email.toLowerCase().trim();
  let user = await getUserByEmail(cleanEmail);

  if (!user) {
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      // Auto-create admin account on first login attempt
      return await registerUserWithEmail(cleanEmail, pass, 'John Ozzi');
    }
    throw new Error('Usuário não encontrado. Se ainda não tem conta, clique na aba "Criar Conta".');
  }

  if (!user.passwordHash) {
    const newHash = hashPassword(pass);
    const [updated] = await db
      .update(users)
      .set({ passwordHash: newHash, lastLoginAt: new Date() })
      .where(eq(users.uid, user.uid))
      .returning();
    return updated;
  }

  if (!verifyPassword(pass, user.passwordHash)) {
    throw new Error('Senha incorreta.');
  }

  // Update last login
  const [updated] = await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.uid, user.uid))
    .returning();

  return updated;
}

export async function resetUserPasswordWithEmail(email: string, newPassword?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(cleanEmail);
  if (!user) {
    throw new Error('Nenhum usuário cadastrado encontrado com este e-mail.');
  }
  if (newPassword) {
    const newHash = hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.uid, user.uid));
    return { success: true, message: 'Senha redefinida com sucesso!' };
  }
  return { success: true, message: `Solicitação de redefinição registrada para ${cleanEmail}.` };
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoURL?: string) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const defaultRole = isAdmin ? 'admin' : 'user';
    const defaultStatus = isAdmin ? 'approved' : 'pending';
    const defaultPlan = isAdmin ? 'pro' : 'free';

    const [existing] = await db.select().from(users).where(eq(users.uid, uid));

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          email: cleanEmail,
          displayName: displayName || existing.displayName,
          photoURL: photoURL || existing.photoURL,
          role: isAdmin ? 'admin' : existing.role,
          plan: isAdmin ? 'pro' : existing.plan,
          lastLoginAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          uid,
          email: cleanEmail,
          displayName: displayName || '',
          photoURL: photoURL || '',
          role: defaultRole,
          status: defaultStatus,
          plan: defaultPlan,
          lastLoginAt: new Date(),
        })
        .returning();
      return inserted;
    }
  } catch (error) {
    console.error('getOrCreateUser SQL error:', error);
    throw new Error('Failed to get or create user in Cloud SQL', { cause: error });
  }
}

export async function getUserProfileByUid(uid: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || null;
  } catch (error) {
    console.error('getUserProfileByUid SQL error:', error);
    throw new Error('Failed to fetch user profile from Cloud SQL', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('getAllUsers SQL error:', error);
    throw new Error('Failed to fetch users from Cloud SQL', { cause: error });
  }
}

export async function updateUserProfile(uid: string, data: Partial<{ role: string; status: string; plan: string }>) {
  try {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.uid, uid))
      .returning();
    return updated;
  } catch (error) {
    console.error('updateUserProfile SQL error:', error);
    throw new Error('Failed to update user profile in Cloud SQL', { cause: error });
  }
}

export async function deleteUserByUid(uid: string) {
  try {
    await db.delete(userState).where(eq(userState.uid, uid));
    await db.delete(users).where(eq(users.uid, uid));
    return { success: true };
  } catch (error) {
    console.error('deleteUserByUid SQL error:', error);
    throw new Error('Failed to delete user from Cloud SQL', { cause: error });
  }
}

export async function getUserStateByUid(uid: string) {
  try {
    const [record] = await db.select().from(userState).where(eq(userState.uid, uid));
    return record?.state || null;
  } catch (error) {
    console.error('getUserStateByUid SQL error:', error);
    throw new Error('Failed to fetch user state from Cloud SQL', { cause: error });
  }
}

export async function saveUserStateByUid(uid: string, state: any) {
  try {
    await db
      .insert(userState)
      .values({
        uid,
        state,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userState.uid,
        set: {
          state,
          updatedAt: new Date(),
        },
      });
    return { success: true };
  } catch (error) {
    console.error('saveUserStateByUid SQL error:', error);
    throw new Error('Failed to save user state in Cloud SQL', { cause: error });
  }
}
