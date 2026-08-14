import React, { useState, useMemo, useCallback } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import {
  Zap, LayoutGrid, FolderKanban, Factory, ScrollText, Package, Truck, ClipboardCheck,
  HardHat, Warehouse, IndianRupee, AlertTriangle, Leaf, Users, TrendingUp,
  Plus, Pencil, Trash2, X, LogOut, Search, Lock,
} from "lucide-react";
import { apiLogin, apiRegister } from "./api.js";

/* ============================================================================
   TRAINED MODEL BUNDLE
   Produced by the RandomForest / trend-seasonality training pipeline.
   Swap this object for a retrained bundle of the same shape when real
   (anonymised) company data becomes available — nothing else needs to change.
   ========================================================================== */
const MODEL = {"meta":{"n_orders":4200,"n_months_history":24,"n_suppliers":14,"categories":["Conductor (ACSR)","Tower Steel","Insulators","Power Transformers","XLPE Cables","Switchgear (GIS/AIS)"],"regions":["Domestic","Imported - Asia","Imported - Europe"]},"delay_model":{"mae_days":5.21,"rmse_days":6.59,"r2":0.646,"mape_pct":30.9,"feature_importance":[{"feature":"Material Category","importance":37.2},{"feature":"Transport Mode","importance":22.0},{"feature":"Supplier On-Time History","importance":15.6},{"feature":"Monsoon Season","importance":9.8},{"feature":"Shipping Distance","importance":8.6},{"feature":"Order Size (vs. typical)","importance":4.6},{"feature":"Supplier Region","importance":1.8},{"feature":"Order Urgency","importance":0.4}],"n_train":3360,"n_test":840},"whatif_model":{"intercept":48.58,"category":{"Conductor (ACSR)":-4.5,"Tower Steel":-1.2,"Insulators":-6.78,"Power Transformers":10.99,"XLPE Cables":-3.37,"Switchgear (GIS/AIS)":4.87},"region":{"Domestic":-3.51,"Imported - Asia":-0.07,"Imported - Europe":3.57},"transport":{"Road":-1.6,"Rail":-1.91,"Sea":6.1,"Air":-2.59},"qty_coef":1.544,"distance_coef":-1e-05,"monsoon_coef":6.36,"ontime_coef":-32.48,"urgency_coef":-0.89},"demand_forecast":{"avg_mape_pct":26.7,"series":{"Conductor (ACSR)":{"unit":"km","historical":[3285.2,3062.6,2539.5,3257.4,3682.4,4148.5,3107.7,4077.1,3490.9,3134.3,3137.9,2892.2,3541.5,2722.0,4004.4,3728.9,4218.1,3375.2,4828.6,3815.4,3203.7,4016.6,2886.7,3320.0],"forecast":[3343.1,3497.1,3723.3,3966.9,4168.4,4279.4],"forecast_upper":[3877.6,4031.6,4257.8,4501.5,4702.9,4813.9],"forecast_lower":[2808.6,2962.5,3188.8,3432.4,3633.8,3744.8],"mape":11.2},"Tower Steel":{"unit":"MT","historical":[9470.9,8859.7,7468.7,8140.0,8224.7,6274.9,11919.1,11953.9,7654.3,12752.2,7866.1,5550.1,12724.5,8690.0,8089.4,7436.0,12162.3,9608.1,9737.3,6593.8,8709.4,13567.1,10294.3,9767.7],"forecast":[9584.9,9299.8,9143.2,9166.2,9372.0,9714.6],"forecast_upper":[12236.3,11951.3,11794.7,11817.7,12023.4,12366.0],"forecast_lower":[6933.4,6648.4,6491.8,6514.8,6720.5,7063.1],"mape":20.2},"Insulators":{"unit":"units","historical":[69409.7,42136.7,56292.9,56178.3,44648.6,49130.1,54230.0,71147.8,51775.4,70340.7,48678.2,58990.6,69283.7,42906.0,58413.6,55755.8,67085.1,57601.6,62169.6,78708.8,58101.0,51600.8,67243.1,38778.7],"forecast":[54818.5,53753.0,53801.1,54957.7,56920.4,59170.9],"forecast_upper":[67236.5,66171.0,66219.1,67375.7,69338.4,71588.9],"forecast_lower":[42400.5,41335.0,41383.1,42539.7,44502.4,46752.9],"mape":21.5},"Power Transformers":{"unit":"units","historical":[97.5,59.1,87.5,62.3,70.2,88.9,82.5,112.2,91.5,92.9,99.9,89.2,115.3,112.6,75.6,80.5,66.8,87.9,43.5,83.4,72.6,62.0,61.0,87.9],"forecast":[78.6,73.6,68.3,63.8,61.0,60.6],"forecast_upper":[99.4,94.5,89.2,84.7,81.9,81.5],"forecast_lower":[57.7,52.8,47.4,42.9,40.2,39.8],"mape":61.9},"XLPE Cables":{"unit":"km","historical":[569.7,389.4,482.6,513.7,524.7,529.3,390.0,433.4,455.7,382.6,368.3,289.4,556.3,462.5,468.1,471.9,502.8,427.8,315.6,445.6,521.9,500.2,364.8,572.9],"forecast":[477.4,492.8,500.6,498.9,488.4,472.0],"forecast_upper":[569.8,585.2,593.0,591.3,580.8,564.4],"forecast_lower":[385.0,400.4,408.2,406.5,396.0,379.6],"mape":23.4},"Switchgear (GIS/AIS)":{"unit":"units","historical":[170.7,170.5,178.0,238.2,160.7,188.5,234.3,174.9,164.2,142.0,194.1,142.4,149.6,124.0,188.1,140.2,120.2,165.2,141.1,157.6,154.7,150.7,187.8,215.0],"forecast":[150.6,148.0,146.3,145.7,145.9,146.6],"forecast_upper":[187.5,184.9,183.2,182.6,182.8,183.5],"forecast_lower":[113.7,111.0,109.4,108.7,109.0,109.7],"mape":21.8}}},"supplier_risk":[{"supplier":"Global Switchgear Inc","category":"Power Transformers","region":"Domestic","on_time_rate":64.4,"avg_delay_days":19.5,"orders_ytd":178,"sourcing":"Single-source","risk_score":48.0,"risk_band":"Medium"},{"supplier":"Himalaya Grid Equip","category":"Switchgear (GIS/AIS)","region":"Domestic","on_time_rate":62.7,"avg_delay_days":26.4,"orders_ytd":160,"sourcing":"Multi-source","risk_score":38.0,"risk_band":"Medium"},{"supplier":"Orion Industrial Group","category":"Insulators","region":"Domestic","on_time_rate":70.4,"avg_delay_days":-1.4,"orders_ytd":67,"sourcing":"Single-source","risk_score":30.0,"risk_band":"Low"},{"supplier":"Apex Conductors Ltd","category":"Conductor (ACSR)","region":"Domestic","on_time_rate":67.3,"avg_delay_days":16.0,"orders_ytd":58,"sourcing":"Multi-source","risk_score":29.0,"risk_band":"Low"},{"supplier":"Bharat Tower Works","category":"XLPE Cables","region":"Domestic","on_time_rate":62.7,"avg_delay_days":11.1,"orders_ytd":161,"sourcing":"Multi-source","risk_score":28.0,"risk_band":"Low"},{"supplier":"Ion Power Components","category":"XLPE Cables","region":"Imported - Asia","on_time_rate":77.9,"avg_delay_days":-0.1,"orders_ytd":160,"sourcing":"Single-source","risk_score":27.0,"risk_band":"Low"},{"supplier":"Falcon Steel Fabricators","category":"Insulators","region":"Domestic","on_time_rate":85.1,"avg_delay_days":17.5,"orders_ytd":198,"sourcing":"Multi-source","risk_score":20.0,"risk_band":"Low"},{"supplier":"Meridian Electricals","category":"Tower Steel","region":"Domestic","on_time_rate":99.0,"avg_delay_days":6.9,"orders_ytd":153,"sourcing":"Single-source","risk_score":20.0,"risk_band":"Low"},{"supplier":"Everest Cable Systems","category":"Switchgear (GIS/AIS)","region":"Domestic","on_time_rate":88.3,"avg_delay_days":16.0,"orders_ytd":99,"sourcing":"Multi-source","risk_score":17.0,"risk_band":"Low"},{"supplier":"Delta Transformers Co","category":"Insulators","region":"Domestic","on_time_rate":92.2,"avg_delay_days":15.9,"orders_ytd":44,"sourcing":"Multi-source","risk_score":15.0,"risk_band":"Low"},{"supplier":"Continental Insulators","category":"Switchgear (GIS/AIS)","region":"Domestic","on_time_rate":93.6,"avg_delay_days":14.4,"orders_ytd":85,"sourcing":"Multi-source","risk_score":13.0,"risk_band":"Low"},{"supplier":"Kestrel Energy Supplies","category":"Switchgear (GIS/AIS)","region":"Domestic","on_time_rate":88.2,"avg_delay_days":8.2,"orders_ytd":118,"sourcing":"Multi-source","risk_score":12.0,"risk_band":"Low"},{"supplier":"Jupiter Metals & Alloys","category":"Tower Steel","region":"Domestic","on_time_rate":93.4,"avg_delay_days":6.5,"orders_ytd":208,"sourcing":"Multi-source","risk_score":8.0,"risk_band":"Low"},{"supplier":"Nova Transmission Parts","category":"Insulators","region":"Imported - Asia","on_time_rate":94.4,"avg_delay_days":4.7,"orders_ytd":108,"sourcing":"Multi-source","risk_score":6.0,"risk_band":"Low"}]};

/* ============================================================================
   DESIGN TOKENS  — "Grid Current"
   ========================================================================== */
const C = {
  void: "#0D1117", panel: "#151B23", panel2: "#1B222C", panel3: "#212936",
  border: "#2A3341", borderSoft: "#232B37",
  text: "#E8ECF2", muted: "#8A95A6", faint: "#5B6675",
  copper: "#CD8B4F", copperSoft: "#8F6338",
  cyan: "#5AB2C9", green: "#5FB489", amber: "#E0A458", red: "#D9705F", violet: "#9B8AC4",
};
const FD = "'Space Grotesk',system-ui,sans-serif";
const FB = "'Inter',system-ui,sans-serif";
const FM = "'JetBrains Mono',ui-monospace,monospace";

/* ============================================================================
   SEEDED PRNG  — deterministic demo data across reloads
   ========================================================================== */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rnd = makeRng(20260813);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + rnd() * (b - a);
