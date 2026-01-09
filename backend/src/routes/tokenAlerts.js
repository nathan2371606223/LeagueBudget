const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// List alerts (default unresolved)
router.get("/", authMiddleware, async (req, res) => {
  const { resolved } = req.query;
  const resolvedFlag =
    resolved === undefined ? false : resolved === "true" || resolved === true;
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.team_id, t.team_name, a.token, a.module, a.payload, a.message, a.resolved, a.created_at
       FROM lb_token_alerts a
       LEFT JOIN lb_teams t ON t.id = a.team_id
       WHERE a.resolved = $1
       ORDER BY a.created_at DESC
       LIMIT 500`,
      [resolvedFlag]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching token alerts:", err);
    res.status(500).json({ message: "获取提醒失败" });
  }
});

// Resolve (mark as resolved)
router.post("/:id/resolve", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query("UPDATE lb_token_alerts SET resolved=true WHERE id=$1", [id]);
    res.json({ message: "已标记为已处理" });
  } catch (err) {
    console.error("Error resolving alert:", err);
    res.status(500).json({ message: "处理失败" });
  }
});

// Delete alert
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query("DELETE FROM lb_token_alerts WHERE id=$1", [id]);
    res.json({ message: "已删除提醒" });
  } catch (err) {
    console.error("Error deleting alert:", err);
    res.status(500).json({ message: "删除失败" });
  }
});

module.exports = router;
