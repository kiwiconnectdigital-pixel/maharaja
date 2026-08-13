const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");

// const authMiddleware = require("../middleware/auth.middleware");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});


// ============================================================
// AUTH
// ============================================================

router.post(
  "/register",
  userController.register
);

router.post(
  "/login",
  userController.login
);

router.post(
  "/refresh-token",
  userController.refreshToken
);

router.get(
  "/profile",
  userController.profile
);

router.post(
  "/change-password",
  userController.changePassword
);


// ============================================================
// BULK UPLOAD
// ============================================================

router.post(
  "/bulk-upload",
  upload.single("file"),
  userController.bulkUpload
);


module.exports = router;