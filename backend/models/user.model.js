const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

const sequelize = require("../config/db");

class User extends Model {
  async isValidPassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },

    dob: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    blood_group: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    },

    firm_ids: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    is_password_reset_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    is_inactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    modelName: "User",
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(
            user.password,
            10
          );
        }
      },

      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(
            user.password,
            10
          );
        }
      },
    },
  }
);

module.exports = User;