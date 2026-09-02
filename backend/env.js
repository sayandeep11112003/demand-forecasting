import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Must be imported before any module that reads process.env at module scope
// (db.js's pool, for one) — ES module static imports are hoisted and run
// before the importing file's own top-level code, so calling dotenv.config()
// from inside server.js itself was always too late to affect sibling imports.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
