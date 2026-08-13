import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "users.json");

const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sayandeepvirat10@gmail.com";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VALID_ROLES = ["admin", "procurement_manager", "site_engineer", "quality_inspector", "sustainability_officer", "viewer"];
const ROLE_LABELS = {
  admin: "Administrator",
  procurement_manager: "Procurement Manager",
  site_engineer: "Site Engineer",
  quality_inspector: "Quality Inspector",
  sustainability_officer: "Sustainability Officer",
  viewer: "Viewer (read-only)",
};

function loadUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function saveUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

async function seedIfEmpty() {
  if (fs.existsSync(DATA_FILE)) return;
  const seedAccounts = [
    ["System Administrator", "admin@tscm.local", "admin", "IT"],
    ["Priya Sharma", "priya@tscm.local", "procurement_manager", "Procurement"],
    ["Arjun Mehta", "arjun@tscm.local", "site_engineer", "Construction"],
    ["Kavya Reddy", "kavya@tscm.local", "quality_inspector", "Quality"],
    ["Rohan Iyer", "rohan@tscm.local", "sustainability_officer", "Sustainability"],
    ["Neha Gupta", "neha@tscm.local", "viewer", "Planning"],
  ];
  const users = await Promise.all(seedAccounts.map(async ([full_name, email, role, department]) => ({
    user_id: crypto.randomUUID(),
    full_name, email, role, department,
    password_hash: await bcrypt.hash("demo1234", 10),
    status: "active",
    token: null,
    token_expires: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
  })));
  saveUsers(users);
}
await seedIfEmpty();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function htmlPage(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0D1117;color:#E8ECF2;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .card{background:#151B23;border:1px solid #2A3341;border-radius:14px;padding:36px 42px;max-width:440px;text-align:center}
  h1{font-size:18px;margin:0 0 10px}
  p{color:#8A95A6;font-size:14px;line-height:1.5;margin:0}
</style></head>
<body><div class="card"><h1>${esc(title)}</h1><p>${body}</p></div></body></html>`;
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role, department } = req.body || {};
    if (!full_name || !String(full_name).trim()) return res.status(400).json({ error: "Full name is required." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "A valid email is required." });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

    const safeRole = VALID_ROLES.includes(role) ? role : "viewer";
    const normEmail = String(email).trim().toLowerCase();

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === normEmail)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(24).toString("hex");
    const user = {
      user_id: crypto.randomUUID(),
      full_name: String(full_name).trim().slice(0, 120),
      email: normEmail,
      role: safeRole,
      department: (department ? String(department).trim() : "").slice(0, 120) || "—",
      password_hash,
      status: "pending",
      token,
      token_expires: Date.now() + TOKEN_TTL_MS,
      last_login_at: null,
      created_at: new Date().toISOString(),
    };
    const verifyUrl = `${PUBLIC_BASE_URL}/api/auth/verify/${token}`;
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: ADMIN_EMAIL,
      subject: `Transmission SCM: approve new account request`,
      html: `
        <p>A new account is awaiting your approval.</p>
        <ul>
          <li><b>Name:</b> ${esc(user.full_name)}</li>
          <li><b>Email:</b> ${esc(user.email)}</li>
          <li><b>Role requested:</b> ${esc(ROLE_LABELS[user.role] || user.role)}</li>
          <li><b>Department:</b> ${esc(user.department)}</li>
        </ul>
        <p><a href="${verifyUrl}">Click here to verify and activate this account</a></p>
        <p style="color:#8A95A6;font-size:12px">This link expires in 7 days. If you don't recognize this request, ignore this email.</p>
      `,
    });

    // Only persist the account once the verification email has actually gone out —
    // otherwise a failed send would silently strand a pending account nobody can approve.
    users.push(user);
    saveUsers(users);

    res.json({ ok: true, status: "pending_verification" });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.get("/api/auth/verify/:token", (req, res) => {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.token === req.params.token);

  if (idx === -1) {
    return res.status(404).send(htmlPage("Link not found", "This verification link is invalid or has already been used."));
  }
  const user = users[idx];
  if (user.status !== "pending") {
    return res.send(htmlPage("Already handled", `${esc(user.full_name)}'s account is already ${esc(user.status)}.`));
  }
  if (Date.now() > user.token_expires) {
    return res.status(410).send(htmlPage("Link expired", "This verification link has expired. Ask the user to register again."));
  }

  user.status = "active";
  user.token = null;
  user.token_expires = null;
  users[idx] = user;
  saveUsers(users);

  return res.send(htmlPage("Account approved", `${esc(user.full_name)} (${esc(user.email)}) can now sign in.`));
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const users = loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return res.status(401).json({ error: "No account found with that email." });
    if (user.status === "pending") return res.status(403).json({ error: "This account is awaiting admin verification. You'll get access once approved." });
    if (user.status !== "active") return res.status(403).json({ error: "This account has been deactivated." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Incorrect password." });

    user.last_login_at = new Date().toISOString();
    saveUsers(users);

    const { password_hash, token, token_expires, ...safeUser } = user;
    res.json({ ok: true, user: safeUser });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

app.listen(PORT, () => console.log(`Auth backend listening on http://localhost:${PORT}`));
