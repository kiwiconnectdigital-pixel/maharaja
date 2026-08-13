const createError = require("http-errors");
const { Op } = require("sequelize");
const XLSX = require("xlsx");

const { User, Firm } = require("../models/index");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt.helper");

/*
|--------------------------------------------------------------------------
| Generate Default Password
|--------------------------------------------------------------------------
| Mrs. Manjubala Kashyap -> Manjubala@123
| Mr Narendra Kashyap     -> Narendra@123
| Mr Tarun Kashyap        -> Tarun@123
| Mr Satyanarayan Sarda  -> Satyanarayan@123
|--------------------------------------------------------------------------
*/
const generatePassword = (name) => {
  if (!name) return null;

  const cleanName = String(name)
    .replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, "")
    .trim();

  const firstName = cleanName.split(/\s+/)[0];

  return `${firstName}@123`;
};

/*
|--------------------------------------------------------------------------
| Clean N/A / Empty Values
|--------------------------------------------------------------------------
*/
const cleanValue = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === "" ||
    String(value).trim().toLowerCase() === "n/a"
  ) {
    return null;
  }

  return String(value).trim();
};

/*
|--------------------------------------------------------------------------
| Normalize JSON ID Array
|--------------------------------------------------------------------------
*/
const normalizeIds = (ids) => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map((id) => Number(id))
    .filter((id) => !isNaN(id));
};

/*
|--------------------------------------------------------------------------
| Add ID To Array
|--------------------------------------------------------------------------
*/
const addUniqueId = (ids, id) => {
  const normalizedIds = normalizeIds(ids);
  const numericId = Number(id);

  if (!normalizedIds.includes(numericId)) {
    normalizedIds.push(numericId);
  }

  return normalizedIds;
};

/*
|--------------------------------------------------------------------------
| Remove ID From Array
|--------------------------------------------------------------------------
*/
const removeId = (ids, id) => {
  const normalizedIds = normalizeIds(ids);
  const numericId = Number(id);

  return normalizedIds.filter(
    (existingId) => existingId !== numericId
  );
};

