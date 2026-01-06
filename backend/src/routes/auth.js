const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_EXPIRES_IN = "24h";

router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ message: "请输入密码" });
  }
  try {
    const { rows } = await pool.query("SELECT value FROM config WHERE key = 'public_password'");
    if (!rows.length) {
      return res.status(500).json({ message: "系统未初始化密码" });
    }
    const hashed = rows[0].value;
    const ok = await bcrypt.compare(password, hashed);
    if (!ok) {
      return res.status(401).json({ message: "密码错误" });
    }
    const token = jwt.sign({ role: "editor" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    return res.json({ token, message: "登录成功" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "登录失败" });
  }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "请提供原密码和新密码" });
  }
  try {
    const { rows } = await pool.query("SELECT value FROM config WHERE key = 'public_password'");
    if (!rows.length) return res.status(500).json({ message: "系统未初始化密码" });
    const hashed = rows[0].value;
    const ok = await bcrypt.compare(oldPassword, hashed);
    if (!ok) return res.status(401).json({ message: "原密码错误" });
    const newHashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE config SET value=$1 WHERE key='public_password'", [newHashed]);
    return res.json({ message: "密码修改成功" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "修改密码失败" });
  }
});

module.exports = router;

