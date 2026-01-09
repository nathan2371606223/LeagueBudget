const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/teamToken");

const router = express.Router();

// Get announcement - public (accepts JWT or team token)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT content, updated_at FROM lb_announcement ORDER BY id DESC LIMIT 1");
    if (rows.length === 0) {
      return res.json({ content: "", updated_at: null });
    }
    return res.json({
      content: rows[0].content || "",
      updated_at: rows[0].updated_at
    });
  } catch (err) {
    console.error("Error fetching announcement:", err);
    return res.status(500).json({ message: "获取公告失败" });
  }
});

// Update announcement - requires auth (editor only)
router.put("/", authMiddleware, async (req, res) => {
  const { content } = req.body || {};
  try {
    // Update or insert
    const { rows: existing } = await pool.query("SELECT id FROM lb_announcement ORDER BY id DESC LIMIT 1");
    if (existing.length > 0) {
      await pool.query(
        "UPDATE lb_announcement SET content=$1, updated_at=NOW() WHERE id=$2",
        [content || "", existing[0].id]
      );
    } else {
      await pool.query("INSERT INTO lb_announcement (content) VALUES ($1)", [content || ""]);
    }
    return res.json({ message: "公告已更新", content: content || "", updated_at: new Date() });
  } catch (err) {
    console.error("Error updating announcement:", err);
    return res.status(500).json({ message: "更新公告失败" });
  }
});

module.exports = router;
