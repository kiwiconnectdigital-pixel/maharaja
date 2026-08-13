const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Feed extends Model {}

Feed.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "published",
        "draft"
      ),
      defaultValue: "published",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Feed",
    tableName: "feeds",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Feed;