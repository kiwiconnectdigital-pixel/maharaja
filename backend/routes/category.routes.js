const express = require("express");

const router = express.Router();

const categoryController = require("../controllers/category.controller");

const auth = require("../middleware/auth");

router.post(
  "/",
  auth,
  categoryController.create
);

router.get(
  "/",
  auth,
  categoryController.getAll
);

router.get(
  "/:id",
  auth,
  categoryController.getById
);

router.put(
  "/:id",
  auth,
  categoryController.update
);

router.delete(
  "/:id",
  auth,
  categoryController.delete
);

module.exports = router;