import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { initDatabase } from "./db/init.js";

async function start() {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${config.port}`);
    console.log(`LLM provider: ${config.llmProvider}`);
  });

  // Verify database connection asynchronously and ensure schema/seed exists
  pool.query("SELECT 1")
    .then(async () => {
      console.log("Database connection OK.");
      try {
        await initDatabase(false);
      } catch (err: any) {
        console.warn("Database auto-init notice:", err.message);
      }
    })
    .catch((error) => {
      console.error("Database initial connection warning:", error.message);
    });
}

start().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});