/*
|--------------------------------------------------------------------------
| Find Existing Firm Or Create New Firm
|--------------------------------------------------------------------------
*/
const getOrCreateFirm = async (
  firmName,
  firmAddress = null
) => {
  if (!firmName) {
    throw createError.BadRequest(
      "Firm name is required"
    );
  }

  const cleanFirmName = String(firmName).trim();

  let firm = await Firm.findOne({
    where: {
      firmName: cleanFirmName,
    },
  });

  if (!firm) {
    firm = await Firm.create({
      firmName: cleanFirmName,
      firmAddress: cleanValue(firmAddress),
      user_ids: [],
    });
  } else {
    /*
    |--------------------------------------------------------------------------
    | Update address if existing firm doesn't have address
    |--------------------------------------------------------------------------
    */
    if (
      !firm.firmAddress &&
      cleanValue(firmAddress)
    ) {
      firm.firmAddress =
        cleanValue(firmAddress);

      await firm.save();
    }
  }

  return firm;
};

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | REGISTER USER
  |--------------------------------------------------------------------------
  |
  | Request:
  |
  | {
  |   "name": "Mr Narendra Kashyap",
  |   "email": "N/A",
  |   "dob": "21/09/1960",
  |   "image": "",
  |   "bloodGroup": "B-",
  |   "mobile": "9424860299",
  |   "firms": [
  |      {
  |        "firmName": "Tarun Fabrics",
  |        "firmAddress": "133-134 M.T. Cloth Market"
  |      }
  |   ]
  | }
  |
  |--------------------------------------------------------------------------
  */
  register: async (req, res, next) => {
    try {
      const {
        name,
        email,
        dob,
        image,
        bloodGroup,
        mobile,
        firms,
        role,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */
      if (!name) {
        throw createError.BadRequest(
          "Name is required"
        );
      }

      if (!mobile) {
        throw createError.BadRequest(
          "Mobile number is required"
        );
      }

      if (
        !firms ||
        !Array.isArray(firms) ||
        firms.length === 0
      ) {
        throw createError.BadRequest(
          "At least one firm is required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Check duplicate user
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | Since your data has duplicate mobile numbers,
      | we should NOT make mobile unique.
      |
      | Here we use name + mobile to identify an existing user.
      |
      |--------------------------------------------------------------------------
      */
      const existingUser =
        await User.findOne({
          where: {
            name: String(name).trim(),
            mobile: String(mobile).trim(),
          },
        });

      if (existingUser) {
        throw createError.Conflict(
          "User already exists with this mobile number and name"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Generate Password
      |--------------------------------------------------------------------------
      */
      const generatedPassword =
        generatePassword(name);

      /*
      |--------------------------------------------------------------------------
      | Create User First
      |--------------------------------------------------------------------------
      */
      const user = await User.create({
        name: String(name).trim(),

        email: cleanValue(email)
          ? cleanValue(email).toLowerCase()
          : null,

        dob: cleanValue(dob),

        image: cleanValue(image),

        bloodGroup: cleanValue(bloodGroup),

        mobile: String(mobile).trim(),

        password: generatedPassword,

        role: role || "member",

        firm_ids: [],
      });

      /*
      |--------------------------------------------------------------------------
      | Process Multiple Firms
      |--------------------------------------------------------------------------
      */
      const connectedFirms = [];

      for (const firmData of firms) {
        if (!firmData || !firmData.firmName) {
          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | Find existing firm OR create new
        |--------------------------------------------------------------------------
        */
        const firm =
          await getOrCreateFirm(
            firmData.firmName,
            firmData.firmAddress
          );

        /*
        |--------------------------------------------------------------------------
        | Add Firm ID To User
        |--------------------------------------------------------------------------
        */
        user.firm_ids = addUniqueId(
          user.firm_ids,
          firm.id
        );

        /*
        |--------------------------------------------------------------------------
        | Add User ID To Firm
        |--------------------------------------------------------------------------
        */
        firm.user_ids = addUniqueId(
          firm.user_ids,
          user.id
        );

        await firm.save();

        connectedFirms.push({
          id: firm.id,
          firmName: firm.firmName,
          firmAddress: firm.firmAddress,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Save User With Firm IDs
      |--------------------------------------------------------------------------
      */
      await user.save();

      /*
      |--------------------------------------------------------------------------
      | Generate Tokens
      |--------------------------------------------------------------------------
      */
      const accessToken =
        await signAccessToken(user.id);

      const refreshToken =
        await signRefreshToken(user.id);

      res.status(201).json({
        success: true,
        msg: "Registration Successful",

        accessToken,
        refreshToken,

        generatedPassword,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          dob: user.dob,
          image: user.image,
          bloodGroup: user.bloodGroup,
          mobile: user.mobile,
          role: user.role,

          firm_ids: user.firm_ids,

          firms: connectedFirms,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  |
  | Login:
  |
  | {
  |   "mobile": "9424860299",
  |   "password": "Narendra@123"
  | }
  |
  |--------------------------------------------------------------------------
  */
  login: async (req, res, next) => {
    try {
      const { mobile, password } = req.body;

      if (!mobile || !password) {
        throw createError.BadRequest(
          "Mobile number and password are required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Find users by mobile
      |--------------------------------------------------------------------------
      |
      | Multiple users can have same mobile.
      |
      |--------------------------------------------------------------------------
      */
      const users = await User.findAll({
        where: {
          mobile: String(mobile).trim(),
        },
      });

      if (!users || users.length === 0) {
        throw createError.NotFound(
          "User not registered"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Find User By Password
      |--------------------------------------------------------------------------
      */
      let loggedInUser = null;

      for (const user of users) {
        if (user.is_inactive) {
          continue;
        }

        const isMatch =
          await user.isValidPassword(
            password
          );

        if (isMatch) {
          loggedInUser = user;
          break;
        }
      }

      if (!loggedInUser) {
        throw createError.Unauthorized(
          "Invalid credentials"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Get User's Firms
      |--------------------------------------------------------------------------
      */
      const firmIds = normalizeIds(
        loggedInUser.firm_ids
      );

      let firms = [];

      if (firmIds.length > 0) {
        firms = await Firm.findAll({
          where: {
            id: {
              [Op.in]: firmIds,
            },
          },

          attributes: [
            "id",
            "firmName",
            "firmAddress",
          ],
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Tokens
      |--------------------------------------------------------------------------
      */
      const accessToken =
        await signAccessToken(
          loggedInUser.id
        );

      const refreshToken =
        await signRefreshToken(
          loggedInUser.id
        );

      res.status(200).json({
        success: true,
        msg: "Login Successful",

        accessToken,
        refreshToken,

        user: {
          id: loggedInUser.id,
          name: loggedInUser.name,
          email: loggedInUser.email,
          dob: loggedInUser.dob,
          image: loggedInUser.image,
          bloodGroup:
            loggedInUser.bloodGroup,
          mobile: loggedInUser.mobile,
          role: loggedInUser.role,

          firm_ids: firmIds,

          firms,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw createError.BadRequest(
          "Refresh token required"
        );
      }

      const userId =
        await verifyRefreshToken(
          refreshToken
        );

      const user =
        await User.findByPk(userId);

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      if (user.is_inactive) {
        throw createError.Unauthorized(
          "User account is inactive"
        );
      }

      const accessToken =
        await signAccessToken(userId);

      const newRefreshToken =
        await signRefreshToken(userId);

      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */
  profile: async (req, res, next) => {
    try {
      const user =
        await User.findByPk(
          req.userId,
          {
            attributes: {
              exclude: ["password"],
            },
          }
        );

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Get Firms
      |--------------------------------------------------------------------------
      */
      const firmIds = normalizeIds(
        user.firm_ids
      );

      let firms = [];

      if (firmIds.length > 0) {
        firms = await Firm.findAll({
          where: {
            id: {
              [Op.in]: firmIds,
            },
          },

          attributes: [
            "id",
            "firmName",
            "firmAddress",
          ],
        });
      }

      res.json({
        success: true,

        user: {
          ...user.toJSON(),

          firm_ids: firmIds,

          firms,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET USER BY ID
  |--------------------------------------------------------------------------
  */
  getUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user =
        await User.findByPk(id, {
          attributes: {
            exclude: ["password"],
          },
        });

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Get Firms
      |--------------------------------------------------------------------------
      */
      const firmIds = normalizeIds(
        user.firm_ids
      );

      let firms = [];

      if (firmIds.length > 0) {
        firms = await Firm.findAll({
          where: {
            id: {
              [Op.in]: firmIds,
            },
          },

          attributes: [
            "id",
            "firmName",
            "firmAddress",
          ],
        });
      }

      res.json({
        success: true,

        user: {
          ...user.toJSON(),

          firm_ids: firmIds,

          firms,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET ALL USERS
  |--------------------------------------------------------------------------
  */
  getAllUsers: async (req, res, next) => {
    try {
      const users =
        await User.findAll({
          attributes: {
            exclude: ["password"],
          },

          order: [
            ["id", "DESC"],
          ],
        });

      /*
      |--------------------------------------------------------------------------
      | Get all firm IDs
      |--------------------------------------------------------------------------
      */
      const allFirmIds = [];

      users.forEach((user) => {
        const ids = normalizeIds(
          user.firm_ids
        );

        ids.forEach((id) => {
          if (!allFirmIds.includes(id)) {
            allFirmIds.push(id);
          }
        });
      });

      let firms = [];

      if (allFirmIds.length > 0) {
        firms = await Firm.findAll({
          where: {
            id: {
              [Op.in]: allFirmIds,
            },
          },

          attributes: [
            "id",
            "firmName",
            "firmAddress",
          ],
        });
      }

      const firmMap = {};

      firms.forEach((firm) => {
        firmMap[firm.id] =
          firm.toJSON();
      });

      const finalUsers = users.map(
        (user) => {
          const json =
            user.toJSON();

          const firmIds =
            normalizeIds(
              json.firm_ids
            );

          return {
            ...json,

            firm_ids: firmIds,

            firms: firmIds
              .map(
                (id) =>
                  firmMap[id]
              )
              .filter(Boolean),
          };
        }
      );

      res.json({
        success: true,
        count: finalUsers.length,
        users: finalUsers,
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET FIRM BY ID
  |--------------------------------------------------------------------------
  */
  getFirm: async (req, res, next) => {
    try {
      const { id } = req.params;

      const firm =
        await Firm.findByPk(id);

      if (!firm) {
        throw createError.NotFound(
          "Firm not found"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Get Users
      |--------------------------------------------------------------------------
      */
      const userIds = normalizeIds(
        firm.user_ids
      );

      let users = [];

      if (userIds.length > 0) {
        users = await User.findAll({
          where: {
            id: {
              [Op.in]: userIds,
            },
          },

          attributes: {
            exclude: ["password"],
          },

          order: [
            ["id", "ASC"],
          ],
        });
      }

      res.json({
        success: true,

        firm: {
          ...firm.toJSON(),

          user_ids: userIds,

          users,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET ALL FIRMS
  |--------------------------------------------------------------------------
  */
  getAllFirms: async (req, res, next) => {
    try {
      const firms =
        await Firm.findAll({
          order: [
            ["id", "DESC"],
          ],
        });

      /*
      |--------------------------------------------------------------------------
      | Get all user IDs
      |--------------------------------------------------------------------------
      */
      const allUserIds = [];

      firms.forEach((firm) => {
        const ids = normalizeIds(
          firm.user_ids
        );

        ids.forEach((id) => {
          if (!allUserIds.includes(id)) {
            allUserIds.push(id);
          }
        });
      });

      let users = [];

      if (allUserIds.length > 0) {
        users = await User.findAll({
          where: {
            id: {
              [Op.in]: allUserIds,
            },
          },

          attributes: [
            "id",
            "name",
            "email",
            "mobile",
            "role",
          ],
        });
      }

      const userMap = {};

      users.forEach((user) => {
        userMap[user.id] =
          user.toJSON();
      });

      const finalFirms = firms.map(
        (firm) => {
          const json =
            firm.toJSON();

          const userIds =
            normalizeIds(
              json.user_ids
            );

          return {
            ...json,

            user_ids: userIds,

            users: userIds
              .map(
                (id) =>
                  userMap[id]
              )
              .filter(Boolean),
          };
        }
      );

      res.json({
        success: true,
        count: finalFirms.length,
        firms: finalFirms,
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | ADD FIRM TO USER
  |--------------------------------------------------------------------------
  |
  | POST /users/:userId/firms
  |
  | Body:
  |
  | {
  |   "firmName": "Another Firm",
  |   "firmAddress": "Indore"
  | }
  |
  |--------------------------------------------------------------------------
  */
  addFirmToUser: async (
    req,
    res,
    next
  ) => {
    try {
      const { userId } =
        req.params;

      const {
        firmName,
        firmAddress,
      } = req.body;

      if (!firmName) {
        throw createError.BadRequest(
          "Firm name is required"
        );
      }

      const user =
        await User.findByPk(userId);

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Find/Create Firm
      |--------------------------------------------------------------------------
      */
      const firm =
        await getOrCreateFirm(
          firmName,
          firmAddress
        );

      /*
      |--------------------------------------------------------------------------
      | Add Firm ID to User
      |--------------------------------------------------------------------------
      */
      user.firm_ids =
        addUniqueId(
          user.firm_ids,
          firm.id
        );

      /*
      |--------------------------------------------------------------------------
      | Add User ID to Firm
      |--------------------------------------------------------------------------
      */
      firm.user_ids =
        addUniqueId(
          firm.user_ids,
          user.id
        );

      await user.save();
      await firm.save();

      res.status(200).json({
        success: true,
        msg: "Firm added to user successfully",

        user: {
          id: user.id,
          name: user.name,
          firm_ids:
            user.firm_ids,
        },

        firm: {
          id: firm.id,
          firmName:
            firm.firmName,
          firmAddress:
            firm.firmAddress,
          user_ids:
            firm.user_ids,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | REMOVE FIRM FROM USER
  |--------------------------------------------------------------------------
  |
  | DELETE /users/:userId/firms/:firmId
  |
  |--------------------------------------------------------------------------
  */
  removeFirmFromUser: async (
    req,
    res,
    next
  ) => {
    try {
      const {
        userId,
        firmId,
      } = req.params;

      const user =
        await User.findByPk(userId);

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      const firm =
        await Firm.findByPk(firmId);

      if (!firm) {
        throw createError.NotFound(
          "Firm not found"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Remove Firm ID From User
      |--------------------------------------------------------------------------
      */
      user.firm_ids =
        removeId(
          user.firm_ids,
          firmId
        );

      /*
      |--------------------------------------------------------------------------
      | Remove User ID From Firm
      |--------------------------------------------------------------------------
      */
      firm.user_ids =
        removeId(
          firm.user_ids,
          userId
        );

      await user.save();
      await firm.save();

      res.json({
        success: true,
        msg: "Firm removed from user successfully",

        user: {
          id: user.id,
          name: user.name,
          firm_ids:
            user.firm_ids,
        },

        firm: {
          id: firm.id,
          firmName:
            firm.firmName,
          user_ids:
            firm.user_ids,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */
  changePassword: async (
    req,
    res,
    next
  ) => {
    try {
      const {
        current_password,
        new_password,
      } = req.body;

      if (
        !current_password ||
        !new_password
      ) {
        throw createError.BadRequest(
          "Current password and new password are required"
        );
      }

      const user =
        await User.findByPk(
          req.userId
        );

      if (!user) {
        throw createError.NotFound(
          "User not found"
        );
      }

      const isMatch =
        await user.isValidPassword(
          current_password
        );

      if (!isMatch) {
        throw createError.Unauthorized(
          "Current password is incorrect"
        );
      }

      user.password =
        new_password;

      await user.save();

      res.json({
        success: true,
        msg: "Password changed successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | BULK UPLOAD
  |--------------------------------------------------------------------------
  |
  | Excel columns:
  |
  | name
  | email
  | dob
  | image
  | bloodGroup
  | mobile
  | firmName
  | firmAddress
  |
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | If same user appears multiple times with different firms:
  |
  | Narendra | 9424860299 | Tarun Fabrics
  | Narendra | 9424860299 | Another Firm
  |
  | Only ONE user is created.
  |
  | User.firm_ids becomes:
  |
  | [1, 2]
  |
  |--------------------------------------------------------------------------
  */
  bulkUpload: async (
    req,
    res,
    next
  ) => {
    try {
      if (!req.file) {
        throw createError.BadRequest(
          "Excel file is required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Read Excel
      |--------------------------------------------------------------------------
      */
      const workbook =
        XLSX.read(
          req.file.buffer,
          {
            type: "buffer",
            cellDates: true,
          }
        );

      const sheetName =
        workbook.SheetNames[0];

      const sheet =
        workbook.Sheets[
          sheetName
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            defval: "",
          }
        );

      if (!rows.length) {
        throw createError.BadRequest(
          "Excel file is empty"
        );
      }

      const result = {
        totalRows: rows.length,

        usersCreated: 0,
        existingUsers: 0,

        firmsCreated: 0,
        existingFirms: 0,

        relationshipsCreated: 0,

        failed: 0,

        users: [],

        errors: [],
      };

      /*
      |--------------------------------------------------------------------------
      | Process Rows
      |--------------------------------------------------------------------------
      */
      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row = rows[index];

        try {
          const name =
            cleanValue(row.name);

          const email =
            cleanValue(row.email);

          const dob =
            cleanValue(row.dob);

          const image =
            cleanValue(row.image);

          const bloodGroup =
            cleanValue(
              row.bloodGroup
            );

          const mobile =
            cleanValue(row.mobile);

          const firmName =
            cleanValue(
              row.firmName
            );

          const firmAddress =
            cleanValue(
              row.firmAddress
            );

          /*
          |--------------------------------------------------------------------------
          | Validation
          |--------------------------------------------------------------------------
          */
          if (!name) {
            throw new Error(
              "Name is required"
            );
          }

          if (!mobile) {
            throw new Error(
              "Mobile number is required"
            );
          }

          if (!firmName) {
            throw new Error(
              "Firm name is required"
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Find Existing User
          |--------------------------------------------------------------------------
          |
          | Same name + mobile = same user.
          |
          |--------------------------------------------------------------------------
          */
          let user =
            await User.findOne({
              where: {
                name,
                mobile,
              },
            });

          let generatedPassword =
            null;

          /*
          |--------------------------------------------------------------------------
          | Create User If Doesn't Exist
          |--------------------------------------------------------------------------
          */
          if (!user) {
            generatedPassword =
              generatePassword(
                name
              );

            user =
              await User.create({
                name,

                email: email
                  ? email.toLowerCase()
                  : null,

                dob,
                image,
                bloodGroup,
                mobile,

                password:
                  generatedPassword,

                role: "member",

                firm_ids: [],
              });

            result.usersCreated++;
          } else {
            result.existingUsers++;
          }

          /*
          |--------------------------------------------------------------------------
          | Find / Create Firm
          |--------------------------------------------------------------------------
          */
          let firm =
            await Firm.findOne({
              where: {
                firmName,
              },
            });

          if (!firm) {
            firm =
              await Firm.create({
                firmName,
                firmAddress,

                user_ids: [],
              });

            result.firmsCreated++;
          } else {
            result.existingFirms++;

            /*
            |--------------------------------------------------------------------------
            | Update Address If Missing
            |--------------------------------------------------------------------------
            */
            if (
              !firm.firmAddress &&
              firmAddress
            ) {
              firm.firmAddress =
                firmAddress;

              await firm.save();
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Add Firm ID To User
          |--------------------------------------------------------------------------
          */
          const oldFirmIds =
            normalizeIds(
              user.firm_ids
            );

          const newFirmIds =
            addUniqueId(
              oldFirmIds,
              firm.id
            );

          if (
            JSON.stringify(
              oldFirmIds
            ) !==
            JSON.stringify(
              newFirmIds
            )
          ) {
            user.firm_ids =
              newFirmIds;

            await user.save();

            result.relationshipsCreated++;
          }

          /*
          |--------------------------------------------------------------------------
          | Add User ID To Firm
          |--------------------------------------------------------------------------
          */
          const oldUserIds =
            normalizeIds(
              firm.user_ids
            );

          const newUserIds =
            addUniqueId(
              oldUserIds,
              user.id
            );

          if (
            JSON.stringify(
              oldUserIds
            ) !==
            JSON.stringify(
              newUserIds
            )
          ) {
            firm.user_ids =
              newUserIds;

            await firm.save();
          }

          /*
          |--------------------------------------------------------------------------
          | Store Result
          |--------------------------------------------------------------------------
          */
          result.users.push({
            row: index + 2,

            userId: user.id,

            name: user.name,

            mobile: user.mobile,

            firmId: firm.id,

            firmName:
              firm.firmName,

            generatedPassword,
          });
        } catch (error) {
          result.failed++;

          result.errors.push({
            row: index + 2,

            name:
              row.name || null,

            mobile:
              row.mobile || null,

            firmName:
              row.firmName || null,

            error: error.message,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */
      res.status(201).json({
        success: true,

        msg: "Bulk upload completed",

        result,
      });
    } catch (err) {
      next(err);
    }
  },
};