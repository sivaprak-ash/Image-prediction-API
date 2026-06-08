const fs = require("fs").promises;
const path = require("path");

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/webp,image/gif"
)
  .split(",")
  .map((t) => t.trim());

/**
 * Resolves the image source from either a multer file upload or a JSON body image_url.
 *
 * @param {import('express').Request} req
 * @returns {{ type: 'base64', media_type: string, data: string }
 *          |{ type: 'url', url: string }}
 */
async function prepareImageSource(req) {
  // Option A: multipart file upload
  if (req.file) {
    const buffer = await fs.readFile(req.file.path);
    const base64 = buffer.toString("base64");
    const mediaType = req.file.mimetype;

    // Clean up the temp file
    fs.unlink(req.file.path).catch(() => {});

    return { type: "base64", media_type: mediaType, data: base64 };
  }

  // Option B: JSON body with image_url
  if (req.body && req.body.image_url) {
    const url = req.body.image_url;
    if (typeof url !== "string" || !url.startsWith("http")) {
      throw Object.assign(new Error("image_url must be a valid http/https URL."), { status: 400, code: "INVALID_IMAGE_URL" });
    }
    return { type: "url", url };
  }

  // Option C: JSON body with base64 data
  if (req.body && req.body.image_base64) {
    const { image_base64, media_type } = req.body;
    if (!media_type || !ALLOWED_MIME_TYPES.includes(media_type)) {
      throw Object.assign(
        new Error(`media_type must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`),
        { status: 400, code: "INVALID_MEDIA_TYPE" }
      );
    }
    return { type: "base64", media_type, data: image_base64 };
  }

  const err = new Error(
    "No image provided. Send a file upload (field: 'image'), a JSON body with 'image_url', or 'image_base64' + 'media_type'."
  );
  err.status = 400;
  err.code = "NO_IMAGE";
  throw err;
}

module.exports = { prepareImageSource, ALLOWED_MIME_TYPES };
