const sequelize = require("../config/db");

const User = require("./user.model");
const Firm = require("./firm.model");
const Product = require("./product.model");
const Feed = require("./feed.model");
const FeedMedia = require("./feedMedia.model");

User.hasMany(Feed, {
  foreignKey: "uploaded_by",
  as: "feeds",
});

Feed.belongsTo(User, {
  foreignKey: "uploaded_by",
  as: "uploader",
});


// ============================================================
// FEED <-> FEED MEDIA
// ============================================================

Feed.hasMany(FeedMedia, {
  foreignKey: "feed_id",
  as: "media",
  onDelete: "CASCADE",
});

FeedMedia.belongsTo(Feed, {
  foreignKey: "feed_id",
  as: "feed",
});

module.exports = {
  sequelize,
  User,
  Firm,
  Product,
   Feed,
  FeedMedia,
};