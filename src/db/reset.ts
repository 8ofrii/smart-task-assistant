import { pool } from "./pool.js";

async function main() {
  await pool.query("TRUNCATE TABLE audit_logs, tasks RESTART IDENTITY;");
  console.log("Demo tasks and audit logs were reset.");
  await pool.end();
}

main().catch(async (error) => {
  console.error("Database reset failed:", error);
  await pool.end();
  process.exit(1);
});