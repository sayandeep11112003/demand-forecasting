// Mirrors the write-relevant subset of src/App.jsx's SCHEMA (idKey + writeRoles per
// resource). The frontend owns the full field/column/label metadata for rendering;
// the backend only needs enough to route, key, and authorize records generically.
export const RESOURCES = {
  projects: { idKey: "project_id", writeRoles: ["admin", "procurement_manager"] },
  suppliers: { idKey: "supplier_id", writeRoles: ["admin", "procurement_manager"] },
  materials: { idKey: "material_id", writeRoles: ["admin", "procurement_manager"] },
  purchase_orders: { idKey: "po_id", writeRoles: ["admin", "procurement_manager"] },
  shipments: { idKey: "shipment_id", writeRoles: ["admin", "procurement_manager", "site_engineer"] },
  inspections: { idKey: "inspection_id", writeRoles: ["admin", "quality_inspector", "site_engineer"] },
  construction_activities: { idKey: "activity_id", writeRoles: ["admin", "site_engineer"] },
  inventory: { idKey: "inventory_id", writeRoles: ["admin", "procurement_manager", "site_engineer"] },
  costs: { idKey: "cost_id", writeRoles: ["admin", "procurement_manager"] },
  disruptions: { idKey: "disruption_id", writeRoles: ["admin", "procurement_manager", "site_engineer"] },
  carbon_records: { idKey: "carbon_id", writeRoles: ["admin", "sustainability_officer"] },
  contractors: { idKey: "contractor_id", writeRoles: ["admin", "procurement_manager", "site_engineer"] },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);
