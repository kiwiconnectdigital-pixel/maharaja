require("dotenv").config();

const { sequelize, User } = require("../models/index");
const {
  generateDefaultPassword,
} = require("../helpers/password.helper");

(async () => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Test MySQL Connection
    |--------------------------------------------------------------------------
    */
    await sequelize.authenticate();

    console.log("✅ MySQL connected");

    /*
    |--------------------------------------------------------------------------
    | Sync Database
    |--------------------------------------------------------------------------
    |
    | alter: true
    | Keeps existing data and adjusts tables according to models.
    |
    | force: true
    | DON'T use in production. It will DROP all tables.
    |
    |--------------------------------------------------------------------------
    */
    await sequelize.sync({
      alter: true,
    });

    console.log("✅ All tables synced");

    /*
    |--------------------------------------------------------------------------
    | Check Existing Admin
    |--------------------------------------------------------------------------
    */
    const adminCount = await User.count({
      where: {
        role: "admin",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Create First Admin
    |--------------------------------------------------------------------------
    */
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

      /*
      |--------------------------------------------------------------------------
      | Generate Password
      |--------------------------------------------------------------------------
      |
      | Super Admin -> Super@123
      |
      |--------------------------------------------------------------------------
      */
      const password =
        generateDefaultPassword(name);

      /*
      |--------------------------------------------------------------------------
      | Create Admin
      |--------------------------------------------------------------------------
      */
      const admin = await User.create({
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

      console.log(`ID       : ${admin.id}`);
      console.log(`Name     : ${admin.name}`);
      console.log(`Email    : ${admin.email}`);
      console.log(`Mobile   : ${admin.mobile}`);
      console.log(`Password : ${password}`);

      console.log(
        "=========================================="
      );
      console.log("");
    } else {
      console.log(
        "ℹ️ Admin account already exists, skipping seed."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Finish
    |--------------------------------------------------------------------------
    */
    process.exit(0);
  } catch (err) {
    console.error(
      "❌ Sync failed:",
      err
    );

    process.exit(1);
  }
})();