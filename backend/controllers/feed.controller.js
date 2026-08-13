const createError = require("http-errors");

const { User, Feed, FeedMedia } = require("../models");

const { verifyAccessToken } = require("../helpers/jwt.helper");

// ============================================================
// GET LOGGED-IN USER
// ============================================================
// Used only for ADMIN APIs.
// Public GET APIs do not call this function.
// ============================================================

const getLoggedInUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError.Unauthorized("Authorization token required");
    }

    let token = authHeader;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw createError.Unauthorized("Authorization token required");
    }

    const userId = await verifyAccessToken(token);

    if (!userId) {
      throw createError.Unauthorized("Invalid access token");
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw createError.NotFound("User not found");
    }

    return user;
  } catch (err) {
    throw err;
  }
};

// ============================================================
// CHECK ADMIN
// ============================================================

const checkAdmin = async (req) => {
  const user = await getLoggedInUser(req);

  if (user.role !== "admin") {
    throw createError.Forbidden("Only admin can perform this action");
  }

  return user;
};

// ============================================================
// CREATE FEED
// ============================================================
// ADMIN ONLY
//
// POST /api/feeds
//
// Content-Type:
// multipart/form-data
//
// Fields:
//
// title
// content
// status
// media
// ============================================================

const createFeed = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Check Admin
    // ----------------------------------------------------------

    const admin = await checkAdmin(req);

    // ----------------------------------------------------------
    // Request Data
    // ----------------------------------------------------------

    const { title, content, status } = req.body;

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------

    if (!title || !title.trim()) {
      throw createError.BadRequest("Title is required");
    }

    // ----------------------------------------------------------
    // Validate Status
    // ----------------------------------------------------------

    let feedStatus = status || "published";

    if (!["published", "draft"].includes(feedStatus)) {
      throw createError.BadRequest("Status must be published or draft");
    }

    // ----------------------------------------------------------
    // Create Feed
    // ----------------------------------------------------------

    const feed = await Feed.create({
      title: title.trim(),

      content: content || null,

      uploaded_by: admin.id,

      status: feedStatus,
    });

    // ----------------------------------------------------------
    // Media Upload
    // ----------------------------------------------------------

    const files = req.files || [];

    if (files.length > 0) {
      const mediaData = files.map((file) => {
        let mediaType = "image";

        if (file.mimetype && file.mimetype.startsWith("video/")) {
          mediaType = "video";
        }

        return {
          feed_id: feed.id,

          media_url: `/uploads/feeds/${file.filename}`,

          media_type: mediaType,
        };
      });

      await FeedMedia.bulkCreate(mediaData);
    }

    // ----------------------------------------------------------
    // Get Created Feed
    // ----------------------------------------------------------

    const createdFeed = await Feed.findByPk(feed.id, {
      include: [
        {
          model: FeedMedia,
          as: "media",
        },

        {
          model: User,
          as: "uploader",
          attributes: ["id", "name"],
        },
      ],
    });

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,

      msg: "Feed uploaded successfully",

      feed: createdFeed,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET ALL PUBLISHED FEEDS
// ============================================================
// PUBLIC
//
// No login required.
//
// GET /api/feeds
//
// Query:
//
// ?page=1
// ?limit=10
// ============================================================

const getAllFeeds = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const offset = (page - 1) * limit;

    // ----------------------------------------------------------
    // Get Published Feeds
    // ----------------------------------------------------------

    const result = await Feed.findAndCountAll({
      where: {
        status: "published",
      },

      include: [
        {
          model: FeedMedia,

          as: "media",

          attributes: ["id", "media_url", "media_type"],
        },

        {
          model: User,

          as: "uploader",

          attributes: ["id", "name"],
        },
      ],

      order: [["created_at", "DESC"]],

      limit,

      offset,

      distinct: true,
    });

    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    const totalPages = Math.ceil(result.count / limit);

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      count: result.count,

      pagination: {
        currentPage: page,

        limit: limit,

        totalPages: totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },

      feeds: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET SINGLE FEED
// ============================================================
// PUBLIC
//
// No login required.
//
// GET /api/feeds/:id
// ============================================================

const getFeedById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // Find Published Feed
    // ----------------------------------------------------------

    const feed = await Feed.findOne({
      where: {
        id: id,

        status: "published",
      },

      include: [
        {
          model: FeedMedia,

          as: "media",

          attributes: ["id", "media_url", "media_type"],
        },

        {
          model: User,

          as: "uploader",

          attributes: ["id", "name"],
        },
      ],
    });

    // ----------------------------------------------------------
    // Not Found
    // ----------------------------------------------------------

    if (!feed) {
      throw createError.NotFound("Feed not found");
    }

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      feed: feed,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET ALL FEEDS FOR ADMIN
// ============================================================
// ADMIN ONLY
//
// Includes:
// published
// draft
//
// GET /api/feeds/admin/all
// ============================================================

const getAdminFeeds = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Check Admin
    // ----------------------------------------------------------

    await checkAdmin(req);

    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const offset = (page - 1) * limit;

    // ----------------------------------------------------------
    // Get Feeds
    // ----------------------------------------------------------

    const result = await Feed.findAndCountAll({
      include: [
        {
          model: FeedMedia,

          as: "media",

          attributes: ["id", "media_url", "media_type"],
        },

        {
          model: User,

          as: "uploader",

          attributes: ["id", "name"],
        },
      ],

      order: [["created_at", "DESC"]],

      limit,

      offset,

      distinct: true,
    });

    const totalPages = Math.ceil(result.count / limit);

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      count: result.count,

      pagination: {
        currentPage: page,

        limit: limit,

        totalPages: totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },

      feeds: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// UPDATE FEED
