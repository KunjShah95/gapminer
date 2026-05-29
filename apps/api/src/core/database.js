// Re-export unified database module (Prisma + raw SQL pool + initDb)
export {
  prisma,
  pool,
  query,
  getClient,
  initDb,
  hasPgVector,
  vectorQuery,
} from "./database.ts";
