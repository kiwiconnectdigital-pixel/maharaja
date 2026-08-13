const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Category;