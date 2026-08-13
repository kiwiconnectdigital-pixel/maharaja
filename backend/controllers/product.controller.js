const createError = require("http-errors");

const {
  User,
  Firm,
  Product,
} = require("../models/index");

const {
  Op,
} = require("sequelize");


// ============================================================
// HELPERS
// ============================================================

const normalizeIds = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(Number)
      .filter((id) => !Number.isNaN(id));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map(Number)
          .filter((id) => !Number.isNaN(id));
      }
    } catch (err) {
      return [];
    }
  }

  return [];
};


// ============================================================
// CONTROLLER
// ============================================================

module.exports = {

  // ==========================================================
  // CREATE PRODUCT
  // ==========================================================

  createProduct: async (req, res, next) => {
    try {
      const {
        firm_id,
        category,
        title,
        description,
        price,
        created_by,
      } = req.body;

      if (!firm_id) {
        throw createError.BadRequest(
          "Firm ID is required"
        );
      }

      if (!category) {
        throw createError.BadRequest(
          "Category is required"
        );
      }

      if (!title) {
        throw createError.BadRequest(
          "Product title is required"
        );
      }

      if (price === undefined || price === null || price === "") {
        throw createError.BadRequest(
          "Price is required"
        );
      }

      // --------------------------------------------------------
      // Check firm
      // --------------------------------------------------------

      const firm = await Firm.findByPk(firm_id);

      if (!firm) {
        throw createError.NotFound(
          "Firm not found"
        );
      }

      // --------------------------------------------------------
      // Check user if created_by is provided
      // --------------------------------------------------------

      let user = null;

      if (created_by) {
        user = await User.findByPk(created_by);

        if (!user) {
          throw createError.NotFound(
            "User not found"
          );
        }

        // ------------------------------------------------------
        // Check whether user belongs to this firm
        // ------------------------------------------------------

        const firmIds = normalizeIds(
          user.firm_ids
        );

        if (!firmIds.includes(Number(firm_id))) {
          throw createError.Forbidden(
            "User is not connected with this firm"
          );
        }
      }

      // --------------------------------------------------------
      // Images
      // --------------------------------------------------------

      let image1 = null;
      let image2 = null;

      if (req.files) {
        if (req.files.image1) {
          image1 =
            req.files.image1[0].filename;
        }

        if (req.files.image2) {
          image2 =
            req.files.image2[0].filename;
        }
      }

      // --------------------------------------------------------
      // Create product
      // --------------------------------------------------------

      const product =
        await Product.create({
          firm_id,
          category,
          title,
          description: description || null,
          price,
          image1,
          image2,
          created_by: created_by || null,
        });

      res.status(201).json({
        success: true,
        msg: "Product created successfully",
        product,
      });

    } catch (err) {
      next(err);
    }
  },


  // ==========================================================
  // GET ALL PRODUCTS
  // ==========================================================

  getAllProducts: async (req, res, next) => {
    try {
      const products =
        await Product.findAll({
          order: [
            ["id", "DESC"],
          ],
        });

      res.json({
        success: true,
        count: products.length,
        products,
      });

    } catch (err) {
      next(err);
    }
  },


  // ==========================================================
  // GET PRODUCTS BY FIRM
  // ==========================================================

  getProductsByFirm: async (req, res, next) => {
    try {
      const { firmId } = req.params;

      const firm =
        await Firm.findByPk(firmId);

      if (!firm) {
        throw createError.NotFound(
          "Firm not found"
        );
      }

      const products =
        await Product.findAll({
          where: {
            firm_id: firmId,
          },

          order: [
            ["id", "DESC"],
          ],
        });

      res.json({
        success: true,

        firm: {
          id: firm.id,
          firmName: firm.firmName,
          firmAddress: firm.firmAddress,
        },

        count: products.length,
        products,
      });

    } catch (err) {
      next(err);
    }
  },


  // ==========================================================
  // GET PRODUCT BY ID
  // ==========================================================

  getProductById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const product =
        await Product.findByPk(id);

      if (!product) {
        throw createError.NotFound(
          "Product not found"
        );
      }

      const firm =
        await Firm.findByPk(
          product.firm_id,
          {
            attributes: [
              "id",
              "firmName",
              "firmAddress",
            ],
          }
        );

      res.json({
        success: true,

        product: {
          ...product.toJSON(),

          firm,
        },
      });

    } catch (err) {
      next(err);
    }
  },


  // ==========================================================
  // UPDATE PRODUCT
  // ==========================================================

  updateProduct: async (req, res, next) => {
    try {
      const { id } = req.params;

      const product =
        await Product.findByPk(id);

      if (!product) {
        throw createError.NotFound(
          "Product not found"
        );
      }

      const {
        firm_id,
        category,
        title,
        description,
        price,
        status,
        created_by,
      } = req.body;

      // --------------------------------------------------------
      // If firm is changed, verify it exists
      // --------------------------------------------------------

      if (
        firm_id !== undefined &&
        Number(firm_id) !==
          Number(product.firm_id)
      ) {
        const firm =
          await Firm.findByPk(firm_id);

        if (!firm) {
          throw createError.NotFound(
            "New firm not found"
          );
        }

        product.firm_id = firm_id;
      }

      // --------------------------------------------------------
      // Update fields
      // --------------------------------------------------------

      if (category !== undefined) {
        product.category = category;
      }

      if (title !== undefined) {
        product.title = title;
      }

      if (description !== undefined) {
        product.description = description;
      }

      if (price !== undefined) {
        product.price = price;
      }

      if (status !== undefined) {
        product.status = status;
      }

      if (created_by !== undefined) {
        product.created_by = created_by;
      }

      // --------------------------------------------------------
      // Update images
      // --------------------------------------------------------

      if (
        req.files &&
        req.files.image1 &&
        req.files.image1[0]
      ) {
        product.image1 =
          req.files.image1[0].filename;
      }

      if (
        req.files &&
        req.files.image2 &&
        req.files.image2[0]
      ) {
        product.image2 =
          req.files.image2[0].filename;
      }

      await product.save();

      res.json({
        success: true,
        msg: "Product updated successfully",
        product,
      });

    } catch (err) {
      next(err);
    }
  },


  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;

      const product =
        await Product.findByPk(id);

      if (!product) {
        throw createError.NotFound(
          "Product not found"
        );
      }

      await product.destroy();

      res.json({
        success: true,
        msg: "Product deleted successfully",
      });

    } catch (err) {
      next(err);
    }
  },

};