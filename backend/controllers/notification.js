const cron = require("node-cron");
const { Op, Sequelize } = require("sequelize");

const User = require("../models/user.model");
const Notification = require("../models/notification.model");

const birthdayNotificationJob = () => {
  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🎂 Running birthday notification job...");

      const today = new Date();

      const month = today.getMonth() + 1;
      const day = today.getDate();

      const users = await User.findAll({
        where: {
          is_inactive: false,
          dob: {
            [Op.ne]: null,
          },
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn(
                "MONTH",
                Sequelize.col("dob")
              ),
              month
            ),
            Sequelize.where(
              Sequelize.fn(
                "DAY",
                Sequelize.col("dob")
              ),
              day
            ),
          ],
        },
      });

      console.log(`🎂 Birthday users found: ${users.length}`);

      for (const user of users) {
        // Prevent duplicate notification
        // if the job runs more than once on the same day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const alreadySent = await Notification.findOne({
          where: {
            user_id: user.id,
            type: "birthday",
            created_at: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
        });

        if (alreadySent) {
          continue;
        }

        await Notification.create({
          user_id: user.id,
          title: "🎂 Happy Birthday!",
          message: `Happy Birthday ${user.name}! 🎉 Wishing you a wonderful day filled with happiness, success and beautiful moments. Have a fantastic year ahead!`,
          type: "birthday",
          is_read: false,
        });

        console.log(
          `🎉 Birthday notification sent to ${user.name}`
        );
      }
    } catch (error) {
      console.error(
        "❌ Birthday notification job error:",
        error
      );
    }
  });

  console.log("✅ Birthday notification job started");
};

module.exports = birthdayNotificationJob;