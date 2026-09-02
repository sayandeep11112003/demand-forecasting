import express from "express";
import { pool } from "../db.js";
import { RESOURCES, RESOURCE_KEYS } from "../resources.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcast } from "../events.js";
import { scheduleRescore } from "./events.js";

const router = express.Router();

function validResource(req, res, next) {
  if (!RESOURCE_KEYS.includes(req.params.resource)) {
    return res.status(404).json({ error: `Unknown resource "${req.params.resource}".` });
  }
  next();
}

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await pool.query(`SELECT resource_key, data FROM records ORDER BY created_at ASC`);
  const db = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, []]));
  for (const row of rows) db[row.resource_key]?.push(row.data);
  res.json({ ok: true, db });
});

router.post("/:resource", requireAuth, validResource, async (req, res) => {
  const { resource } = req.params;
  const { idKey, writeRoles } = RESOURCES[resource];
  if (!writeRoles.includes(req.userRole)) return res.status(403).json({ error: "You don't have permission to create this record." });

  const record = req.body || {};
  const recordId = record[idKey];
  if (!recordId) return res.status(400).json({ error: `Missing required field "${idKey}".` });

  await pool.query(
    `INSERT INTO records (resource_key, record_id, data) VALUES ($1, $2, $3)
     ON CONFLICT (resource_key, record_id) DO UPDATE SET data = $3, updated_at = now()`,
    [resource, String(recordId), record]
  );
  broadcast({ type: "record.created", resource, id: recordId, data: record });
  scheduleRescore();
  res.json({ ok: true, record });
});

router.put("/:resource/:id", requireAuth, validResource, async (req, res) => {
  const { resource, id } = req.params;
  const { writeRoles } = RESOURCES[resource];
  if (!writeRoles.includes(req.userRole)) return res.status(403).json({ error: "You don't have permission to update this record." });

  const { rows } = await pool.query(`SELECT data FROM records WHERE resource_key = $1 AND record_id = $2`, [resource, id]);
  if (!rows[0]) return res.status(404).json({ error: "Record not found." });

  const merged = { ...rows[0].data, ...req.body };
  await pool.query(
    `UPDATE records SET data = $3, updated_at = now() WHERE resource_key = $1 AND record_id = $2`,
    [resource, id, merged]
  );
  broadcast({ type: "record.updated", resource, id, data: merged });
  scheduleRescore();
  res.json({ ok: true, record: merged });
});

router.delete("/:resource/:id", requireAuth, validResource, async (req, res) => {
  const { resource, id } = req.params;
  const { writeRoles } = RESOURCES[resource];
  if (!writeRoles.includes(req.userRole)) return res.status(403).json({ error: "You don't have permission to delete this record." });

  await pool.query(`DELETE FROM records WHERE resource_key = $1 AND record_id = $2`, [resource, id]);
  broadcast({ type: "record.deleted", resource, id });
  scheduleRescore();
  res.json({ ok: true });
});

export default router;
