import "dotenv/config";
import { initDb } from "../core/database.js";

await initDb();
console.log("Database initialization complete.");
process.exit(0);
