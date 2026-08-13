const createError = require("http-errors");
const { Category } = require("../models");

module.exports = {
  create: async (req, res, next) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        throw createError.BadRequest("Category name is required");
      }

      const existingCategory = await Category.findOne({
        where: {
          name,
        },
      });

      if (existingCategory) {
        throw createError.Conflict(
          "Category already exists"
        );
      }

      const category = await Category.create({
        name,
        description,
        created_by: req.user?.id || null,
      });

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const categories = await Category.findAll({
        where: {
          is_active: true,
        },
        order: [["name", "ASC"]],
      });

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        throw createError.NotFound(
          "Category not found"
        );
      }

      return res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;

      const category = await Category.findByPk(id);

      if (!category) {
        throw createError.NotFound(
          "Category not found"
        );
      }

      await category.update({
        name: name ?? category.name,
        description:
          description ?? category.description,
        is_active:
          is_active ?? category.is_active,
      });

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        throw createError.NotFound(
          "Category not found"
        );
      }

      await category.update({
        is_active: false,
      });

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};