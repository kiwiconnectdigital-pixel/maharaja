const multer = require("multer");
const path = require("path");
const fs = require("fs");

function makeStorage(subfolder) {
  const dir = path.join(__dirname, "..", "uploads", subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

// Images (firm logos, feed media)
const imageUpload = multer({
  storage: makeStorage("images"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Only image files are allowed (jpg, jpeg, png, webp)"), ok);
  },
});

// Excel files (bulk upload)
const excelUpload = multer({
  storage: makeStorage("excel"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /xlsx|xls/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Only Excel files are allowed (.xlsx, .xls)"), ok);
  },
});

module.exports = { imageUpload, excelUpload };
