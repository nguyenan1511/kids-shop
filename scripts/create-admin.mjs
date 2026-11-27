#!/usr/bin/env node
// Create (or promote) an admin account.
// Usage: node scripts/create-admin.mjs <username-or-email> <password>
//   A plain username like "admin" becomes "admin@thanhchi.local" (same rule as the login form).
// The password is only sent to your own Supabase project.
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { loadEnv } from "./env.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
loadEnv(root);

const [login, password] = process.argv.slice(2);
if (!login || !password) {
  console.error("Usage: node scripts/create-admin.mjs <username-or-email> <password>");
  process.exit(1);
}
const email = login.includes("@") ? login.trim().toLowerCase() : `${login.trim().toLowerCase()}@thanhchi.local`;
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let userId;
const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  // Already exists → find and promote.
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error(error.message);
    process.exit(1);
  }
  userId = existing.id;
} else {
  userId = created.user.id;
}

const { error: insErr } = await db.from("admins").upsert({ user_id: userId, email: email.toLowerCase() });
if (insErr) {
  console.error(insErr.message);
  process.exit(1);
}
console.log(`Admin ready: ${email}`);
