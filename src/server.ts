import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";

async function start() {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${config.port}`);
    console.log(`LLM provider: ${config.llmProvider}`);
  });

  // Verify database connection asynchronously so server binding is instantaneous on Render
  pool.query("SELECT 1")
    .then(() => {
      console.log("Database connection OK.");
    })
    .catch((error) => {
      console.error("Database initial connection warning:", error.message);
    });
}

start().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});