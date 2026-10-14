import dotenv from "dotenv";

dotenv.config();

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const llmProvider = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();

if (!["openrouter", "openai", "gemini", "fallback"].includes(llmProvider)) {
  throw new Error(
    "LLM_PROVIDER must be openrouter, openai, gemini, or fallback"
  );
}

export const config = {
  port: Number(process.env.PORT || 3000),

  databaseUrl: process.env.DATABASE_URL || "",
  dbPoolMax: Number(process.env.DB_POOL_MAX || 10),
  dbSsl: boolEnv(process.env.DB_SSL, true),
  dbCaCertPath: process.env.DB_CA_CERT_PATH || "",
  dbSslRejectUnauthorized: boolEnv(
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
    true
  ),

  llmProvider: llmProvider as
    | "openrouter"
    | "openai"
    | "gemini"
    | "fallback",

  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiBaseUrl:
    process.env.OPENAI_BASE_URL ||
    (llmProvider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1"),
  openaiModel:
    process.env.OPENAI_MODEL ||
    (llmProvider === "openrouter"
      ? "openai/gpt-4o-mini"
      : "gpt-4o-mini"),

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  logParseSource: boolEnv(process.env.LOG_PARSE_SOURCE, true)
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (config.dbPoolMax < 1 || config.dbPoolMax > 14) {
  throw new Error("DB_POOL_MAX must be between 1 and 14 for this Aiven service");
}

if (
  (config.llmProvider === "openai" ||
    config.llmProvider === "openrouter") &&
  !config.openaiApiKey
) {
  console.warn(
    "OPENAI_API_KEY is missing; parser will fall back to deterministic mode."
  );
}

if (config.llmProvider === "gemini" && !config.geminiApiKey) {
  console.warn("GEMINI_API_KEY is missing; parser will fall back to deterministic mode.");
}