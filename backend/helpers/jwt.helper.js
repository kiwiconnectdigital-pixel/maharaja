const jwt = require("jsonwebtoken");
const createError = require("http-errors");


// ============================================================
// ACCESS TOKEN
// ============================================================

const signAccessToken = async (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {
      userId: userId,
    };

    jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn:
          process.env.ACCESS_TOKEN_EXPIRY || "1d",
      },
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });
};


// ============================================================
// VERIFY ACCESS TOKEN
// ============================================================

const verifyAccessToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return reject(
            createError.Unauthorized(
              "Invalid or expired access token"
            )
          );
        }

        resolve(decoded.userId);
      }
    );
  });
};


// ============================================================
// REFRESH TOKEN
// ============================================================

const signRefreshToken = async (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {
      userId: userId,
    };

    jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn:
          process.env.REFRESH_TOKEN_EXPIRY || "7d",
      },
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });
};


// ============================================================
// VERIFY REFRESH TOKEN
// ============================================================

const verifyRefreshToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return reject(
            createError.Unauthorized(
              "Invalid or expired refresh token"
            )
          );
        }

        resolve(decoded.userId);
      }
    );
  });
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};