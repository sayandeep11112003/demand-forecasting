// Template for connecting a real external data source that only exposes a pull
// API (no webhooks). Copy this file, fill in SOURCE_URL/mapRecord, and run it
// wherever suits you — locally, as a cron job, or as its own small deployment.
// It does not run as part of the app; nothing here is wired in automatically.
//
// Usage: DEMAND_FORECASTING_URL=https://your-deployed-app INGEST_API_KEY=... node poll-example.js

const APP_URL = process.env.DEMAND_FORECASTING_URL || "http://localhost:4000";
const INGEST_API_KEY = process.env.INGEST_API_KEY;
const POLL_INTERVAL_MS = 60_000;

// 1. Point this at your real source.
const SOURCE_URL = "https://example.com/api/purchase-orders";
const RESOURCE = "purchase_orders";

// 2. Map one row from your real source into this app's field shape
//    (see the `fields` list for this resource in src/App.jsx's SCHEMA).
function mapRecord(sourceRow) {
  return {
    po_id: sourceRow.id,
    po_number: sourceRow.number,
    supplier_id: sourceRow.supplierId,
    project_id: sourceRow.projectId,
    order_quantity: sourceRow.quantity,
    order_value: sourceRow.value,
    order_date: sourceRow.orderedAt?.slice(0, 10),
    promised_delivery_date: sourceRow.dueAt?.slice(0, 10),
    po_status: sourceRow.status,
  };
}

async function pollOnce() {
  const sourceRes = await fetch(SOURCE_URL);
  if (!sourceRes.ok) throw new Error(`Source fetch failed: ${sourceRes.status}`);
  const rows = await sourceRes.json();

  const records = rows.map(mapRecord);
  const ingestRes = await fetch(`${APP_URL}/api/ingest/${RESOURCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ingest-Key": INGEST_API_KEY },
    body: JSON.stringify(records),
  });
  const result = await ingestRes.json();
  console.log(`[poll] ${new Date().toISOString()} ingested ${result.ingested}/${records.length}`, result.errors);
}

console.log(`Polling ${SOURCE_URL} every ${POLL_INTERVAL_MS / 1000}s → ${APP_URL}/api/ingest/${RESOURCE}`);
pollOnce().catch((err) => console.error("[poll] error:", err.message));
setInterval(() => pollOnce().catch((err) => console.error("[poll] error:", err.message)), POLL_INTERVAL_MS);
