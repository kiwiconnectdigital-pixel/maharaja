const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir =
  path.join(__dirname, "../uploads/products");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true,
    }
  );
}

const storage =
  multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const ext =
        path.extname(file.originalname);

      const name =
        `${Date.now()}-${Math.round(
          Math.random() * 1E9
        )}${ext}`;

      cb(null, name);
    },

  });

const fileFilter =
  (req, file, cb) => {

    const allowed =
      /jpeg|jpg|png|webp/;

    const ext =
      allowed.test(
        path.extname(
          file.originalname
        ).toLowerCase()
      );

    const mime =
      allowed.test(
        file.mimetype
      );

    if (ext && mime) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }
  };

const upload =
  multer({
    storage,
    fileFilter,

    limits: {
      files: 2,
      fileSize: 5 * 1024 * 1024,
    },
  });

module.exports = upload;