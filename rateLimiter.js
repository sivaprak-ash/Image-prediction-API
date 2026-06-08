const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please wait before trying again.",
        retry_after_seconds: Math.ceil(
          (req.rateLimit.resetTime - Date.now()) / 1000
        ),
      },
    });
  },
});

module.exports = { rateLimiter };
