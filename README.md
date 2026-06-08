# ⬡ Image Prediction API

A production-ready REST API that uses **Claude's vision model** to analyze images — classify, describe, detect objects, extract text (OCR), and assess sentiment. Built with Node.js + Express.

---

## Features

| Mode | Endpoint | What it returns |
|------|----------|-----------------|
| Classify | `POST /api/v1/predict/classify` | category, confidence, alt labels |
| Describe | `POST /api/v1/predict/describe` | summary, scene type, colors, mood |
| Detect objects | `POST /api/v1/predict/detect` | object list with confidence scores |
| OCR / Extract text | `POST /api/v1/predict/ocr` | extracted text, language, type |
| Sentiment | `POST /api/v1/predict/sentiment` | sentiment score, emotions, energy |
| Custom | `POST /api/v1/predict/custom` | freeform JSON response |
| Health | `GET /api/v1/health` | server status & uptime |

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd image-prediction-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts at **http://localhost:3000**.

Open the browser playground at [http://localhost:3000](http://localhost:3000).

---

## API Reference

All endpoints accept an image in **one of three ways**:

| Method | How to send |
|--------|-------------|
| File upload | `multipart/form-data` with field `image` |
| URL | JSON body `{ "image_url": "https://..." }` |
| Base64 | JSON body `{ "image_base64": "...", "media_type": "image/jpeg" }` |

All responses follow this shape:

```json
{
  "success": true,
  "request_id": "uuid",
  "timestamp": "ISO 8601",
  "model": "claude-sonnet-4-20250514",
  "mode": "classify",
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "NO_IMAGE",
    "message": "No image provided..."
  }
}
```

---

### POST /api/v1/predict/classify

```bash
curl -X POST http://localhost:3000/api/v1/predict/classify \
  -F "image=@photo.jpg"
```

Response:

```json
{
  "data": {
    "category": "animal",
    "subcategory": "golden retriever",
    "confidence": 0.97,
    "alternative_labels": ["dog", "pet", "canine"],
    "description": "A golden retriever sitting on a green lawn."
  }
}
```

---

### POST /api/v1/predict/describe

```bash
curl -X POST http://localhost:3000/api/v1/predict/describe \
  -F "image=@scene.jpg"
```

Response:

```json
{
  "data": {
    "summary": "A busy city street at dusk with neon signs.",
    "scene_type": "outdoor",
    "main_subjects": ["street", "pedestrians", "neon signs"],
    "colors": ["orange", "deep blue", "neon pink"],
    "mood": "energetic and vibrant",
    "time_of_day": "evening",
    "style": "photograph"
  }
}
```

---

### POST /api/v1/predict/detect

```bash
curl -X POST http://localhost:3000/api/v1/predict/detect \
  -F "image=@kitchen.jpg"
```

Response:

```json
{
  "data": {
    "objects": [
      { "name": "refrigerator", "confidence": 0.98, "prominent": true },
      { "name": "coffee machine", "confidence": 0.94, "prominent": false }
    ],
    "count": 2,
    "dominant_object": "refrigerator",
    "background": "modern kitchen with white cabinetry"
  }
}
```

---

### POST /api/v1/predict/ocr

```bash
curl -X POST http://localhost:3000/api/v1/predict/ocr \
  -F "image=@sign.jpg"
```

Response:

```json
{
  "data": {
    "text_found": true,
    "extracted_text": "OPEN\nMon–Fri 9am–6pm",
    "language": "English",
    "language_code": "en",
    "text_type": "printed",
    "confidence": 0.99,
    "line_count": 2
  }
}
```

---

### POST /api/v1/predict/sentiment

```bash
curl -X POST http://localhost:3000/api/v1/predict/sentiment \
  -F "image=@birthday.jpg"
```

Response:

```json
{
  "data": {
    "overall_sentiment": "positive",
    "sentiment_score": 0.82,
    "emotions": ["joy", "excitement"],
    "energy_level": "high",
    "valence": "pleasant",
    "arousal": "excited",
    "notes": "Bright colors and smiling faces suggest celebration."
  }
}
```

---

### POST /api/v1/predict/custom

```bash
curl -X POST http://localhost:3000/api/v1/predict/custom \
  -F "image=@chart.png" \
  -F "prompt=What type of chart is this and what trend does it show?"
```

Response is freeform JSON shaped by your prompt.

---

### Using image_url (no file upload)

```bash
curl -X POST http://localhost:3000/api/v1/predict/classify \
  -H "Content-Type: application/json" \
  -d '{ "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }'
```

---

## Project Structure

```
image-prediction-api/
├── src/
│   ├── server.js                  # Express app entry point
│   ├── routes/
│   │   ├── predict.js             # Prediction route definitions
│   │   └── health.js              # Health check route
│   ├── controllers/
│   │   └── predictController.js  # Business logic for each mode
│   ├── middleware/
│   │   ├── upload.js              # Multer file upload config
│   │   ├── rateLimiter.js         # express-rate-limit config
│   │   └── errorHandler.js        # Global error handler
│   └── utils/
│       ├── claudeService.js       # Anthropic SDK wrapper
│       └── imageUtils.js          # Image source resolver
├── public/                        # Browser playground
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── uploads/                       # Temp upload storage
├── tests/
│   └── api.test.js                # Jest + Supertest test suite
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Configuration

All config lives in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size in MB |
| `ALLOWED_MIME_TYPES` | `image/jpeg,...` | Comma-separated MIME types |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

---

## Running Tests

```bash
npm test
```

Tests use Jest + Supertest. The Claude service is mocked — no API calls are made during testing.

---

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment.
2. Use a process manager like [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start src/server.js --name image-prediction-api
```

3. Put Nginx or a cloud load balancer in front for TLS termination.

---

## License

MIT