const intBetween = (a, b) => Math.floor(between(a, b + 1));
const uid = (() => { let n = 0; return (p) => `${p}-${String(++n).padStart(5, "0")}`; })();
function dateStr(y, m, d) {
  const dt = new Date(Date.UTC(y, m, d));
  return dt.toISOString().slice(0, 10);
}
function addDays(iso, days) {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/* ============================================================================
   ROLES & PERMISSIONS  (mirrors the server-side rules in the Express backend)
   ========================================================================== */
const ROLES = {
  admin: { label: "Administrator", color: C.copper },
  procurement_manager: { label: "Procurement Manager", color: C.cyan },
  site_engineer: { label: "Site Engineer", color: C.green },
  quality_inspector: { label: "Quality Inspector", color: C.amber },
  sustainability_officer: { label: "Sustainability Officer", color: C.violet },
  viewer: { label: "Viewer (read-only)", color: C.muted },
};

/* ============================================================================
   SEED DATA — all 12 categories
   ========================================================================== */
const STATES = ["Maharashtra", "Gujarat", "Kerala", "Punjab", "Assam", "Karnataka", "Rajasthan", "Odisha"];
const CATS = MODEL.meta.categories;
const REGIONS = MODEL.meta.regions;

function buildDatabase() {
  /* ---- 1. projects ---- */
  const projTypes = ["Transmission Line", "Substation", "HVDC Converter Station", "Renewable Evacuation", "Grid Strengthening"];
  const projects = [
    ["Nagpur–Aurangabad 400kV Line", "Transmission Line", "400kV", "Maharashtra", "Construction", 68],
    ["Kochi HVDC Converter Station", "HVDC Converter Station", "±320kV", "Kerala", "Procurement", 22],
    ["Bhuj Renewable Evacuation Corridor", "Renewable Evacuation", "765kV", "Gujarat", "Planning", 5],
    ["Chandigarh Substation Upgrade", "Substation", "220kV", "Punjab", "Testing", 91],
    ["Guwahati Grid Strengthening Ph-II", "Grid Strengthening", "400kV", "Assam", "Construction", 44],
    ["Jaipur–Ajmer 765kV Interconnect", "Transmission Line", "765kV", "Rajasthan", "Procurement", 17],
    ["Paradip Port Substation", "Substation", "220kV", "Odisha", "Commissioned", 100],
  ].map(([project_name, project_type, voltage_class, location_state, project_status, percent_complete], i) => ({
    project_id: uid("PRJ"),
    project_code: `PRJ-2026-${String(i + 1).padStart(3, "0")}`,
    project_name, project_type, voltage_class, location_state,
    location_country: "India",
    client_owner: pick(["POWERGRID", "State Transco", "NTPC", "Adani Transmission"]),
    contract_value: Math.round(between(60, 520)) * 1e6,
    currency: "INR",
    planned_start_date: dateStr(2025, intBetween(0, 6), intBetween(1, 27)),
    planned_end_date: dateStr(2027, intBetween(0, 11), intBetween(1, 27)),
    actual_start_date: percent_complete > 0 ? dateStr(2025, intBetween(0, 8), intBetween(1, 27)) : null,
    actual_end_date: percent_complete === 100 ? dateStr(2026, 5, 12) : null,
    project_status, percent_complete,
    wbs_reference: `WBS-${100 + i}`,
    created_at: dateStr(2025, 2, 14),
  }));

  /* ---- 2. suppliers (from the model's risk panel, so risk scores line up) ---- */
  const suppliers = MODEL.supplier_risk.map((s, i) => ({
    supplier_id: uid("SUP"),
    supplier_code: `SUP-${String(i + 1).padStart(3, "0")}`,
    supplier_name: s.supplier,
    supplier_category: s.category.includes("Insulator") ? "Material"
      : s.category.includes("Steel") ? "Civil Works" : "Equipment",
    country: s.region === "Domestic" ? "India" : s.region.replace("Imported - ", ""),
    state: s.region === "Domestic" ? pick(STATES) : null,
    city: pick(["Pune", "Vadodara", "Chennai", "Noida", "Hyderabad"]),
    contact_person: pick(["R. Nair", "S. Banerjee", "M. Khan", "T. Rao", "V. Joshi"]),
    contact_email: s.supplier.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + "@vendor.com",
    contact_phone: `+91-9${intBetween(100000000, 999999999)}`,
    internal_rating: Math.round(s.on_time_rate / 10 * 10) / 10,
    years_relationship: intBetween(1, 14),
    certifications: pick(["ISO 9001", "ISO 9001, ISO 14001", "ISO 9001, IEC 61089", "ISO 45001"]),
    sourcing_type: s.sourcing,
    registration_status: "Approved",
    credit_rating: pick(["AAA", "AA+", "AA", "A+", "A", "BBB"]),
    _risk_score: s.risk_score, _risk_band: s.risk_band,
    _on_time_rate: s.on_time_rate, _avg_delay_days: s.avg_delay_days, _orders_ytd: s.orders_ytd,
    created_at: dateStr(2025, 1, 8),
  }));

  /* ---- 3. materials ---- */
  const materials = CATS.map((cat, i) => ({
    material_id: uid("MAT"),
    material_code: `MAT-${String(i + 1).padStart(3, "0")}`,
    material_name: cat,
    category: cat,
    specification_grade: pick(["IS 398 Part-V", "IEC 61089", "IS 2062 E350", "IEC 60137", "IS 3347"]),
    unit_of_measure: MODEL.demand_forecast.series[cat].unit,
    standard_unit_cost: Math.round(between(1200, 900000)),
    standard_lead_time_days: intBetween(30, 130),
    manufacturer: pick(["Apar Industries", "Sterlite Power", "BHEL", "Siemens Energy", "Hitachi Energy"]),
    country_of_origin: pick(["India", "India", "China", "Germany"]),
    hs_code: `85${intBetween(1000, 9999)}`,
    min_order_quantity: intBetween(1, 50),
    storage_requirements: pick(["Covered dry store", "Open yard, tarpaulin", "Climate-controlled", "Open yard"]),
    created_at: dateStr(2025, 1, 20),
  }));

  /* ---- 4. purchase orders ---- */
  const purchase_orders = [];
  for (let i = 1; i <= 240; i++) {
    const mat = materials[i % materials.length];
    const sup = suppliers[i % suppliers.length];
    const prj = projects[i % projects.length];
    const order_date = dateStr(2025, intBetween(0, 11), intBetween(1, 27));
    const promised = addDays(order_date, intBetween(28, 110));
    const closed = rnd() > 0.22;
    const slip = Math.round(between(-6, 26));
    const qty = Math.round(between(5, 900));
    const unit_price = mat.standard_unit_cost;
    purchase_orders.push({
      po_id: uid("PO"),
      po_number: `PO-${String(i).padStart(5, "0")}`,
      supplier_id: sup.supplier_id, project_id: prj.project_id, material_id: mat.material_id,
      item_description: `${mat.material_name} — ${prj.voltage_class}`,
      order_quantity: qty, unit: mat.unit_of_measure,
      unit_price, order_value: qty * unit_price, currency: "INR",
      order_date, promised_delivery_date: promised,
      actual_delivery_date: closed ? addDays(promised, slip) : null,
      po_status: closed ? "Closed" : pick(["Open", "Open", "Partial"]),
      payment_terms: pick(["30 days net", "45 days net", "LC at sight", "60 days net"]),
      approval_status: "Approved",
      created_at: order_date,
    });
  }

  /* ---- 5. shipments ---- */
  const shipments = purchase_orders.slice(0, 150).map((po, i) => {
    const dispatch = addDays(po.order_date, intBetween(10, 40));
    const planned = addDays(dispatch, intBetween(5, 30));
    const delivered = po.actual_delivery_date;
    return {
      shipment_id: uid("SHP"),
      shipment_number: `SHP-${String(i + 1).padStart(5, "0")}`,
      po_id: po.po_id,
      origin_location: pick(["Vadodara Plant", "Chennai Port", "Pune Works", "Shanghai Port", "Hamburg Port"]),
      destination_location: pick(["Nagpur Site", "Kochi Site", "Bhuj Site", "Guwahati Site", "Jaipur Store"]),
      transport_mode: pick(["Road", "Road", "Rail", "Sea", "Air"]),
      carrier_name: pick(["TCI Freight", "Gati", "Maersk", "Blue Dart", "Container Corp"]),
      dispatch_date: dispatch, planned_arrival_date: planned,
      actual_arrival_date: delivered,
      shipment_status: delivered ? "Delivered" : pick(["In Transit", "Pending", "Delayed"]),
      tracking_number: `TRK${intBetween(100000, 999999)}`,
      delay_reason: delivered && delivered > planned ? pick(["Customs hold", "Monsoon road closure", "Carrier breakdown", "Port congestion"]) : null,
      distance_km: Math.round(between(180, 9200)),
      created_at: dispatch,
    };
  });

  /* ---- 6. inspections ---- */
  const inspections = purchase_orders.slice(0, 120).map((po, i) => {
    const result = rnd() > 0.14 ? "Pass" : (rnd() > 0.4 ? "Fail" : "Conditional");
    return {
      inspection_id: uid("INS"),
      material_id: po.material_id, po_id: po.po_id,
      batch_number: `BATCH-${intBetween(1000, 9999)}`,
      inspection_date: addDays(po.order_date, intBetween(30, 90)),
      inspector_name: pick(["K. Reddy", "A. Verma", "S. Pillai", "D. Chauhan"]),
      inspector_role: pick(["QA Engineer", "Third-party (TUV)", "Client Rep", "Site QC"]),
      inspection_type: pick(["Incoming", "In-process", "Final", "Third-party"]),
      result,
      rejection_reason: result === "Pass" ? null : pick(["Dimensional deviation", "Galvanising thickness below spec", "Test certificate mismatch", "Surface defects"]),
      rework_required: result !== "Pass",
      rework_completed_date: result !== "Pass" && rnd() > 0.5 ? addDays(po.order_date, intBetween(95, 130)) : null,
      certificate_reference: `CERT-${intBetween(10000, 99999)}`,
      created_at: addDays(po.order_date, 35),
    };
  });

  /* ---- 7. construction activities ---- */
  const WORK_PACKAGES = ["Foundation", "Tower Erection", "Stringing", "Civil Works", "Equipment Installation", "Testing & Commissioning"];
  const construction_activities = [];
  projects.forEach((prj) => {
    WORK_PACKAGES.forEach((wp, j) => {
      const ps = dateStr(2025, intBetween(0, 10), intBetween(1, 27));
      const pf = addDays(ps, intBetween(30, 150));
      const delay = Math.round(between(-4, 30));
      const done = prj.percent_complete > (j + 1) * 15;
      construction_activities.push({
        activity_id: uid("ACT"),
        project_id: prj.project_id,
        work_package: wp,
        activity_name: `${wp} — ${prj.project_name.split("—")[0].trim()}`,
        planned_start_date: ps, planned_finish_date: pf,
        actual_start_date: done ? addDays(ps, intBetween(0, 12)) : null,
        actual_finish_date: done ? addDays(pf, delay) : null,
        percent_complete: done ? 100 : Math.max(0, Math.min(95, prj.percent_complete - j * 12)),
        resource_allocation: `${intBetween(12, 90)} workers, ${intBetween(2, 9)} machines`,
        delay_days: done ? Math.max(0, delay) : 0,
        delay_reason: done && delay > 0 ? pick(["Material shortage", "Right-of-way dispute", "Heavy rainfall", "Labour shortage"]) : null,
        contractor_id: null,
        status: done ? "Completed" : (prj.percent_complete > j * 15 ? "In Progress" : "Not Started"),
        created_at: ps,
      });
    });
  });

  /* ---- 8. inventory ---- */
  const inventory = [];
  materials.forEach((mat) => {
    ["Nagpur Site Store", "Kochi Site Store", "Central Warehouse — Pune"].forEach((loc) => {
      const safety = Math.round(between(20, 400));
      const current = Math.round(between(0, 900));
      inventory.push({
        inventory_id: uid("INV"),
        material_id: mat.material_id,
        warehouse_location: loc,
        current_stock_level: current,
        safety_stock_level: safety,
        reorder_point: Math.round(safety * 1.3),
        reorder_quantity: Math.round(safety * 2),
        last_stock_check_date: dateStr(2026, intBetween(0, 6), intBetween(1, 27)),
        stock_out_flag: current < safety * 0.25,
        stock_out_date: current < safety * 0.25 ? dateStr(2026, intBetween(0, 6), intBetween(1, 27)) : null,
        created_at: dateStr(2025, 4, 2),
      });
    });
  });

  /* ---- 9. costs ---- */
  const COST_CATS = ["Material", "Labour", "Logistics", "Equipment Hire", "Overheads"];
  const costs = [];
  projects.forEach((prj) => {
    COST_CATS.forEach((cc) => {
      const budget = Math.round(between(5, 120)) * 1e6;
      const escalation = between(-4, 22);
      const actual = Math.round(budget * (1 + escalation / 100));
      costs.push({
        cost_id: uid("CST"),
        project_id: prj.project_id,
        cost_category: cc,
        reference_id: null,
        budgeted_cost: budget, actual_cost: actual,
        cost_variance_pct: Math.round(((actual - budget) / budget) * 1000) / 10,
        currency: "INR",
        escalation_pct: Math.round(escalation * 10) / 10,
        exchange_rate_at_order: Math.round(between(82, 88) * 100) / 100,
        exchange_rate_at_payment: Math.round(between(82, 90) * 100) / 100,
        recorded_date: dateStr(2026, intBetween(0, 6), intBetween(1, 27)),
        created_at: dateStr(2026, 1, 5),
      });
    });
  });

  /* ---- 10. disruptions ---- */
  const DTYPES = ["Supplier Failure", "Transport Delay", "Quality Rejection", "Natural Disaster", "Labour Shortage", "Import Restriction", "Cost Escalation", "Cybersecurity Incident"];
  const disruptions = Array.from({ length: 46 }, () => {
    const prj = pick(projects);
    const sup = pick(suppliers);
    const type = pick(DTYPES);
    const ev = dateStr(2025, intBetween(0, 11), intBetween(1, 27));
    const severity = pick(["Low", "Medium", "Medium", "High", "Critical"]);
    const status = pick(["Open", "In Progress", "Resolved", "Resolved"]);
    return {
      disruption_id: uid("DIS"),
      project_id: prj.project_id, supplier_id: sup.supplier_id, po_id: null,
      disruption_type: type, event_date: ev,
      description: `${type} affecting ${prj.project_name}`,
      impact_days: intBetween(1, 45),
      impact_cost: Math.round(between(0.2, 24) * 1e6),
      severity,
      recovery_action: pick(["Activated alternate supplier", "Rerouted shipment", "Expedited air freight", "Rescheduled work package", "Increased safety stock"]),
      recovery_completed_date: status === "Resolved" ? addDays(ev, intBetween(5, 60)) : null,
      status,
      created_at: ev,
    };
  });

  /* ---- 11. carbon records ---- */
  const SOURCES = ["Manufacturing", "Transport", "Construction", "Installation", "Maintenance", "End-of-Life"];
  const carbon_records = [];
  projects.forEach((prj) => {
    SOURCES.forEach((src) => {
      const mat = pick(materials);
      const ef = Math.round(between(0.4, 3.8) * 1000) / 1000;
      const qty = Math.round(between(50, 4000));
      carbon_records.push({
        carbon_id: uid("CAR"),
        project_id: prj.project_id, material_id: mat.material_id,
        emission_source: src,
        emission_factor_kgco2e_per_unit: ef,
        quantity: qty,
        calculated_emissions_kgco2e: Math.round(ef * qty),
        data_source: pick(["Verified", "ESG Report", "Estimated", "Secondary"]),
        transport_distance_km: src === "Transport" ? Math.round(between(150, 8000)) : null,
        waste_generated_kg: Math.round(between(0, 2600)),
        scrap_recycled_kg: Math.round(between(0, 1800)),
        verification_status: pick(["Verified", "Unverified", "Unverified", "Disputed"]),
        recorded_date: dateStr(2026, intBetween(0, 6), intBetween(1, 27)),
        created_at: dateStr(2026, 2, 10),
      });
    });
  });

  /* ---- 12. contractors ---- */
  const contractors = [
    "Shakti Infra Projects", "Vindhya Constructions", "Sterling EPC", "Konkan Erectors",
    "Aravalli Civil Works", "Brahmaputra Builders", "Deccan Power Services", "Coastal Grid Contractors",
  ].map((contractor_name, i) => ({
    contractor_id: uid("CON"),
    contractor_code: `CON-${String(i + 1).padStart(3, "0")}`,
    contractor_name,
    scope_of_work: pick(["Foundation & Civil", "Tower Erection", "Stringing", "Substation Installation", "Testing & Commissioning"]),
    region: pick(STATES),
    past_performance_rating: Math.round(between(4.5, 9.6) * 10) / 10,
    avg_delay_days: Math.round(between(-2, 28) * 10) / 10,
    safety_incident_count: intBetween(0, 7),
    safety_rating: pick(["A", "A", "B", "B", "C"]),
    certification_status: pick(["Certified", "Certified", "Pending", "Expired"]),
    active_status: rnd() > 0.15,
    created_at: dateStr(2025, 2, 1),
  }));

  /* link activities to contractors */
  construction_activities.forEach((a) => { a.contractor_id = pick(contractors).contractor_id; });

  return {
    projects, suppliers, materials, purchase_orders, shipments, inspections,
    construction_activities, inventory, costs, disruptions, carbon_records, contractors,
  };
}


/* ============================================================================
   RESOURCE SCHEMA
   One entry per data category: which columns show in the table, which fields
   appear in the create/edit form, and which roles may write.
   `ref` fields render as dropdowns resolved against another table.
   ========================================================================== */
const ADMIN = "admin", PROC = "procurement_manager", SITE = "site_engineer",
  QC = "quality_inspector", SUS = "sustainability_officer";

const WORK_PACKAGES_LIST = ["Foundation", "Tower Erection", "Stringing", "Civil Works",
  "Equipment Installation", "Testing & Commissioning"];

const SCHEMA = {
  projects: {
    label: "Projects", icon: FolderKanban, idKey: "project_id",
    category: "1. Project Master Data",
    writeRoles: [ADMIN, PROC], searchKeys: ["project_code", "project_name", "location_state"],
    columns: ["project_code", "project_name", "project_type", "voltage_class", "location_state", "percent_complete", "project_status"],
    fields: [
      { k: "project_code", label: "Project code", req: true },
      { k: "project_name", label: "Project name", req: true },
      { k: "project_type", label: "Type", req: true, options: ["Transmission Line", "Substation", "HVDC Converter Station", "Renewable Evacuation", "Grid Strengthening"] },
      { k: "voltage_class", label: "Voltage class", options: ["132kV", "220kV", "400kV", "765kV", "±320kV", "±800kV"] },
      { k: "location_state", label: "State", options: STATES },
      { k: "location_country", label: "Country" },
      { k: "client_owner", label: "Client / owner" },
      { k: "contract_value", label: "Contract value (INR)", type: "number" },
      { k: "planned_start_date", label: "Planned start", type: "date" },
      { k: "planned_end_date", label: "Planned end", type: "date" },
      { k: "actual_start_date", label: "Actual start", type: "date" },
      { k: "actual_end_date", label: "Actual end", type: "date" },
      { k: "project_status", label: "Status", options: ["Planning", "Procurement", "Construction", "Testing", "Commissioned", "On Hold", "Cancelled"] },
      { k: "percent_complete", label: "% complete", type: "number" },
      { k: "wbs_reference", label: "WBS reference" },
    ],
  },
  suppliers: {
    label: "Suppliers", icon: Factory, idKey: "supplier_id",
    category: "2. Supplier / Vendor Master Data",
    writeRoles: [ADMIN, PROC], searchKeys: ["supplier_code", "supplier_name", "country"],
    columns: ["supplier_code", "supplier_name", "supplier_category", "country", "years_relationship", "internal_rating", "sourcing_type", "registration_status"],
    fields: [
      { k: "supplier_code", label: "Supplier code", req: true },
      { k: "supplier_name", label: "Supplier name", req: true },
      { k: "supplier_category", label: "Category", req: true, options: ["Equipment", "Material", "Civil Works", "Logistics", "Services"] },
      { k: "country", label: "Country" }, { k: "state", label: "State" }, { k: "city", label: "City" },
      { k: "contact_person", label: "Contact person" },
      { k: "contact_email", label: "Contact email" },
      { k: "contact_phone", label: "Contact phone" },
      { k: "internal_rating", label: "Internal rating (0–10)", type: "number" },
      { k: "years_relationship", label: "Years of relationship", type: "number" },
      { k: "certifications", label: "Certifications" },
      { k: "sourcing_type", label: "Sourcing", options: ["Single-source", "Multi-source"] },
      { k: "registration_status", label: "Registration", options: ["Approved", "Pending", "Suspended", "Blacklisted"] },
      { k: "credit_rating", label: "Credit rating" },
    ],
  },
  materials: {
    label: "Materials", icon: Package, idKey: "material_id",
    category: "3. Material / Equipment Master Data",
    writeRoles: [ADMIN, PROC], searchKeys: ["material_code", "material_name", "manufacturer"],
    columns: ["material_code", "material_name", "category", "unit_of_measure", "standard_unit_cost", "standard_lead_time_days", "manufacturer", "country_of_origin"],
    fields: [
      { k: "material_code", label: "Material code", req: true },
      { k: "material_name", label: "Material name", req: true },
      { k: "category", label: "Category", req: true, options: CATS },
      { k: "specification_grade", label: "Specification / grade" },
      { k: "unit_of_measure", label: "Unit", options: ["km", "MT", "units", "m", "sets"] },
      { k: "standard_unit_cost", label: "Standard unit cost (INR)", type: "number" },
      { k: "standard_lead_time_days", label: "Standard lead time (days)", type: "number" },
      { k: "manufacturer", label: "Manufacturer" },
      { k: "country_of_origin", label: "Country of origin" },
      { k: "hs_code", label: "HS code" },
      { k: "min_order_quantity", label: "Min order qty", type: "number" },
      { k: "storage_requirements", label: "Storage requirements" },
    ],
  },
  purchase_orders: {
    label: "Purchase Orders", icon: ScrollText, idKey: "po_id",
    category: "4. Purchase Order Data",
    writeRoles: [ADMIN, PROC], searchKeys: ["po_number", "item_description"],
    columns: ["po_number", "item_description", "order_quantity", "order_value", "order_date", "promised_delivery_date", "_slip", "po_status"],
    fields: [
      { k: "po_number", label: "PO number", req: true },
      { k: "supplier_id", label: "Supplier", req: true, ref: "suppliers" },
      { k: "project_id", label: "Project", req: true, ref: "projects" },
      { k: "material_id", label: "Material", ref: "materials" },
      { k: "item_description", label: "Item description" },
      { k: "order_quantity", label: "Order quantity", type: "number", req: true },
      { k: "unit", label: "Unit" },
      { k: "unit_price", label: "Unit price (INR)", type: "number" },
      { k: "order_value", label: "Order value (INR)", type: "number" },
      { k: "order_date", label: "Order date", type: "date", req: true },
      { k: "promised_delivery_date", label: "Promised delivery", type: "date" },
      { k: "actual_delivery_date", label: "Actual delivery", type: "date" },
      { k: "po_status", label: "Status", options: ["Open", "Partial", "Closed", "Cancelled"] },
      { k: "payment_terms", label: "Payment terms" },
      { k: "approval_status", label: "Approval", options: ["Approved", "Pending", "Rejected"] },
    ],
  },
  shipments: {
    label: "Shipments", icon: Truck, idKey: "shipment_id",
    category: "5. Shipment / Logistics Data",
    writeRoles: [ADMIN, PROC, SITE], searchKeys: ["shipment_number", "carrier_name", "destination_location"],
    columns: ["shipment_number", "origin_location", "destination_location", "transport_mode", "carrier_name", "dispatch_date", "planned_arrival_date", "shipment_status"],
    fields: [
      { k: "shipment_number", label: "Shipment number", req: true },
      { k: "po_id", label: "Purchase order", req: true, ref: "purchase_orders" },
      { k: "origin_location", label: "Origin" },
      { k: "destination_location", label: "Destination" },
      { k: "transport_mode", label: "Transport mode", options: ["Road", "Rail", "Sea", "Air"] },
      { k: "carrier_name", label: "Carrier" },
      { k: "dispatch_date", label: "Dispatch date", type: "date" },
      { k: "planned_arrival_date", label: "Planned arrival", type: "date" },
      { k: "actual_arrival_date", label: "Actual arrival", type: "date" },
      { k: "shipment_status", label: "Status", options: ["Pending", "In Transit", "Delivered", "Delayed", "Lost"] },
      { k: "tracking_number", label: "Tracking number" },
      { k: "delay_reason", label: "Delay reason", type: "textarea" },
      { k: "distance_km", label: "Distance (km)", type: "number" },
    ],
  },
  inspections: {
    label: "Inspections", icon: ClipboardCheck, idKey: "inspection_id",
    category: "6. Inspection / Quality Data",
    writeRoles: [ADMIN, QC, SITE], searchKeys: ["batch_number", "inspector_name", "certificate_reference"],
    columns: ["batch_number", "inspection_date", "inspector_name", "inspector_role", "inspection_type", "result", "rework_required", "certificate_reference"],
    fields: [
      { k: "material_id", label: "Material", ref: "materials" },
      { k: "po_id", label: "Purchase order", ref: "purchase_orders" },
      { k: "batch_number", label: "Batch number" },
      { k: "inspection_date", label: "Inspection date", type: "date", req: true },
      { k: "inspector_name", label: "Inspector name" },
      { k: "inspector_role", label: "Inspector role" },
      { k: "inspection_type", label: "Type", options: ["Incoming", "In-process", "Final", "Third-party"] },
      { k: "result", label: "Result", req: true, options: ["Pass", "Fail", "Conditional"] },
      { k: "rejection_reason", label: "Rejection reason", type: "textarea" },
      { k: "rework_required", label: "Rework required", type: "bool" },
      { k: "rework_completed_date", label: "Rework completed", type: "date" },
      { k: "certificate_reference", label: "Certificate ref" },
    ],
  },
  construction_activities: {
    label: "Site Activities", icon: HardHat, idKey: "activity_id",
    category: "7. Site / Construction Data",
    writeRoles: [ADMIN, SITE], searchKeys: ["activity_name", "work_package"],
    columns: ["activity_name", "work_package", "planned_start_date", "planned_finish_date", "percent_complete", "delay_days", "status"],
    fields: [
      { k: "project_id", label: "Project", req: true, ref: "projects" },
      { k: "work_package", label: "Work package", options: WORK_PACKAGES_LIST },
      { k: "activity_name", label: "Activity name", req: true },
      { k: "planned_start_date", label: "Planned start", type: "date" },
      { k: "planned_finish_date", label: "Planned finish", type: "date" },
      { k: "actual_start_date", label: "Actual start", type: "date" },
      { k: "actual_finish_date", label: "Actual finish", type: "date" },
      { k: "percent_complete", label: "% complete", type: "number" },
      { k: "resource_allocation", label: "Resource allocation" },
      { k: "delay_days", label: "Delay (days)", type: "number" },
      { k: "delay_reason", label: "Delay reason", type: "textarea" },
      { k: "contractor_id", label: "Contractor", ref: "contractors" },
      { k: "status", label: "Status", options: ["Not Started", "In Progress", "Completed", "Delayed"] },
    ],
  },
  inventory: {
    label: "Inventory", icon: Warehouse, idKey: "inventory_id",
    category: "8. Inventory Data",
    writeRoles: [ADMIN, PROC, SITE], searchKeys: ["warehouse_location"],
    columns: ["warehouse_location", "current_stock_level", "safety_stock_level", "reorder_point", "reorder_quantity", "last_stock_check_date", "stock_out_flag"],
    fields: [
      { k: "material_id", label: "Material", req: true, ref: "materials" },
      { k: "warehouse_location", label: "Warehouse / site" },
      { k: "current_stock_level", label: "Current stock", type: "number" },
      { k: "safety_stock_level", label: "Safety stock", type: "number" },
      { k: "reorder_point", label: "Reorder point", type: "number" },
      { k: "reorder_quantity", label: "Reorder quantity", type: "number" },
      { k: "last_stock_check_date", label: "Last stock check", type: "date" },
      { k: "stock_out_flag", label: "Stock-out", type: "bool" },
      { k: "stock_out_date", label: "Stock-out date", type: "date" },
    ],
  },
  costs: {
    label: "Costs", icon: IndianRupee, idKey: "cost_id",
    category: "9. Cost Data",
    writeRoles: [ADMIN, PROC], searchKeys: ["cost_category"],
    columns: ["cost_category", "budgeted_cost", "actual_cost", "cost_variance_pct", "escalation_pct", "recorded_date"],
    fields: [
      { k: "project_id", label: "Project", req: true, ref: "projects" },
      { k: "cost_category", label: "Cost category", req: true, options: ["Material", "Labour", "Logistics", "Equipment Hire", "Overheads"] },
      { k: "budgeted_cost", label: "Budgeted cost (INR)", type: "number" },
      { k: "actual_cost", label: "Actual cost (INR)", type: "number" },
      { k: "cost_variance_pct", label: "Variance %", type: "number" },
      { k: "escalation_pct", label: "Escalation %", type: "number" },
      { k: "exchange_rate_at_order", label: "FX at order", type: "number" },
      { k: "exchange_rate_at_payment", label: "FX at payment", type: "number" },
      { k: "recorded_date", label: "Recorded date", type: "date" },
    ],
  },
  disruptions: {
    label: "Disruptions", icon: AlertTriangle, idKey: "disruption_id",
    category: "10. Disruption / Risk Incident History",
    writeRoles: [ADMIN, PROC, SITE], searchKeys: ["disruption_type", "description"],
    columns: ["disruption_type", "event_date", "impact_days", "impact_cost", "severity", "status", "recovery_action"],
    fields: [
      { k: "project_id", label: "Project", ref: "projects" },
      { k: "supplier_id", label: "Supplier", ref: "suppliers" },
      { k: "disruption_type", label: "Type", req: true, options: ["Supplier Failure", "Transport Delay", "Quality Rejection", "Natural Disaster", "Labour Shortage", "Import Restriction", "Cost Escalation", "Cybersecurity Incident", "Other"] },
      { k: "event_date", label: "Event date", type: "date", req: true },
      { k: "description", label: "Description", type: "textarea" },
      { k: "impact_days", label: "Impact (days)", type: "number" },
      { k: "impact_cost", label: "Impact cost (INR)", type: "number" },
      { k: "severity", label: "Severity", options: ["Low", "Medium", "High", "Critical"] },
      { k: "recovery_action", label: "Recovery action", type: "textarea" },
      { k: "recovery_completed_date", label: "Recovery completed", type: "date" },
      { k: "status", label: "Status", options: ["Open", "In Progress", "Resolved"] },
    ],
  },
  carbon_records: {
    label: "Carbon Records", icon: Leaf, idKey: "carbon_id",
    category: "11. Carbon / Sustainability Data",
    writeRoles: [ADMIN, SUS], searchKeys: ["emission_source", "data_source"],
    columns: ["emission_source", "emission_factor_kgco2e_per_unit", "quantity", "calculated_emissions_kgco2e", "data_source", "verification_status", "recorded_date"],
    fields: [
      { k: "project_id", label: "Project", ref: "projects" },
      { k: "material_id", label: "Material", ref: "materials" },
      { k: "emission_source", label: "Emission source", req: true, options: ["Manufacturing", "Transport", "Construction", "Installation", "Maintenance", "End-of-Life"] },
      { k: "emission_factor_kgco2e_per_unit", label: "Emission factor (kgCO₂e/unit)", type: "number" },
      { k: "quantity", label: "Quantity", type: "number" },
      { k: "calculated_emissions_kgco2e", label: "Calculated emissions (kgCO₂e)", type: "number" },
      { k: "data_source", label: "Data source", options: ["Verified", "ESG Report", "Estimated", "Secondary"] },
      { k: "transport_distance_km", label: "Transport distance (km)", type: "number" },
      { k: "waste_generated_kg", label: "Waste generated (kg)", type: "number" },
      { k: "scrap_recycled_kg", label: "Scrap recycled (kg)", type: "number" },
      { k: "verification_status", label: "Verification", options: ["Verified", "Unverified", "Disputed"] },
      { k: "recorded_date", label: "Recorded date", type: "date" },
    ],
  },
  contractors: {
    label: "Contractors", icon: Users, idKey: "contractor_id",
    category: "12. Contractor Data",
    writeRoles: [ADMIN, PROC, SITE], searchKeys: ["contractor_code", "contractor_name", "region"],
    columns: ["contractor_code", "contractor_name", "scope_of_work", "region", "past_performance_rating", "avg_delay_days", "safety_incident_count", "certification_status"],
    fields: [
      { k: "contractor_code", label: "Contractor code", req: true },
      { k: "contractor_name", label: "Contractor name", req: true },
      { k: "scope_of_work", label: "Scope of work" },
      { k: "region", label: "Region", options: STATES },
      { k: "past_performance_rating", label: "Performance rating (0–10)", type: "number" },
      { k: "avg_delay_days", label: "Avg delay (days)", type: "number" },
      { k: "safety_incident_count", label: "Safety incidents", type: "number" },
      { k: "safety_rating", label: "Safety rating", options: ["A", "B", "C", "D"] },
      { k: "certification_status", label: "Certification", options: ["Certified", "Pending", "Expired"] },
      { k: "active_status", label: "Active", type: "bool" },
    ],
  },
};

/* human labels for column headers */
const COL_LABELS = {
  _slip: "Slip", percent_complete: "Progress", internal_rating: "Rating",
  order_value: "Value", budgeted_cost: "Budgeted", actual_cost: "Actual",
  cost_variance_pct: "Variance", escalation_pct: "Escalation",
  emission_factor_kgco2e_per_unit: "Factor", calculated_emissions_kgco2e: "Emissions",
};
function colLabel(k) {
  if (COL_LABELS[k]) return COL_LABELS[k];
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/ Id$/, "").replace(/Po /, "PO ").replace(/Pct/, "%").replace(/Kg$/, "(kg)");
}

