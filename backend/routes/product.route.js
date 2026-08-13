const express = require("express");

const router = express.Router();

const productController = require("../controllers/product.controller");
const upload = require("../helpers/multer.helper");

router.post("/", upload.fields([
    {
      name: "image1",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
  ]), productController.createProduct);

router.get("/", productController.getAllProducts);

router.get("/firm/:firmId", productController.getProductsByFirm);

router.get("/:id", productController.getProductById);

router.put("/:id",upload.fields([
    {
      name: "image1",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
  ]), productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
