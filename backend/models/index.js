const sequelize = require("../config/db");

const User = require("./user.model");
const Firm = require("./firm.model");

module.exports = {
  sequelize,
  User,
  Firm,
};