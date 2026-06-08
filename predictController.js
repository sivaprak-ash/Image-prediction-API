const { v4: uuidv4 } = require("uuid");
const claudeService = require("../utils/claudeService");
const { prepareImageSource } = require("../utils/imageUtils");

// ── Shared response wrapper ────────────────────────────────────────────────────
function success(res, data, meta = {}) {
  res.json({
    success: true,
    request_id: uuidv4(),
    timestamp: new Date().toISOString(),
    model: "claude-sonnet-4-20250514",
    ...meta,
    data,
  });
}

// ── classify ──────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/classify
 *
 * Returns:
 *   category, subcategory, confidence, alternative_labels, description
 */
async function classify(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);

    const prompt = `Analyze this image and return ONLY a valid JSON object — no markdown, no extra text.
{
  "category": "primary category label",
  "subcategory": "more specific label",
  "confidence": <float 0–1>,
  "alternative_labels": ["label1", "label2", "label3"],
  "description": "one concise sentence"
}`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "classify" });
  } catch (err) {
    next(err);
  }
}

// ── describe ─────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/describe
 *
 * Returns:
 *   summary, scene_type, main_subjects, colors, mood
 */
async function describe(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);

    const prompt = `Describe this image thoroughly and return ONLY a valid JSON object — no markdown, no extra text.
{
  "summary": "2-3 sentence description",
  "scene_type": "indoor | outdoor | abstract | close-up | etc.",
  "main_subjects": ["subject1", "subject2"],
  "colors": ["dominant color 1", "dominant color 2", "dominant color 3"],
  "mood": "overall mood or atmosphere",
  "time_of_day": "morning | afternoon | evening | night | unknown",
  "style": "photograph | illustration | diagram | artwork | screenshot | etc."
}`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "describe" });
  } catch (err) {
    next(err);
  }
}

// ── detectObjects ─────────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/detect
 *
 * Returns:
 *   objects[], count, dominant_object
 */
async function detectObjects(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);

    const prompt = `Detect and list all objects in this image. Return ONLY a valid JSON object — no markdown, no extra text.
{
  "objects": [
    { "name": "object name", "confidence": <float 0–1>, "prominent": <boolean> }
  ],
  "count": <integer>,
  "dominant_object": "most visually prominent object",
  "background": "brief background description"
}`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "detect" });
  } catch (err) {
    next(err);
  }
}

// ── extractText (OCR) ─────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/ocr
 *
 * Returns:
 *   text_found, extracted_text, language, text_type, confidence
 */
async function extractText(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);

    const prompt = `Extract all visible text from this image. Return ONLY a valid JSON object — no markdown, no extra text.
{
  "text_found": <boolean>,
  "extracted_text": "full extracted text, or empty string if none",
  "language": "detected language name or 'unknown'",
  "language_code": "ISO 639-1 code or 'und'",
  "text_type": "printed | handwritten | mixed | digital | none",
  "confidence": <float 0–1>,
  "line_count": <integer>
}`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "ocr" });
  } catch (err) {
    next(err);
  }
}

// ── analyzeSentiment ──────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/sentiment
 *
 * Returns:
 *   overall_sentiment, sentiment_score, emotions[], energy_level, valence
 */
async function analyzeSentiment(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);

    const prompt = `Analyze the emotional sentiment conveyed by this image. Return ONLY a valid JSON object — no markdown, no extra text.
{
  "overall_sentiment": "positive | neutral | negative",
  "sentiment_score": <float -1 to 1>,
  "emotions": ["primary emotion", "secondary emotion"],
  "energy_level": "low | medium | high",
  "valence": "pleasant | neutral | unpleasant",
  "arousal": "calm | moderate | excited",
  "notes": "brief explanation of the sentiment reading"
}`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "sentiment" });
  } catch (err) {
    next(err);
  }
}

// ── custom ────────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/predict/custom
 * Body: { prompt: "your question" }
 *
 * Returns raw parsed JSON from Claude.
 */
async function custom(req, res, next) {
  try {
    const imageSource = await prepareImageSource(req);
    const userPrompt = req.body.prompt;

    if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_PROMPT",
          message: "A non-empty 'prompt' field is required for the custom endpoint.",
        },
      });
    }

    const prompt = `${userPrompt.trim()}

Respond ONLY with a valid JSON object — no markdown fences, no preamble, no extra text.`;

    const result = await claudeService.analyzeImage(imageSource, prompt);
    success(res, result, { mode: "custom", user_prompt: userPrompt.trim() });
  } catch (err) {
    next(err);
  }
}

module.exports = { classify, describe, detectObjects, extractText, analyzeSentiment, custom };
