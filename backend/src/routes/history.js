const express = require("express");
const { stringify } = require("csv-stringify/sync");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { requireTeamToken } = require("../middleware/teamToken");

const router = express.Router();

async function logHistory({ teamId = null, fieldName, oldValue, newValue, transferPlayer = null }) {
  await pool.query(
    "INSERT INTO lb_modification_history (team_id, field_name, old_value, new_value, transfer_player) VALUES ($1, $2, $3, $4, $5)",
    [teamId, fieldName, toText(oldValue), toText(newValue), transferPlayer]
  );
}

function toText(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

router.get("/", requireTeamToken, async (req, res) => {
  const { team_id, field_name, start, end, page = 1, pageSize = 10 } = req.query;
  const conditions = [];
  const values = [];
  if (team_id) {
    values.push(team_id);
    conditions.push(`h.team_id = $${values.length}`);
  }
  if (field_name) {
    values.push(field_name);
    conditions.push(`h.field_name = $${values.length}`);
  }
  if (start) {
    values.push(start);
    conditions.push(`h.timestamp >= $${values.length}`);
  }
  if (end) {
    values.push(end);
    conditions.push(`h.timestamp <= $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Number(page) - 1) * Number(pageSize);

  const baseQuery = `
    FROM lb_modification_history h
    LEFT JOIN lb_teams t ON h.team_id = t.id
    ${where}
  `;

  const { rows: rowsData } = await pool.query(
    `
    SELECT h.id, h.team_id, t.team_name, h.field_name, h.old_value, h.new_value, h.transfer_player, h.timestamp
    ${baseQuery}
    ORDER BY h.timestamp DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `,
    [...values, Number(pageSize), offset]
  );

  const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS total ${baseQuery}`, values);
  const total = countRows[0].total;

  const mapped = rowsData.map((r) => ({
    ...r,
    change_value: computeChange(r.old_value, r.new_value)
  }));

  res.json({
    data: mapped,
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  });
});

router.get("/export", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT h.timestamp, t.team_name, h.field_name, h.old_value, h.new_value, h.transfer_player
    FROM lb_modification_history h
    LEFT JOIN lb_teams t ON h.team_id = t.id
    ORDER BY h.timestamp DESC
  `);

  const mapped = rows.map((r) => ({
    timestamp: r.timestamp,
    field_name: r.field_name,
    team_name: r.team_name || "",
    change_value: computeChange(r.old_value, r.new_value),
    new_value: r.new_value,
    transfer_player: r.transfer_player || ""
  }));

  const csv = stringify(mapped, {
    header: true,
    columns: [
      { key: "timestamp", header: "时间" },
      { key: "field_name", header: "字段" },
      { key: "team_name", header: "球队" },
      { key: "change_value", header: "变化值" },
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
  await pool.query("DELETE FROM lb_modification_history");
  res.json({ message: "历史记录已清空" });
});

function computeChange(oldVal, newVal) {
  const nOld = Number(oldVal);
  const nNew = Number(newVal);
  if (Number.isFinite(nOld) && Number.isFinite(nNew)) {
    return nNew - nOld;
  }
  return "";
}

module.exports = router;
module.exports.logHistory = logHistory;

