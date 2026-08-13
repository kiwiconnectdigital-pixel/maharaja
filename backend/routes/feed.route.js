const express = require("express");
const router = express.Router();

const multer = require("multer");

const feedController = require("../controllers/feed.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/feeds/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

// ============================================================
// ADMIN
// ============================================================

router.post("/", upload.array("media", 10), feedController.createFeed);

router.get("/admin/all", feedController.getAdminFeeds);

router.put("/:id", upload.array("media", 10), feedController.updateFeed);

router.delete("/:id", feedController.deleteFeed);

router.delete("/:feedId/media/:mediaId", feedController.deleteFeedMedia);

router.patch("/:id/publish", feedController.publishFeed);

router.patch("/:id/draft", feedController.draftFeed);

// ============================================================
// PUBLIC
// ============================================================

router.get("/", feedController.getAllFeeds);

router.get("/:id", feedController.getFeedById);

module.exports = router;
