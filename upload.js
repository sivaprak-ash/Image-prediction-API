const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/webp,image/gif"
)
  .split(",")
  .map((t) => t.trim());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
    err.status = 415;
    err.code = "UNSUPPORTED_MEDIA_TYPE";
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

module.exports = { upload };
