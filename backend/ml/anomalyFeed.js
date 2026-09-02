// Server-side copy of the Isolation Forest anomaly detector, moved out of
// src/App.jsx:691-750 / 1995-2056 verbatim (pure JS, no browser APIs — copied,
// not rewritten). Runs here against the real `records` table on a timer
// (backend/routes/events.js) instead of client-side against demo data.

const inr = (v) => (v == null ? "—" : "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 }));
const num = (v) => (v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 }));

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoCFactor(n) {
  if (n <= 1) return 1;
  return 2 * (Math.log(n - 1) + 0.5772156649015329) - (2 * (n - 1)) / n;
}

function isoBuildTree(data, height, heightLimit) {
  const n = data.length;
  if (height >= heightLimit || n <= 1) return { external: true, size: n };

  const numFeatures = data[0].length;
  const feature = Math.floor(Math.random() * numFeatures);
  let min = Infinity, max = -Infinity;
  for (const row of data) {
    const v = row[feature];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return { external: true, size: n };

  const splitValue = min + Math.random() * (max - min);
  const left = data.filter((row) => row[feature] < splitValue);
  const right = data.filter((row) => row[feature] >= splitValue);
  return {
    external: false, feature, splitValue,
    left: isoBuildTree(left, height + 1, heightLimit),
    right: isoBuildTree(right, height + 1, heightLimit),
  };
}

function isoPathLength(node, point, height = 0) {
  if (node.external) return height + isoCFactor(node.size);
  return point[node.feature] < node.splitValue
    ? isoPathLength(node.left, point, height + 1)
    : isoPathLength(node.right, point, height + 1);
}

function isolationForestScores(vectors, { nTrees = 100, sampleSize = 256 } = {}) {
  if (vectors.length < 2) return vectors.map(() => 0);
  const n = Math.min(sampleSize, vectors.length);
  const heightLimit = Math.ceil(Math.log2(Math.max(n, 2)));
  const c = isoCFactor(n);

  const trees = [];
  for (let t = 0; t < nTrees; t++) {
    const sample = [];
    const pool = vectors.slice();
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      sample.push(pool[idx]);
      pool.splice(idx, 1);
    }
    trees.push(isoBuildTree(sample, 0, heightLimit));
  }

  return vectors.map((point) => {
    const avgPath = trees.reduce((s, tree) => s + isoPathLength(tree, point), 0) / trees.length;
    return Math.pow(2, -avgPath / c); // (0,1] — closer to 1 is more anomalous
  });
}

export function buildAnomalyFeed(db) {
  const poById = new Map(db.purchase_orders.map((p) => [p.po_id, p]));
  const supplierById = new Map(db.suppliers.map((s) => [s.supplier_id, s]));
  const projectById = new Map(db.projects.map((p) => [p.project_id, p]));
  const today = todayISO();

  const shipmentRows = db.shipments
    .filter((s) => s.dispatch_date && s.planned_arrival_date)
    .map((s) => {
      const plannedTransit = daysBetween(s.dispatch_date, s.planned_arrival_date);
      const timing = s.actual_arrival_date
        ? daysBetween(s.planned_arrival_date, s.actual_arrival_date)
        : daysBetween(s.planned_arrival_date, today);
      return { record: s, kind: "shipments", timing, vector: [s.distance_km || 0, plannedTransit, timing] };
    });

  const poRows = db.purchase_orders
    .filter((p) => p.promised_delivery_date)
    .map((p) => {
      const timing = p.actual_delivery_date
        ? daysBetween(p.promised_delivery_date, p.actual_delivery_date)
        : daysBetween(p.promised_delivery_date, today);
      return { record: p, kind: "purchase_orders", timing, vector: [p.order_value || 0, p.order_quantity || 0, timing] };
    });

  const scoreGroup = (rows) => {
    if (rows.length < 8) return rows.map((r) => ({ ...r, score: 0 }));
    const scores = isolationForestScores(rows.map((r) => r.vector), { nTrees: 40, sampleSize: Math.min(80, rows.length) });
    return rows.map((r, i) => ({ ...r, score: scores[i] }));
  };

  return [...scoreGroup(shipmentRows), ...scoreGroup(poRows)]
    .filter((row) => row.score > 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((row) => {
      const { record, kind, timing, score } = row;
      let title, detail, supplier, project;
      if (kind === "shipments") {
        const po = record.po_id ? poById.get(record.po_id) : null;
        supplier = po ? supplierById.get(po.supplier_id) : null;
        project = po ? projectById.get(po.project_id) : null;
        title = record.shipment_number;
        detail = timing > 0
          ? `${timing}d behind schedule over ${num(record.distance_km)} km (${record.transport_mode})`
          : timing < 0
            ? `${Math.abs(timing)}d ahead of schedule over ${num(record.distance_km)} km (${record.transport_mode})`
            : `Flagged on distance/mode profile · ${num(record.distance_km)} km (${record.transport_mode})`;
      } else {
        supplier = supplierById.get(record.supplier_id);
        project = projectById.get(record.project_id);
        title = record.po_number;
        detail = timing > 0
          ? `${timing}d overdue · ${inr(record.order_value)} · qty ${num(record.order_quantity)}`
          : `Unusual order profile · ${inr(record.order_value)} · qty ${num(record.order_quantity)}`;
      }
      return {
        id: `${kind}:${record[kind === "shipments" ? "shipment_id" : "po_id"]}`,
        kind, record, score, timing, title, detail, supplier, project,
      };
    });
}
