const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const createTokens = (user) => {
  const accessToken = jwt.sign(
    {
      email: user.email,
      id: user.id,
      password: user.pass,
      role: user.role,
    },
    process.env.accessKey
  );
  return accessToken;
};

const validateToken = (req, res, next) => {
  const accessToken = req.cookies[process.env.cookieName];
  if (!accessToken) {
    return res
      .status(404)
      .json({ success: false, message: "User not Authorized" });
  }
  try {
    const validToken = jwt.verify(accessToken, process.env.accessKey);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (error) {
    req.status(400).json({ success: false, error: error });
  }
};


module.exports = { createTokens, validateToken };
