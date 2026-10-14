import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";

async function start() {
  await pool.query("SELECT 1");
  console.log("Database connection OK.");

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`LLM provider: ${config.llmProvider}`);
  });
}

start().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});