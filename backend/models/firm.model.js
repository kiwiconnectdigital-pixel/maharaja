const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Firm extends Model {}

Firm.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    firmName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    firmAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    user_ids: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "Firm",
    tableName: "firms",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Firm;