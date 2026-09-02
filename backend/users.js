import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "users.json");

export const VALID_ROLES = ["admin", "procurement_manager", "site_engineer", "quality_inspector", "sustainability_officer", "viewer"];

let warnedNoPersistence = false;
function warnNoPersistence() {
  if (warnedNoPersistence) return;
  warnedNoPersistence = true;
  console.warn("DATABASE_URL not set — user accounts are stored on local disk and will NOT persist across deploys.");
}

function rowToUser(row) {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    department: row.department,
    password_hash: row.password_hash,
    status: row.status,
    token: row.verify_token,
    token_expires: row.verify_token_expires ? new Date(row.verify_token_expires).getTime() : null,
    last_login_at: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function loadUsersFromFile() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveUsersToFile(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

export async function loadUsers() {
  if (!pool) {
    warnNoPersistence();
    return loadUsersFromFile();
  }
  const { rows } = await pool.query(`SELECT * FROM users ORDER BY created_at`);
  return rows.map(rowToUser);
}

// Persists the whole array, matching the JSON-file behaviour callers already
// rely on (load full list, mutate, save full list back).
export async function saveUsers(users) {
  if (!pool) {
    warnNoPersistence();
    saveUsersToFile(users);
    return;
  }
  for (const u of users) {
    await pool.query(
      `INSERT INTO users
         (user_id, full_name, email, password_hash, role, department, status,
          verify_token, verify_token_expires, last_login_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11, now()))
       ON CONFLICT (email) DO UPDATE SET
         full_name             = EXCLUDED.full_name,
         password_hash         = EXCLUDED.password_hash,
         role                  = EXCLUDED.role,
         department            = EXCLUDED.department,
         status                = EXCLUDED.status,
         verify_token          = EXCLUDED.verify_token,
         verify_token_expires  = EXCLUDED.verify_token_expires,
         last_login_at         = EXCLUDED.last_login_at,
         updated_at            = now()`,
      [
        u.user_id, u.full_name, u.email, u.password_hash, u.role, u.department || null, u.status,
        u.token || null, u.token_expires ? new Date(u.token_expires) : null,
        u.last_login_at ? new Date(u.last_login_at) : null,
        u.created_at ? new Date(u.created_at) : null,
      ]
    );
  }
}

export async function findUserById(userId) {
  if (!pool) {
    warnNoPersistence();
    return loadUsersFromFile().find((u) => u.user_id === userId) || null;
  }
  const { rows } = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [userId]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function upsertUser(users, { full_name, email, password, role, department }) {
  const normEmail = String(email).trim().toLowerCase();
  const idx = users.findIndex((u) => u.email.toLowerCase() === normEmail);
  const record = {
    user_id: idx === -1 ? crypto.randomUUID() : users[idx].user_id,
    full_name: String(full_name).trim(),
    email: normEmail,
    role: VALID_ROLES.includes(role) ? role : "viewer",
    department: department || users[idx]?.department || "IT",
    password_hash: await bcrypt.hash(password, 10),
    status: "active",
    token: null,
    token_expires: null,
    last_login_at: users[idx]?.last_login_at || null,
    created_at: users[idx]?.created_at || new Date().toISOString(),
  };
  if (idx === -1) users.push(record); else users[idx] = record;
  return record;
}