/* how a record is labelled when referenced from a dropdown */
const REF_LABEL = {
  projects: (r) => `${r.project_code} — ${r.project_name}`,
  suppliers: (r) => `${r.supplier_code} — ${r.supplier_name}`,
  materials: (r) => `${r.material_code} — ${r.material_name}`,
  purchase_orders: (r) => `${r.po_number} — ${r.item_description || ""}`,
  contractors: (r) => `${r.contractor_code} — ${r.contractor_name}`,
};

/* ============================================================================
   FORMATTING HELPERS
   ========================================================================== */
const inr = (v) => v == null ? "—" : "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const num = (v) => v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}

const STATUS_TONE = {
  Planning: C.muted, Procurement: C.cyan, Construction: C.copper, Testing: C.amber,
  Commissioned: C.green, "On Hold": C.red, Cancelled: C.red,
  Open: C.cyan, Partial: C.amber, Closed: C.green,
  Pending: C.muted, "In Transit": C.cyan, Delivered: C.green, Delayed: C.red, Lost: C.red,
  Pass: C.green, Fail: C.red, Conditional: C.amber,
  "Not Started": C.muted, "In Progress": C.cyan, Completed: C.green,
  Low: C.green, Medium: C.amber, High: C.red, Critical: C.red,
  Resolved: C.green, Approved: C.green, Suspended: C.red, Blacklisted: C.red,
  Verified: C.green, Unverified: C.muted, Disputed: C.red,
  Certified: C.green, Expired: C.red,
  "Single-source": C.amber, "Multi-source": C.muted,
};

