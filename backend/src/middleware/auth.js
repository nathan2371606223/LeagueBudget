const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7) : null;
  if (!token) {
    return res.status(401).json({ message: "未授权" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "登录已过期，请重新登录" });
  }
}

module.exports = { authMiddleware };

