import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import chatRouter from "./routes/chat.route.js";

export const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(chatRouter);