function Pill({ value }) {
  if (value == null || value === "") return <span style={{ color: C.faint }}>—</span>;
  const tone = STATUS_TONE[value] || C.muted;
  return (
    <span style={{
      fontFamily: FM, fontSize: 10.5, padding: "3px 9px", borderRadius: 20,
      color: tone, border: `1px solid ${tone}55`, background: `${tone}18`, whiteSpace: "nowrap",
    }}>{value}</span>
  );
}

function Meter({ value, max = 100, tone }) {
  const v = Number(value) || 0;
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  const col = tone || (pct >= 80 ? C.green : pct >= 40 ? C.copper : C.amber);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 96 }}>
      <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: col, transition: "width .3s" }} />
      </div>
      <span style={{ fontFamily: FM, fontSize: 11, color: C.muted, minWidth: 30 }}>{v}{max === 100 ? "%" : ""}</span>
    </div>
  );
}

/* renders one table cell based on the column key */
function renderCell(resource, row, key, db) {
  const v = row[key];

  if (key === "_slip") {
    const { promised_delivery_date: p, actual_delivery_date: a } = row;
    if (!p) return <span style={{ color: C.faint }}>—</span>;
    if (!a) return <span style={{ fontFamily: FM, fontSize: 11, color: C.muted }}>pending</span>;
    const d = daysBetween(p, a);
    const tone = d > 7 ? C.red : d > 0 ? C.amber : C.green;
    return <span style={{ fontFamily: FM, fontSize: 11.5, color: tone }}>
      {d > 0 ? `+${d}d late` : d === 0 ? "on time" : `${Math.abs(d)}d early`}
    </span>;
  }
  if (v == null || v === "") return <span style={{ color: C.faint }}>—</span>;
  if (typeof v === "boolean") return <Pill value={v ? "Yes" : "No"} />;
  if (key === "percent_complete") return <Meter value={v} />;
  if (key === "internal_rating" || key === "past_performance_rating") return <Meter value={v} max={10} />;
  if (STATUS_TONE[v] !== undefined) return <Pill value={v} />;
  if (/cost|value|price/.test(key)) return <span style={{ fontFamily: FM, fontSize: 12 }}>{inr(v)}</span>;
  if (/_pct$/.test(key)) {
    const tone = v > 10 ? C.red : v > 0 ? C.amber : C.green;
    return <span style={{ fontFamily: FM, fontSize: 12, color: tone }}>{v > 0 ? "+" : ""}{v}%</span>;
  }
  if (/date$/.test(key)) return <span style={{ fontFamily: FM, fontSize: 11.5, color: C.muted }}>{v}</span>;
  if (typeof v === "number") return <span style={{ fontFamily: FM, fontSize: 12 }}>{num(v)}</span>;
  if (/_code$|_number$|^po_|reference/.test(key)) return <span style={{ fontFamily: FM, fontSize: 12 }}>{v}</span>;
  return <span>{String(v)}</span>;
}


