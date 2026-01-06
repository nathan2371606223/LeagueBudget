const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { findTeamByName } = require("../utils/teamMatcher");
const { logHistory } = require("./history");

const router = express.Router();

function parsePrice(raw) {
  if (raw === null || raw === undefined) return NaN;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .trim()
    // keep digits, dot, minus
    .replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return NaN;
  return Number(cleaned);
}

router.post("/process", authMiddleware, async (req, res) => {
  const transfers = req.body?.transfers || [];
  if (!Array.isArray(transfers) || !transfers.length) {
    return res.status(400).json({ message: "请提供转会记录" });
  }

  const { rows: teams } = await pool.query("SELECT * FROM teams");
  const budgetMap = new Map();
  teams.forEach((t) => budgetMap.set(t.id, Number(t.budget)));

  const updates = [];
  const warnings = [];
  let processed = 0;

  transfers.forEach((record) => {
    const teamInName = record.teamIn;
    const teamOutName = record.teamOut;
    const price = parsePrice(record.price);
    const player = record.player || "";
    if (!Number.isFinite(price) || price <= 0) {
      warnings.push({ team: `${teamInName || ""}/${teamOutName || ""}`, reason: "价格无效" });
      return;
    }
    const teamIn = findTeamByName(teamInName, teams);
    const teamOut = findTeamByName(teamOutName, teams);

    if (teamIn && teamOut) {
      updates.push({ teamId: teamIn.id, delta: -price, player, info: record });
      updates.push({ teamId: teamOut.id, delta: price, player, info: record });
      processed += 1;
    } else if (teamIn || teamOut) {
      if (teamIn) {
        updates.push({ teamId: teamIn.id, delta: -price, player, info: record });
        warnings.push({ team: teamOutName, reason: "转出球队未找到，已仅扣除转入球队预算" });
      } else {
        updates.push({ teamId: teamOut.id, delta: price, player, info: record });
        warnings.push({ team: teamInName, reason: "转入球队未找到，已仅增加转出球队预算" });
      }
      processed += 1;
    } else {
      warnings.push({ team: `${teamInName}/${teamOutName}`, reason: "未找到相关球队" });
    }
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const upd of updates) {
      const oldBudget = budgetMap.get(upd.teamId) ?? 0;
      const newBudget = oldBudget + upd.delta;
      budgetMap.set(upd.teamId, newBudget);
      await client.query("UPDATE teams SET budget=$1, updated_at=NOW() WHERE id=$2", [newBudget, upd.teamId]);
      await logHistory({
        teamId: upd.teamId,
        fieldName: "transfer",
        oldValue: oldBudget,
        newValue: newBudget,
        transferPlayer: upd.player || upd.info?.player || ""
      });
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "处理转会失败" });
  } finally {
    client.release();
  }

  res.json({ success: true, processed, warnings });
});

module.exports = router;

