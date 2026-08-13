const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

// ============================================================
// AUTH
// ============================================================

router.post("/register", userController.register);

router.post("/login", userController.login);

router.post("/refresh-token", userController.refreshToken);

// ============================================================
// PROFILE
// ============================================================

router.get("/profile", userController.profile);

router.post("/change-password", userController.changePassword);

// ============================================================
// BULK UPLOAD
// ============================================================

router.post("/bulk-upload", upload.single("file"), userController.bulkUpload);

// ============================================================
// SEARCH
// ============================================================

router.get("/search", userController.search);

// ============================================================
// USERS
// ============================================================

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUser);

// ============================================================
// FIRMS
// ============================================================

router.get("/firms", userController.getAllFirms);

router.get("/firm/:id", userController.getFirm);

router.post("/:userId/firms", userController.addFirmToUser);

router.delete("/:userId/firms/:firmId", userController.removeFirmFromUser);

module.exports = router;
