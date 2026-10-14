import fs from "node:fs";
import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

function databaseUrlWithoutSslMode(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

function buildSslConfig(): false | { rejectUnauthorized: boolean; ca?: string } {
  if (!config.dbSsl) return false;

  if (config.dbCaCertPath) {
    if (!fs.existsSync(config.dbCaCertPath)) {
      throw new Error(
        `DB_CA_CERT_PATH does not exist: ${config.dbCaCertPath}`
      );
    }

    return {
      rejectUnauthorized: true,
      ca: fs.readFileSync(config.dbCaCertPath, "utf8")
    };
  }

  return {
    rejectUnauthorized: config.dbSslRejectUnauthorized
  };
}

export const pool = new Pool({
  connectionString: databaseUrlWithoutSslMode(config.databaseUrl),
  ssl: buildSslConfig(),
  max: config.dbPoolMax,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000
});