const express = require("express");
const { stringify } = require("csv-stringify/sync");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

async function logHistory({ teamId = null, fieldName, oldValue, newValue, transferPlayer = null }) {
  await pool.query(
    "INSERT INTO modification_history (team_id, field_name, old_value, new_value, transfer_player) VALUES ($1, $2, $3, $4, $5)",
    [teamId, fieldName, toText(oldValue), toText(newValue), transferPlayer]
  );
}

function toText(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

router.get("/", async (req, res) => {
  const { team_id, field_name, start, end } = req.query;
  const conditions = [];
  const values = [];
  if (team_id) {
    values.push(team_id);
    conditions.push(`team_id = $${values.length}`);
  }
  if (field_name) {
    values.push(field_name);
    conditions.push(`field_name = $${values.length}`);
  }
  if (start) {
    values.push(start);
    conditions.push(`timestamp >= $${values.length}`);
  }
  if (end) {
    values.push(end);
    conditions.push(`timestamp <= $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT id, team_id, field_name, old_value, new_value, transfer_player, timestamp FROM modification_history ${where} ORDER BY timestamp DESC`,
    values
  );
  res.json(rows);
});

router.get("/export", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT timestamp, team_id, field_name, old_value, new_value, transfer_player FROM modification_history ORDER BY timestamp DESC"
  );
  const csv = stringify(rows, {
    header: true,
    columns: [
      { key: "timestamp", header: "时间" },
      { key: "team_id", header: "球队ID" },
      { key: "field_name", header: "字段" },
      { key: "old_value", header: "旧值" },
      { key: "new_value", header: "新值" },
      { key: "transfer_player", header: "球员" }
    ]
  });
  const bom = "\uFEFF";
  res.setHeader("Content-Disposition", "attachment; filename=history_export.csv");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(bom + csv);
});

router.delete("/", authMiddleware, async (req, res) => {
  await pool.query("DELETE FROM modification_history");
  res.json({ message: "历史记录已清空" });
});

module.exports = router;
module.exports.logHistory = logHistory;