// ============================================================
// ADMIN ONLY
//
// PUT /api/feeds/:id
//
// Body:
//
// title
// content
// status
// ============================================================

const updateFeed = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Check Admin
    // ----------------------------------------------------------

    await checkAdmin(req);

    const { id } = req.params;

    // ----------------------------------------------------------
    // Find Feed
    // ----------------------------------------------------------

    const feed = await Feed.findByPk(id);

    if (!feed) {
      throw createError.NotFound("Feed not found");
    }

    // ----------------------------------------------------------
    // Request Data
    // ----------------------------------------------------------

    const { title, content, status } = req.body;

    // ----------------------------------------------------------
    // Update Title
    // ----------------------------------------------------------

    if (title !== undefined) {
      if (!title || !title.trim()) {
        throw createError.BadRequest("Title cannot be empty");
      }

      feed.title = title.trim();
    }

    // ----------------------------------------------------------
    // Update Content
    // ----------------------------------------------------------

    if (content !== undefined) {
      feed.content = content;
    }

    // ----------------------------------------------------------
    // Update Status
    // ----------------------------------------------------------

    if (status !== undefined) {
      if (!["published", "draft"].includes(status)) {
        throw createError.BadRequest("Status must be published or draft");
      }

      feed.status = status;
    }

    // ----------------------------------------------------------
    // Save
    // ----------------------------------------------------------

    await feed.save();

    // ----------------------------------------------------------
    // Add New Media
    // ----------------------------------------------------------

    const files = req.files || [];

    if (files.length > 0) {
      const mediaData = files.map((file) => {
        const mediaType =
          file.mimetype && file.mimetype.startsWith("video/")
            ? "video"
            : "image";

        return {
          feed_id: feed.id,

          media_url: `/uploads/feeds/${file.filename}`,

          media_type: mediaType,
        };
      });

      await FeedMedia.bulkCreate(mediaData);
    }

    // ----------------------------------------------------------
    // Get Updated Feed
    // ----------------------------------------------------------

    const updatedFeed = await Feed.findByPk(feed.id, {
      include: [
        {
          model: FeedMedia,

          as: "media",
        },

        {
          model: User,

          as: "uploader",

          attributes: ["id", "name"],
        },
      ],
    });

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      msg: "Feed updated successfully",

      feed: updatedFeed,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE FEED
// ============================================================
// ADMIN ONLY
//
// DELETE /api/feeds/:id
// ============================================================

const deleteFeed = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Check Admin
    // ----------------------------------------------------------

    await checkAdmin(req);

    const { id } = req.params;

    // ----------------------------------------------------------
    // Find Feed
    // ----------------------------------------------------------

    const feed = await Feed.findByPk(id);

    if (!feed) {
      throw createError.NotFound("Feed not found");
    }

    // ----------------------------------------------------------
    // Delete Media
    // ----------------------------------------------------------

    await FeedMedia.destroy({
      where: {
        feed_id: feed.id,
      },
    });

    // ----------------------------------------------------------
    // Delete Feed
    // ----------------------------------------------------------

    await feed.destroy();

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      msg: "Feed deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE SINGLE MEDIA
// ============================================================
// ADMIN ONLY
//
// DELETE /api/feeds/:feedId/media/:mediaId
// ============================================================

const deleteFeedMedia = async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Check Admin
    // ----------------------------------------------------------

    await checkAdmin(req);

    const { feedId, mediaId } = req.params;

    // ----------------------------------------------------------
    // Find Media
    // ----------------------------------------------------------

    const media = await FeedMedia.findOne({
      where: {
        id: mediaId,

        feed_id: feedId,
      },
    });

    if (!media) {
      throw createError.NotFound("Feed media not found");
    }

    // ----------------------------------------------------------
    // Delete Media
    // ----------------------------------------------------------

    await media.destroy();

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.json({
      success: true,

      msg: "Feed media deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUBLISH FEED
// ============================================================
// ADMIN ONLY
//
// PATCH /api/feeds/:id/publish
// ============================================================

const publishFeed = async (req, res, next) => {
  try {
    await checkAdmin(req);

    const { id } = req.params;

    const feed = await Feed.findByPk(id);

    if (!feed) {
      throw createError.NotFound("Feed not found");
    }

    feed.status = "published";

    await feed.save();

    return res.json({
      success: true,

      msg: "Feed published successfully",

      feed,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// UNPUBLISH / MAKE DRAFT
// ============================================================
// ADMIN ONLY
//
// PATCH /api/feeds/:id/draft
// ============================================================

const draftFeed = async (req, res, next) => {
  try {
    await checkAdmin(req);

    const { id } = req.params;

    const feed = await Feed.findByPk(id);

    if (!feed) {
      throw createError.NotFound("Feed not found");
    }

    feed.status = "draft";

    await feed.save();

    return res.json({
      success: true,

      msg: "Feed moved to draft successfully",

      feed,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createFeed,

  getAllFeeds,

  getFeedById,

  getAdminFeeds,

  updateFeed,

  deleteFeed,

  deleteFeedMedia,

  publishFeed,

  draftFeed,
};
