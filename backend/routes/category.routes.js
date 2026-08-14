const express = require("express");

const router = express.Router();

const categoryController = require("../controllers/category.controller");

// const auth = require("../middleware/auth");

router.post("/", categoryController.create);

router.get("/", categoryController.getAll);

router.get("/:id", categoryController.getById);

router.put("/:id", categoryController.update);

router.delete("/:id", categoryController.delete);

module.exports = router;
