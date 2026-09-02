import { pool } from "../db.js";
import { findUserById } from "../users.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing or invalid Authorization header." });

    const { rows } = await pool.query(
      `SELECT user_id, expires_at FROM sessions WHERE token = $1`,
      [token]
    );
    const session = rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }
    const user = await findUserById(session.user_id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Account no longer active." });
    }
    req.userId = user.user_id;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error("auth middleware error:", err);
    res.status(500).json({ error: "Authentication check failed." });
  }
}

export function requireIngestKey(req, res, next) {
  const key = req.headers["x-ingest-key"];
  if (!key || key !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: "Missing or invalid ingest key." });
  }
  next();
}
