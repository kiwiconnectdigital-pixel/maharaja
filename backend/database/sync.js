require("dotenv").config();

const {
  sequelize,
  User,
} = require("../models/index");

const {
  generateDefaultPassword,
} = require("../helpers/password.helper");

(async () => {
  try {
    // ============================================================
    // TEST DATABASE CONNECTION
    // ============================================================

    await sequelize.authenticate();

    console.log("✅ MySQL connected");


    // ============================================================
    // SYNC DATABASE
    // ============================================================

    await sequelize.sync({
      alter: true,
    });

    console.log("✅ All tables synced");


    // ============================================================
    // CHECK EXISTING ADMIN
    // ============================================================

    const adminCount =
      await User.count({
        where: {
          role: "admin",
        },
      });


    // ============================================================
    // CREATE FIRST ADMIN
    // ============================================================

    if (adminCount === 0) {

      const name =
        process.env.SEED_ADMIN_NAME ||
        "Super Admin";

      const email =
        process.env.SEED_ADMIN_EMAIL ||
        null;

      const mobile =
        process.env.SEED_ADMIN_MOBILE ||
        null;


      // ==========================================================
      // GENERATE DEFAULT PASSWORD
      // ==========================================================
      //
      // Super Admin
      //      ↓
      // Super@123
      //
      // ==========================================================

      const password =
        generateDefaultPassword(name);


      // ==========================================================
      // CREATE ADMIN
      // ==========================================================

      const admin =
        await User.create({

          name,

          email: email
            ? email.toLowerCase()
            : null,

          mobile,

          password,

          role: "admin",

          firm_ids: [],

          is_password_reset_required: true,

          is_inactive: false,

        });


      console.log("");
      console.log(
        "=========================================="
      );

      console.log(
        "✅ First admin account created"
      );

      console.log(
        "=========================================="
      );

      console.log(
        `ID       : ${admin.id}`
      );

      console.log(
        `Name     : ${admin.name}`
      );

      console.log(
        `Email    : ${admin.email || "N/A"}`
      );

      console.log(
        `Mobile   : ${admin.mobile || "N/A"}`
      );

      console.log(
        `Password : ${password}`
      );

      console.log(
        "=========================================="
      );

      console.log("");

    } else {

      console.log(
        "ℹ️ Admin account already exists, skipping seed."
      );

    }


    // ============================================================
    // FINISH
    // ============================================================

    await sequelize.close();

    process.exit(0);

  } catch (err) {

    console.error("");
    console.error(
      "❌ Sync failed:"
    );

    console.error(
      err.message
    );

    if (err.parent) {
      console.error(
        "Database error:",
        err.parent.message
      );
    }

    console.error("");

    process.exit(1);
  }
})();