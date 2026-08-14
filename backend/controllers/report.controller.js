const { User, Firm, Feed } = require("../models");

module.exports = {
  getDashboardReport: async (req, res, next) => {
    try {
      const [totalUsers, totalFirms, totalFeeds] =
        await Promise.all([
          User.count({
            where: {
              is_inactive: false,
            },
          }),

          Firm.count(),

          Feed.count(),
        ]);

      return res.status(200).json({
        success: true,
        message: "Report fetched successfully",
        data: {
          total_users: totalUsers,
          total_firms: totalFirms,
          total_feeds: totalFeeds,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};