/* ============================================================================
   SHARED UI PRIMITIVES
   ========================================================================== */
function Eyebrow({ children }) {
  return <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: ".12em", color: C.copper, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}

function Btn({ children, onClick, variant = "ghost", size = "md", disabled, type = "button", style }) {
  const base = {
    fontFamily: FB, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 7, transition: "filter .15s", opacity: disabled ? 0.45 : 1,
    fontSize: size === "sm" ? 12 : 13.5, padding: size === "sm" ? "5px 10px" : "9px 15px",
    display: "inline-flex", alignItems: "center", gap: 6,
  };
  const variants = {
    primary: { background: C.copper, border: `1px solid ${C.copper}`, color: C.void },
    ghost: { background: C.panel2, border: `1px solid ${C.border}`, color: C.text },
    danger: { background: "transparent", border: `1px solid ${C.red}55`, color: C.red },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseOver={(e) => !disabled && (e.currentTarget.style.filter = "brightness(1.18)")}
      onMouseOut={(e) => (e.currentTarget.style.filter = "none")}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily: FM, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: "9px 11px", fontSize: 13.5, fontFamily: FB, outline: "none",
};

function Modal({ title, children, onClose, width = 720 }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(5,8,13,.72)", zIndex: 100,
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
        width: "100%", maxWidth: width, boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FD, fontSize: 17, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ children }) {
  return <div style={{ padding: 46, textAlign: "center", color: C.muted, fontSize: 13.5 }}>{children}</div>;
}

/* ============================================================================
   AUTH SCREEN
   ========================================================================== */
