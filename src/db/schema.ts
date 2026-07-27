import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('approved'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
});

export const userState = pgTable('user_state', {
  uid: text('uid').primaryKey().references(() => users.uid, { onDelete: 'cascade' }),
  state: jsonb('state').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
