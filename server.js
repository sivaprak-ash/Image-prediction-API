require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const predictRoutes = require("./routes/predict");
const healthRoutes = require("./routes/health");
const { errorHandler } = require("./middleware/errorHandler");
const { rateLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || "v1";

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disabled so the playground HTML loads scripts
  })
);

const corsOrigins = process.env.CORS_ORIGINS || "*";
app.use(
  cors({
    origin: corsOrigins === "*" ? "*" : corsOrigins.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static Playground UI ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}`, rateLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}`, healthRoutes);
app.use(`/api/${API_VERSION}/predict`, predictRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🔮  Image Prediction API`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Server   →  http://localhost:${PORT}`);
  console.log(`  API Base →  http://localhost:${PORT}/api/${API_VERSION}`);
  console.log(`  Playground → http://localhost:${PORT}`);
  console.log(`  Env      →  ${process.env.NODE_ENV || "development"}`);
  console.log(`  ─────────────────────────────────────────\n`);
});

module.exports = app; // for testing
