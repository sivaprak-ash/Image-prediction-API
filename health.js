const express = require("express");
const router = express.Router();

/**
 * GET /api/v1/health
 * Liveness check — returns server status and uptime.
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    version: process.env.API_VERSION || "v1",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

module.exports = router;
