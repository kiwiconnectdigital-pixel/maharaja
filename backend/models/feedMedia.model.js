const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class FeedMedia extends Model {}

FeedMedia.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    feed_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    media_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    media_type: {
      type: DataTypes.ENUM(
        "image",
        "video"
      ),
      defaultValue: "image",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "FeedMedia",
    tableName: "feed_media",

    timestamps: false,
  }
);

module.exports = FeedMedia;