function SupplyChainBackdrop() {
  const towerX = [70, 330, 590, 850, 1110];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <style>{`
        @keyframes scmDrive { 0% { transform: translateX(-20%); } 100% { transform: translateX(120%); } }
        @keyframes scmDriveB { 0% { transform: translateX(-20%); } 100% { transform: translateX(120%); } }
        @keyframes scmDrift { 0% { transform: translateX(0); } 100% { transform: translateX(-140px); } }
        @keyframes scmPulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        @keyframes scmBlink { 0%, 100% { opacity: .3; } 50% { opacity: .85; } }
        .scm-truck-a { animation: scmDrive 26s linear infinite; }
        .scm-truck-b { animation: scmDriveB 34s linear infinite; animation-delay: -14s; }
        .scm-ship { animation: scmDrift 70s ease-in-out infinite alternate; }
        .scm-node { animation: scmPulse 2.6s ease-in-out infinite; }
        .scm-win { animation: scmBlink 4s ease-in-out infinite; }
      `}</style>
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="scmSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B0F16" />
            <stop offset="55%" stopColor="#121A24" />
            <stop offset="100%" stopColor="#0A0E14" />
          </linearGradient>
          <linearGradient id="scmWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#132029" />
            <stop offset="100%" stopColor="#0A1218" />
          </linearGradient>
        </defs>

        <rect width="1200" height="700" fill="url(#scmSky)" />

        {/* distant warehouse / port skyline */}
        {[
          [40, 480, 90, 90], [150, 500, 60, 70], [960, 470, 100, 100], [1080, 495, 70, 75],
        ].map(([x, y, w, h], i) => (
          <g key={`bldg-${i}`} opacity="0.35">
            <rect x={x} y={y} width={w} height={h} fill="#1B222C" />
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 3 }).map((__, c) => (
                <rect key={`${i}-${r}-${c}`} className="scm-win" x={x + 8 + c * (w / 3)} y={y + 10 + r * (h / 5)}
                  width={w / 3 - 10} height={h / 8} fill="#E0A458"
                  style={{ animationDelay: `${(r * 3 + c) * 0.4}s` }} />
              ))
            )}
          </g>
        ))}

        {/* transmission towers with flowing current */}
        {towerX.slice(0, -1).map((x, i) => {
          const x2 = towerX[i + 1];
          const upperPath = `M${x + 34},300 Q${(x + x2) / 2},280 ${x2 - 34},300`;
          const lowerPath = `M${x + 28},340 Q${(x + x2) / 2},322 ${x2 - 28},340`;
          return (
            <g key={`span-${i}`}>
              <path d={upperPath} stroke="#3A4657" strokeWidth="1.5" fill="none" opacity="0.7" />
              <path d={lowerPath} stroke="#3A4657" strokeWidth="1.5" fill="none" opacity="0.7" />
              <circle r="3.2" fill="#5AB2C9" className="scm-node">
                <animateMotion dur={`${5 + i}s`} repeatCount="indefinite" path={upperPath} />
              </circle>
              <circle r="3.2" fill="#CD8B4F" className="scm-node" style={{ animationDelay: "1.2s" }}>
                <animateMotion dur={`${6 + i}s`} repeatCount="indefinite" path={lowerPath} />
              </circle>
            </g>
          );
        })}
        {towerX.map((x, i) => (
          <g key={`tower-${i}`} opacity="0.85">
            <path d={`M${x - 40},430 L${x - 14},300 L${x + 14},300 L${x + 40},430 Z`} fill="none" stroke="#3A4657" strokeWidth="2" />
            <line x1={x - 34} y1="340" x2={x + 34} y2="340" stroke="#3A4657" strokeWidth="2" />
            <line x1={x - 20} y1="385" x2={x + 20} y2="385" stroke="#3A4657" strokeWidth="2" />
            <line x1={x - 40} y1="430" x2={x + 40} y2="430" stroke="#3A4657" strokeWidth="2" />
            <line x1={x} y1="300" x2={x} y2="430" stroke="#2A3341" strokeWidth="1.5" />
          </g>
        ))}

        {/* container ship on the water */}
        <rect x="0" y="470" width="1200" height="230" fill="url(#scmWater)" />
        <g className="scm-ship" opacity="0.8">
          <path d="M540,500 L860,500 L830,536 L570,536 Z" fill="#1B222C" stroke="#2A3341" />
          {[560, 610, 660, 710, 760].map((cx, i) => (
            <rect key={i} x={cx} y="474" width="42" height="24"
              fill={i % 2 === 0 ? "#8F6338" : "#232B37"} stroke="#0D1117" strokeWidth="1" />
          ))}
        </g>

        {/* road with moving trucks */}
        <rect x="0" y="560" width="1200" height="46" fill="#151B23" opacity="0.9" />
        <line x1="0" y1="583" x2="1200" y2="583" stroke="#5B6675" strokeWidth="2" strokeDasharray="26 20" opacity="0.4" />

        <g className="scm-truck-a">
          <g transform="translate(0,566)">
            <rect x="0" y="0" width="30" height="18" rx="2" fill="#8A95A6" />
            <rect x="32" y="6" width="16" height="12" rx="2" fill="#5AB2C9" />
            <circle cx="10" cy="20" r="4" fill="#0D1117" stroke="#5B6675" />
            <circle cx="38" cy="20" r="4" fill="#0D1117" stroke="#5B6675" />
          </g>
        </g>
        <g className="scm-truck-b">
          <g transform="translate(0,572) scale(0.8)">
            <rect x="0" y="0" width="30" height="18" rx="2" fill="#CD8B4F" />
            <rect x="32" y="6" width="16" height="12" rx="2" fill="#8A95A6" />
            <circle cx="10" cy="20" r="4" fill="#0D1117" stroke="#5B6675" />
            <circle cx="38" cy="20" r="4" fill="#0D1117" stroke="#5B6675" />
          </g>
        </g>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(115deg, rgba(10,14,20,.92) 0%, rgba(10,14,20,.72) 38%, rgba(10,14,20,.5) 62%, rgba(10,14,20,.85) 100%)",
      }} />
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("viewer");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (mode === "login") {
      setBusy(true);
      try {
        const u = await apiLogin({ email: email.trim(), password });
        onLogin(u);
      } catch (ex) {
        setErr(ex.message);
      } finally {
        setBusy(false);
      }
    } else {
      if (!fullName.trim()) return setErr("Full name is required.");
      if (password.length < 8) return setErr("Password must be at least 8 characters.");
      setBusy(true);
      try {
        await apiRegister({
          full_name: fullName.trim(), email: email.trim(), password, role,
          department: department.trim() || "—",
        });
        setMode("login");
        setPassword("");
        setInfo("Registration submitted. An administrator has been sent a verification link and must approve this account before you can sign in.");
      } catch (ex) {
        setErr(ex.message);
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: C.void, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FB, overflow: "hidden" }}>
      <SupplyChainBackdrop />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 420, width: "100%" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, boxShadow: "0 30px 70px rgba(0,0,0,.55)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <Zap size={20} color={C.copper} />
            <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 18 }}>Demand Forecasting</span>
          </div>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>
            {mode === "login" ? "Sign in to the decision-support system." : "Create an account — an administrator must verify it before you can sign in."}
          </p>

          {err && (
            <div style={{ background: `${C.red}1F`, border: `1px solid ${C.red}66`, color: C.red, borderRadius: 8, padding: "10px 13px", fontSize: 12.5, marginBottom: 16 }}>
              {err}
            </div>
          )}
          {info && (
            <div style={{ background: `${C.green}1F`, border: `1px solid ${C.green}66`, color: C.green, borderRadius: 8, padding: "10px 13px", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
              {info}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {mode === "register" && (
              <Field label="Full name">
                <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </Field>
            )}
            <Field label="Email">
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Role">
                  <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <input style={inputStyle} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Procurement" />
                </Field>
              </div>
            )}
            <Btn type="submit" variant="primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Btn>
          </form>

          <div style={{ marginTop: 18, fontSize: 12.5, color: C.muted, textAlign: "center" }}>
            {mode === "login" ? "No account? " : "Already registered? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(null); setInfo(null); }}
              style={{ background: "none", border: "none", color: C.copper, cursor: "pointer", fontSize: 12.5, padding: 0, fontWeight: 600 }}>
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   RECORD FORM  (create / edit)
   ========================================================================== */
function RecordForm({ resourceKey, record, db, onSave, onCancel }) {
  const cfg = SCHEMA[resourceKey];
  const [form, setForm] = useState(() => {
    const init = {};
    cfg.fields.forEach((f) => {
      init[f.k] = record ? (record[f.k] ?? "") : (f.type === "bool" ? false : "");
    });
    return init;
  });
  const [err, setErr] = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    const missing = cfg.fields.filter((f) => f.req && (form[f.k] === "" || form[f.k] == null));
    if (missing.length) {
      setErr("Required: " + missing.map((m) => m.label).join(", "));
      return;
    }
    const clean = {};
    cfg.fields.forEach((f) => {
      let v = form[f.k];
      if (v === "") v = null;
      else if (f.type === "number" && v != null) v = Number(v);
      clean[f.k] = v;
    });
    onSave(clean);
  }

  return (
    <form onSubmit={submit}>
      {err && (
        <div style={{ background: `${C.red}1F`, border: `1px solid ${C.red}66`, color: C.red, borderRadius: 8, padding: "9px 12px", fontSize: 12.5, marginBottom: 16 }}>
          {err}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "58vh", overflowY: "auto", paddingRight: 4 }}>
        {cfg.fields.map((f) => {
          const span = f.type === "textarea" ? "span 2" : "auto";
          return (
            <div key={f.k} style={{ gridColumn: span }}>
              <Field label={f.label + (f.req ? " *" : "")}>
                {f.ref ? (
                  <select style={inputStyle} value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)}>
                    <option value="">— none —</option>
                    {db[f.ref].map((r) => {
                      const idKey = SCHEMA[f.ref].idKey;
                      return <option key={r[idKey]} value={r[idKey]}>{REF_LABEL[f.ref](r)}</option>;
                    })}
                  </select>
                ) : f.options ? (
                  <select style={inputStyle} value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)}>
                    <option value="">— select —</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "bool" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer", paddingTop: 6 }}>
                    <input type="checkbox" checked={!!form[f.k]} onChange={(e) => set(f.k, e.target.checked)} />
                    {form[f.k] ? "Yes" : "No"}
                  </label>
                ) : f.type === "textarea" ? (
                  <textarea style={{ ...inputStyle, minHeight: 62, resize: "vertical" }} value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
                ) : (
                  <input style={inputStyle} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    step="any" value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" variant="primary">{record ? "Save changes" : "Create record"}</Btn>
      </div>
    </form>
  );
}

/* ============================================================================
   RESOURCE SCREEN  — table + search + pagination + CRUD
   ========================================================================== */
const PAGE_SIZE = 12;

function ResourceScreen({ resourceKey, db, user, onCreate, onUpdate, onDelete }) {
  const cfg = SCHEMA[resourceKey];
  const rows = db[resourceKey];
  const canWrite = cfg.writeRoles.includes(user.role);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);   // record | "new" | null
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => cfg.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)));
  }, [rows, q, cfg.searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <Eyebrow>{cfg.category}</Eyebrow>
      <h1 style={{ fontFamily: FD, fontSize: 25, fontWeight: 700, margin: "0 0 22px" }}>{cfg.label}</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <Search size={14} color={C.faint} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder={`Search ${cfg.label.toLowerCase()}…`}
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <div style={{ flex: 1 }} />
        {canWrite ? (
          <Btn variant="primary" onClick={() => setEditing("new")}><Plus size={14} /> New record</Btn>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, color: C.faint }}>
            <Lock size={12} /> read-only for {ROLES[user.role].label}
          </span>
        )}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {cfg.columns.map((k) => (
                  <th key={k} style={{
                    textAlign: "left", padding: "11px 14px", fontFamily: FM, fontSize: 10.5, color: C.muted,
                    textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 500,
                    borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
                  }}>{colLabel(k)}</th>
                ))}
                {canWrite && <th style={{ borderBottom: `1px solid ${C.border}`, width: 78 }} />}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={cfg.columns.length + 1}><EmptyState>
                  {q ? `No ${cfg.label.toLowerCase()} match “${q}”.` : `No records yet.`}
                </EmptyState></td></tr>
              )}
              {pageRows.map((row) => (
                <tr key={row[cfg.idKey]}
                  onMouseOver={(e) => (e.currentTarget.style.background = C.panel2)}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
                  {cfg.columns.map((k) => (
                    <td key={k} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: "nowrap" }}>
                      {renderCell(resourceKey, row, k, db)}
                    </td>
                  ))}
                  {canWrite && (
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setEditing(row)} title="Edit"
                          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 3, display: "flex" }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDel(row)} title="Delete"
                          style={{ background: "none", border: "none", color: C.red, cursor: "pointer", padding: 3, display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px",
          borderTop: `1px solid ${C.border}`, fontFamily: FM, fontSize: 11.5, color: C.muted,
        }}>
          <span>{filtered.length} record{filtered.length === 1 ? "" : "s"}{q ? ` (filtered from ${rows.length})` : ""}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</Btn>
            <span>page {safePage} / {totalPages}</span>
            <Btn size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next</Btn>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title={editing === "new" ? `New ${cfg.label.replace(/s$/, "")}` : `Edit ${cfg.label.replace(/s$/, "")}`}
          onClose={() => setEditing(null)}>
          <RecordForm resourceKey={resourceKey} record={editing === "new" ? null : editing} db={db}
            onCancel={() => setEditing(null)}
            onSave={(vals) => {
              if (editing === "new") onCreate(resourceKey, vals);
              else onUpdate(resourceKey, editing[cfg.idKey], vals);
              setEditing(null);
            }} />
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete record" onClose={() => setConfirmDel(null)} width={430}>
          <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
            Permanently delete this record? This cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => { onDelete(resourceKey, confirmDel[cfg.idKey]); setConfirmDel(null); }}>
              <Trash2 size={13} /> Delete
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}


