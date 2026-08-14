const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/register", userController.register);

router.post("/login", userController.login);

router.post("/refresh-token", userController.refreshToken);

router.get("/profile", userController.profile);

router.post("/change-password", userController.changePassword);

router.post("/bulk-upload", upload.single("file"), userController.bulkUpload);

router.get("/search", userController.search);

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUser);

router.get("/firms", userController.getAllFirms);

router.get("/firm/:id", userController.getFirm);

router.post("/:userId/firms", userController.addFirmToUser);

router.delete("/:userId/firms/:firmId", userController.removeFirmFromUser);

module.exports = router;
