import express from "express";
import multer from "multer";
import { pool } from "../db.js";
import { RESOURCES, RESOURCE_KEYS } from "../resources.js";
import { requireIngestKey } from "../middleware/auth.js";
import { broadcast } from "../events.js";
import { scheduleRescore } from "./events.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = ["text/csv", "application/vnd.ms-excel", "text/plain"]
      .includes(file.mimetype);
    cb(ok ? null : new Error("CSV files only"), ok);
  },
});

function validResource(req, res, next) {
  if (!RESOURCE_KEYS.includes(req.params.resource)) {
    return res.status(404).json({ error: `Unknown resource "${req.params.resource}".` });
  }
  next();
}

function uploadSingle(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

async function upsertOne(resource, idKey, record) {
  const recordId = record[idKey];
  if (!recordId) throw new Error(`Missing required field "${idKey}".`);
  await pool.query(
    `INSERT INTO records (resource_key, record_id, data) VALUES ($1, $2, $3)
     ON CONFLICT (resource_key, record_id) DO UPDATE SET data = $3, updated_at = now()`,
    [resource, String(recordId), record]
  );
  broadcast({ type: "record.created", resource, id: recordId, data: record, source: "ingest" });
}

// Direct push — point a real webhook, automation, or script at this. Accepts
// either a single record object or an array of records.
router.post("/:resource", requireIngestKey, validResource, async (req, res) => {
  const { resource } = req.params;
  const { idKey } = RESOURCES[resource];
  const body = Array.isArray(req.body) ? req.body : [req.body];

  const errors = [];
  let count = 0;
  for (const record of body) {
    try {
      await upsertOne(resource, idKey, record);
      count++;
    } catch (err) {
      errors.push(err.message);
    }
  }
  if (count > 0) scheduleRescore();
  res.json({ ok: errors.length === 0, ingested: count, errors });
});

// CSV upload — a spreadsheet export from a real system, no integration code needed.
// Expects a header row matching field keys; every row is upserted like a direct push.
router.post("/:resource/csv", requireIngestKey, validResource, uploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded (expected multipart field \"file\")." });
  const { resource } = req.params;
  const { idKey } = RESOURCES[resource];

  const text = req.file.buffer.toString("utf-8");
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = headerLine.split(",").map((h) => h.trim());

  const errors = [];
  let count = 0;
  for (const line of lines) {
    const cells = line.split(",").map((c) => c.trim());
    const record = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    try {
      await upsertOne(resource, idKey, record);
      count++;
    } catch (err) {
      errors.push(err.message);
    }
  }
  if (count > 0) scheduleRescore();
  res.json({ ok: errors.length === 0, ingested: count, errors });
});

export default router;