/* ============================================================================
   OVERVIEW
   ========================================================================== */
function KpiCard({ label, value, unit, tone = C.copper, sub }) {
  return (
    <div style={{
      position: "relative", background: C.panel, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${tone}`, borderRadius: 10, padding: "16px 18px", overflow: "hidden",
    }}>
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", top: 0, right: 0, opacity: .45 }}>
        <path d="M30 0 L30 9 L21 9 L21 18 L12 18" stroke={C.copperSoft} strokeWidth="1" fill="none" />
        <circle cx="12" cy="18" r="1.5" fill={C.copper} />
      </svg>
      <div style={{ fontFamily: FM, fontSize: 10.5, color: C.muted, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 13, color: C.muted, marginLeft: 4, fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 7 }}>{sub}</div>}
    </div>
  );
}

function Overview({ db, user, go }) {
  const openDisruptions = db.disruptions.filter((d) => d.status !== "Resolved").length;
  const latePOs = db.purchase_orders.filter((p) => p.actual_delivery_date && p.promised_delivery_date
    && daysBetween(p.promised_delivery_date, p.actual_delivery_date) > 0).length;
  const closedPOs = db.purchase_orders.filter((p) => p.actual_delivery_date).length;
  const onTimePct = closedPOs ? Math.round(((closedPOs - latePOs) / closedPOs) * 100) : 0;
  const stockOuts = db.inventory.filter((i) => i.stock_out_flag).length;
  const totalCarbon = db.carbon_records.reduce((s, r) => s + (r.calculated_emissions_kgco2e || 0), 0);

  /* delay distribution across delivered POs */
  const slipBuckets = useMemo(() => {
    const buckets = [
      { name: "Early", min: -999, max: -1, count: 0, tone: C.green },
      { name: "On time", min: 0, max: 0, count: 0, tone: C.green },
      { name: "1–7d", min: 1, max: 7, count: 0, tone: C.amber },
      { name: "8–14d", min: 8, max: 14, count: 0, tone: C.amber },
      { name: "15d+", min: 15, max: 999, count: 0, tone: C.red },
    ];
    db.purchase_orders.forEach((p) => {
      if (!p.actual_delivery_date || !p.promised_delivery_date) return;
      const d = daysBetween(p.promised_delivery_date, p.actual_delivery_date);
      const b = buckets.find((x) => d >= x.min && d <= x.max);
      if (b) b.count++;
    });
    return buckets;
  }, [db.purchase_orders]);

  const cards = Object.keys(SCHEMA);

  return (
    <>
      <Eyebrow>Decision-Support System</Eyebrow>
      <h1 style={{ fontFamily: FD, fontSize: 25, fontWeight: 700, margin: "0 0 24px" }}>
        Welcome back, {user.full_name.split(" ")[0]}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 15, marginBottom: 30 }}>
        <KpiCard label="Active projects" value={db.projects.filter((p) => !["Commissioned", "Cancelled"].includes(p.project_status)).length}
          sub={`${db.projects.length} total in portfolio`} />
        <KpiCard label="On-time delivery" value={onTimePct} unit="%" tone={onTimePct > 70 ? C.green : C.amber}
          sub={`${latePOs} of ${closedPOs} delivered POs late`} />
        <KpiCard label="Open disruptions" value={openDisruptions} tone={openDisruptions > 20 ? C.red : C.amber}
          sub={`${db.disruptions.length} logged all-time`} />
        <KpiCard label="Stock-outs" value={stockOuts} tone={stockOuts ? C.red : C.green}
          sub={`across ${db.inventory.length} stock positions`} />
        <KpiCard label="Recorded emissions" value={(totalCarbon / 1000).toFixed(1)} unit="tCO₂e" tone={C.violet}
          sub={`${db.carbon_records.length} carbon records`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 30 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <Eyebrow>Delivery performance</Eyebrow>
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Where deliveries land</div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
            Actual vs. promised date across all delivered purchase orders.
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={slipBuckets} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: C.faint, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: C.borderSoft }} contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: FM, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {slipBuckets.map((b, i) => <Cell key={i} fill={b.tone} fillOpacity={.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <Eyebrow>Highest-risk suppliers</Eyebrow>
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Risk ranking (top 5)</div>
          <div style={{ display: "grid", gap: 9 }}>
            {[...db.suppliers].sort((a, b) => b._risk_score - a._risk_score).slice(0, 5).map((s) => {
              const tone = s._risk_band === "High" ? C.red : s._risk_band === "Medium" ? C.amber : C.green;
              return (
                <div key={s.supplier_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.supplier_name}</div>
                    <div style={{ fontFamily: FM, fontSize: 10, color: C.faint }}>
                      {s._on_time_rate}% on-time · {s.sourcing_type}
                    </div>
                  </div>
                  <div style={{ width: 92, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: s._risk_score + "%", height: "100%", background: tone }} />
                  </div>
                  <span style={{ fontFamily: FM, fontSize: 11.5, color: tone, width: 22, textAlign: "right" }}>{s._risk_score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Eyebrow>All data categories</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: 13 }}>
        {cards.map((key) => {
          const cfg = SCHEMA[key];
          const Icon = cfg.icon;
          const canWrite = cfg.writeRoles.includes(user.role);
          return (
            <button key={key} onClick={() => go(key)} style={{
              textAlign: "left", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 11,
              padding: 16, cursor: "pointer", color: C.text, fontFamily: FB, transition: "border-color .15s",
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = C.copperSoft)}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
                <Icon size={17} color={C.copper} />
                <span style={{ fontFamily: FM, fontSize: 16, color: C.copper, fontWeight: 600 }}>
                  {db[key].length.toLocaleString()}
                </span>
              </div>
              <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{cfg.label}</div>
              <div style={{ fontFamily: FM, fontSize: 9.5, color: C.faint }}>
                {cfg.category.split(".")[0]} · {canWrite ? "editable" : "read-only"}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================================
   AI FORECASTING
   ========================================================================== */
function ForecastTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontFamily: FM, fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 5 }}>{label}</div>
      {row?.actual != null && <div style={{ color: C.cyan }}>Actual: {num(row.actual)} {unit}</div>}
      {row?.forecast != null && <div style={{ color: C.copper }}>Forecast: {num(row.forecast)} {unit}</div>}
    </div>
  );
}

function Forecasting({ db }) {
  const [cat, setCat] = useState(MODEL.meta.categories[0]);
  const [wf, setWf] = useState({
    category: MODEL.meta.categories[0], region: MODEL.meta.regions[0], transport: "Road",
    qtyRatio: 1, monsoon: false, urgency: false, ontime: .85,
  });

  const series = MODEL.demand_forecast.series[cat];
  const dm = MODEL.delay_model;

  const chartData = useMemo(() => {
    const hist = series.historical.map((v, i) => ({ label: `M${i + 1}`, actual: v }));
    const fc = series.forecast.map((v, i) => ({
      label: `M${series.historical.length + i + 1}`, forecast: v,
      band: [series.forecast_lower[i], series.forecast_upper[i]],
    }));
    return [...hist, ...fc];
  }, [series]);

  const estimate = useMemo(() => {
    const m = MODEL.whatif_model;
    let v = m.intercept + (m.category[wf.category] || 0) + (m.region[wf.region] || 0)
      + (m.transport[wf.transport] || 0) + m.qty_coef * wf.qtyRatio
      + m.monsoon_coef * (wf.monsoon ? 1 : 0) + m.urgency_coef * (wf.urgency ? 1 : 0)
      + m.ontime_coef * wf.ontime;
    return Math.max(-5, v);
  }, [wf]);

  const estTone = estimate > 20 ? C.red : estimate > 8 ? C.amber : C.green;

  return (
    <>
      <Eyebrow>AI Module — Demand &amp; Delay Forecasting</Eyebrow>
      <h1 style={{ fontFamily: FD, fontSize: 25, fontWeight: 700, margin: "0 0 24px" }}>AI Forecasting</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 15, marginBottom: 30 }}>
        <KpiCard label="Training records" value={MODEL.meta.n_orders.toLocaleString()} unit="orders" tone={C.cyan} />
        <KpiCard label="Delay model MAE" value={dm.mae_days} unit="days" sub="mean absolute error" />
        <KpiCard label="Delay model R²" value={dm.r2} tone={C.green} sub={`${dm.n_train.toLocaleString()} train / ${dm.n_test} test`} />
        <KpiCard label="Demand MAPE (avg)" value={MODEL.demand_forecast.avg_mape_pct} unit="%" tone={C.amber} sub="across 6 categories" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, marginBottom: 30 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div>
              <Eyebrow>Demand forecast</Eyebrow>
              <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>{cat}</div>
            </div>
            <div style={{ fontFamily: FM, fontSize: 11, color: C.muted }}>
              MAPE <span style={{ color: series.mape > 40 ? C.red : C.amber }}>{series.mape}%</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {MODEL.meta.categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} style={{
                fontFamily: FM, fontSize: 11, padding: "5px 9px", borderRadius: 6, cursor: "pointer",
                background: c === cat ? C.copper : "transparent", color: c === cat ? C.void : C.muted,
                border: `1px solid ${c === cat ? C.copper : C.border}`, fontWeight: c === cat ? 600 : 400,
              }}>{c}</button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={258}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.copper} stopOpacity={.24} />
                  <stop offset="100%" stopColor={C.copper} stopOpacity={.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} interval={2} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={54} />
              <Tooltip content={<ForecastTip unit={series.unit} />} />
              <Area type="monotone" dataKey="band" fill="url(#bandGrad)" stroke="none" connectNulls />
              <Line type="monotone" dataKey="actual" stroke={C.cyan} strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="forecast" stroke={C.copper} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2.5, fill: C.copper }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontFamily: FM, fontSize: 10.5, color: C.muted, flexWrap: "wrap" }}>
            <span><i style={{ display: "inline-block", width: 11, height: 2, background: C.cyan, marginRight: 6, verticalAlign: 3 }} />24mo historical</span>
            <span><i style={{ display: "inline-block", width: 11, height: 2, background: C.copper, marginRight: 6, verticalAlign: 3 }} />6mo forecast</span>
            <span><i style={{ display: "inline-block", width: 11, height: 8, background: C.copper, opacity: .25, marginRight: 6 }} />~80% band</span>
          </div>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
          <Eyebrow>Delay model — drivers</Eyebrow>
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>What predicts a delay</div>
          <ResponsiveContainer width="100%" height={272}>
            <BarChart data={dm.feature_importance} layout="vertical" margin={{ left: 4, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="feature" width={128} tick={{ fill: C.muted, fontSize: 10.5 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: C.borderSoft }}
                contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: FM, fontSize: 12 }}
                formatter={(v) => [v + "%", "importance"]} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {dm.feature_importance.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.copper : C.copperSoft} fillOpacity={i === 0 ? 1 : .5 + .5 * (dm.feature_importance.length - i) / dm.feature_importance.length} />
                ))}
                <LabelList dataKey="importance" position="right" formatter={(v) => v + "%"}
                  style={{ fill: C.faint, fontSize: 10, fontFamily: "monospace" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* what-if */}
      <Eyebrow>Interactive</Eyebrow>
      <h2 style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, margin: "0 0 16px" }}>What-if delay estimator</h2>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24,
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 26, marginBottom: 30,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Material category">
            <select style={inputStyle} value={wf.category} onChange={(e) => setWf({ ...wf, category: e.target.value })}>
              {MODEL.meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Supplier region">
            <select style={inputStyle} value={wf.region} onChange={(e) => setWf({ ...wf, region: e.target.value })}>
              {MODEL.meta.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Transport mode">
            <select style={inputStyle} value={wf.transport} onChange={(e) => setWf({ ...wf, transport: e.target.value })}>
              {["Road", "Rail", "Sea", "Air"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={`Supplier on-time rate — ${(wf.ontime * 100).toFixed(0)}%`}>
            <input type="range" min={.4} max={.99} step={.01} value={wf.ontime}
              onChange={(e) => setWf({ ...wf, ontime: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: C.copper, marginTop: 8 }} />
          </Field>
          <div style={{ gridColumn: "span 2" }}>
            <Field label={`Order size vs. category-typical — ${wf.qtyRatio.toFixed(2)}×`}>
              <input type="range" min={.2} max={3} step={.05} value={wf.qtyRatio}
                onChange={(e) => setWf({ ...wf, qtyRatio: parseFloat(e.target.value) })}
                style={{ width: "100%", accentColor: C.copper, marginTop: 8 }} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 22, gridColumn: "span 2" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={wf.monsoon} onChange={(e) => setWf({ ...wf, monsoon: e.target.checked })} style={{ accentColor: C.copper }} />
              Monsoon-season order
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={wf.urgency} onChange={(e) => setWf({ ...wf, urgency: e.target.checked })} style={{ accentColor: C.copper }} />
              Marked urgent
            </label>
          </div>
        </div>

        <div style={{
          background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22,
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center",
        }}>
          <Eyebrow>Estimated delay</Eyebrow>
          <div style={{ fontFamily: FD, fontSize: 46, fontWeight: 700, lineHeight: 1, color: estTone, transition: "color .2s" }}>
            {estimate.toFixed(1)}
          </div>
          <div style={{ fontFamily: FM, fontSize: 12, color: C.muted, marginTop: 7 }}>days beyond baseline schedule</div>
          <div style={{ fontFamily: FM, fontSize: 10.5, color: C.faint, marginTop: 15 }}>
            ±{dm.mae_days} day typical model error
          </div>
        </div>
      </div>

      {/* supplier risk */}
      <Eyebrow>Risk ranking</Eyebrow>
      <h2 style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Supplier risk table</h2>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Supplier", "Category", "Region", "On-time %", "Avg delay", "Orders", "Sourcing", "Risk"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "11px 14px", fontFamily: FM, fontSize: 10.5, color: C.muted,
                    textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 500, borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL.supplier_risk.map((s) => {
                const tone = s.risk_band === "High" ? C.red : s.risk_band === "Medium" ? C.amber : C.green;
                return (
                  <tr key={s.supplier}>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontWeight: 500 }}>{s.supplier}</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, color: C.muted, fontSize: 12.5 }}>{s.category}</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, color: C.muted, fontSize: 12.5 }}>{s.region}</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontFamily: FM, fontSize: 12.5 }}>{s.on_time_rate}%</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontFamily: FM, fontSize: 12.5 }}>
                      {s.avg_delay_days > 0 ? "+" : ""}{s.avg_delay_days}d
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontFamily: FM, fontSize: 12.5, color: C.muted }}>{s.orders_ytd}</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}><Pill value={s.sourcing} /></td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                      <span style={{
                        fontFamily: FM, fontSize: 10.5, padding: "3px 9px", borderRadius: 20,
                        color: tone, border: `1px solid ${tone}55`, background: `${tone}22`,
                      }}>{s.risk_band.toUpperCase()} · {s.risk_score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 22, fontFamily: FM, fontSize: 11, color: C.faint, lineHeight: 1.6, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 16 }}>
        Note: Power Transformers show a much higher forecast error ({MODEL.demand_forecast.series["Power Transformers"].mape}% MAPE)
        than the other categories. That is expected rather than a defect — low-volume, high-value items
        have lumpy, intermittent demand that simple trend models handle poorly. A dedicated intermittent-demand
        method (e.g. Croston’s) would be the right follow-up.
      </div>
    </>
  );
}

/* ============================================================================
   ROOT APP
   ========================================================================== */
export default function App() {
  const [db, setDb] = useState(buildDatabase);
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("overview");
  const [toast, setToast] = useState(null);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const createRecord = useCallback((resourceKey, vals) => {
    const cfg = SCHEMA[resourceKey];
    const idPrefix = cfg.idKey.split("_")[0].toUpperCase().slice(0, 3);
    const rec = { ...vals, [cfg.idKey]: uid(idPrefix), created_at: new Date().toISOString().slice(0, 10) };
    if (resourceKey === "suppliers") {
      rec._risk_score = 20; rec._risk_band = "Low";
      rec._on_time_rate = 85; rec._avg_delay_days = 0; rec._orders_ytd = 0;
    }
    setDb((d) => ({ ...d, [resourceKey]: [rec, ...d[resourceKey]] }));
    flash(`${cfg.label.replace(/s$/, "")} created.`);
  }, [flash]);

  const updateRecord = useCallback((resourceKey, id, vals) => {
    const cfg = SCHEMA[resourceKey];
    setDb((d) => ({
      ...d,
      [resourceKey]: d[resourceKey].map((r) => r[cfg.idKey] === id ? { ...r, ...vals } : r),
    }));
    flash("Changes saved.");
  }, [flash]);

  const deleteRecord = useCallback((resourceKey, id) => {
    const cfg = SCHEMA[resourceKey];
    setDb((d) => ({ ...d, [resourceKey]: d[resourceKey].filter((r) => r[cfg.idKey] !== id) }));
    flash("Record deleted.");
  }, [flash]);

  if (!user) {
    return (
      <AuthScreen onLogin={(u) => { setUser(u); setRoute("overview"); }} />
    );
  }

  const NAV = [
    { key: "overview", label: "Overview", Icon: LayoutGrid },
    ...Object.keys(SCHEMA).map((k) => ({ key: k, label: SCHEMA[k].label, Icon: SCHEMA[k].icon })),
    { key: "forecasting", label: "AI Forecasting", Icon: TrendingUp },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.void, color: C.text, fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${C.copper}; color: #000; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${C.copper}; outline-offset: 1px; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: ${C.border}; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${C.copper}; cursor: pointer; border: 2px solid ${C.void}; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-track { background: ${C.void}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 5px; }
      `}</style>

      {/* sidebar */}
      <aside style={{
        width: 218, flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`,
        padding: "20px 13px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 18px", borderBottom: `1px solid ${C.borderSoft}`, marginBottom: 14 }}>
          <Zap size={18} color={C.copper} />
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 14.5 }}>Demand Forecasting</span>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", marginRight: -6, paddingRight: 6 }}>
          {NAV.map(({ key, label, Icon }) => {
            const active = route === key;
            return (
              <button key={key} onClick={() => setRoute(key)} style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                padding: "8px 11px", borderRadius: 7, marginBottom: 2, cursor: "pointer", fontFamily: FB,
                fontSize: 12.8, fontWeight: active ? 600 : 500,
                background: active ? C.panel2 : "transparent",
                color: active ? C.copper : C.muted,
                border: `1px solid ${active ? C.border : "transparent"}`,
              }}>
                <Icon size={14} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${C.borderSoft}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user.full_name}</div>
          <div style={{ fontFamily: FM, fontSize: 10, color: ROLES[user.role].color, marginBottom: 11 }}>
            {ROLES[user.role].label}
          </div>
          <Btn size="sm" onClick={() => { setUser(null); setRoute("overview"); }} style={{ width: "100%", justifyContent: "center" }}>
            <LogOut size={12} /> Log out
          </Btn>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{
          height: 56, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 26px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: FM, fontSize: 10.5, color: C.green, letterSpacing: ".05em" }}>
              IN-BROWSER DATABASE · {Object.keys(SCHEMA).reduce((s, k) => s + db[k].length, 0).toLocaleString()} RECORDS
            </span>
          </div>
          <span style={{ fontFamily: FM, fontSize: 11, color: C.muted }}>{user.department}</span>
        </div>

        <div style={{ flex: 1, padding: 26, maxWidth: 1380, width: "100%", margin: "0 auto" }}>
          {route === "overview" && <Overview db={db} user={user} go={setRoute} />}
          {route === "forecasting" && <Forecasting db={db} />}
          {SCHEMA[route] && (
            <ResourceScreen resourceKey={route} db={db} user={user}
              onCreate={createRecord} onUpdate={updateRecord} onDelete={deleteRecord} />
          )}
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
          background: C.panel2, border: `1px solid ${C.copper}66`, color: C.text,
          padding: "10px 18px", borderRadius: 9, fontSize: 13, zIndex: 200,
          animation: "slideUp .2s ease-out", boxShadow: "0 8px 28px rgba(0,0,0,.45)",
        }}>{toast}</div>
      )}
    </div>
  );
}
