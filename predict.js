const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload");
const {
  classify,
  describe,
  detectObjects,
  extractText,
  analyzeSentiment,
  custom,
} = require("../controllers/predictController");

/**
 * All routes accept multipart/form-data with an `image` field.
 * Alternatively, pass `{ "image_url": "https://..." }` as JSON.
 */

// POST /api/v1/predict/classify
router.post("/classify", upload.single("image"), classify);

// POST /api/v1/predict/describe
router.post("/describe", upload.single("image"), describe);

// POST /api/v1/predict/detect
router.post("/detect", upload.single("image"), detectObjects);

// POST /api/v1/predict/ocr
router.post("/ocr", upload.single("image"), extractText);

// POST /api/v1/predict/sentiment
router.post("/sentiment", upload.single("image"), analyzeSentiment);

// POST /api/v1/predict/custom
// Body: { prompt: "your custom question about the image" }
router.post("/custom", upload.single("image"), custom);

module.exports = router;
