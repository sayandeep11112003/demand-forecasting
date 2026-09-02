import express from "express";
import { pool } from "../db.js";
import { RESOURCE_KEYS } from "../resources.js";
import { requireAuth } from "../middleware/auth.js";
import { addClient, removeClient, broadcast } from "../events.js";
import { buildAnomalyFeed } from "../ml/anomalyFeed.js";

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  addClient(res);
  req.on("close", () => removeClient(res));
});

// Render/Railway free instances spin down after ~15 min idle, which kills any
// setInterval loop. Rescoring on write instead means there's nothing to go
// stale while idle — no writes while idle means the data isn't changing either.
let rescoring = false;
let rescorePending = false;
let debounceTimer = null;

async function rescoreNow() {
  if (!pool) return;
  if (rescoring) {
    rescorePending = true;
    return;
  }
  rescoring = true;
  try {
    const { rows } = await pool.query(`SELECT resource_key, data FROM records`);
    const db = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, []]));
    for (const row of rows) db[row.resource_key]?.push(row.data);
    const feed = buildAnomalyFeed(db);
    broadcast({ type: "anomaly.feed", items: feed });
  } catch (err) {
    console.error("anomaly rescore error:", err);
  } finally {
    rescoring = false;
    if (rescorePending) {
      rescorePending = false;
      rescoreNow();
    }
  }
}

export function scheduleRescore(debounceMs = 10000) {
  if (!pool) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(rescoreNow, debounceMs);
}

// Populates the feed once at boot so it isn't empty until the first write.
export function rescoreOnStartup() {
  rescoreNow();
}

export default router;
