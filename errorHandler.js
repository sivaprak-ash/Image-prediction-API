/**
 * Central error handler.
 * Maps known error codes to HTTP status codes and returns a consistent JSON shape.
 */
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== "production";

  // Determine HTTP status
  let status = err.status || err.statusCode || 500;

  // Multer-specific errors
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    err.message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10} MB.`;
    err.code = "FILE_TOO_LARGE";
  }

  // Anthropic SDK errors
  if (err.status === 401) {
    err.code = "INVALID_API_KEY";
    err.message = "Invalid or missing Anthropic API key.";
  }
  if (err.status === 429) {
    err.code = "RATE_LIMIT_EXCEEDED";
    err.message = "Anthropic API rate limit exceeded. Please retry shortly.";
  }

  const body = {
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred.",
    },
  };

  // Include stack trace in development
  if (isDev && err.stack) {
    body.error.stack = err.stack;
  }

  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path} — ${err.message}`);

  res.status(status).json(body);
}

module.exports = { errorHandler };
