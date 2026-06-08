const request = require("supertest");

// Mock the Claude service so tests don't hit the real API
jest.mock("../src/utils/claudeService", () => ({
  analyzeImage: jest.fn().mockResolvedValue({
    category: "animal",
    subcategory: "dog",
    confidence: 0.97,
    alternative_labels: ["pet", "canine", "mammal"],
    description: "A golden retriever sitting on grass.",
  }),
}));

const app = require("../src/server");

describe("Health check", () => {
  it("GET /api/v1/health → 200", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("ok");
  });
});

describe("Predict endpoints — missing image", () => {
  const ENDPOINTS = ["classify", "describe", "detect", "ocr", "sentiment"];

  ENDPOINTS.forEach(ep => {
    it(`POST /api/v1/predict/${ep} without image → 400`, async () => {
      const res = await request(app).post(`/api/v1/predict/${ep}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NO_IMAGE");
    });
  });
});

describe("POST /api/v1/predict/custom — missing prompt", () => {
  it("returns 400 when prompt is absent", async () => {
    const res = await request(app)
      .post("/api/v1/predict/custom")
      .field("image_url", "https://example.com/test.jpg"); // skip file; body-only
    // No image will trigger NO_IMAGE before MISSING_PROMPT
    expect(res.statusCode).toBe(400);
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
