const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { logHistory } = require("./history");
const { runMigrations } = require("../db/migrations");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM teams ORDER BY level ASC, position_order ASC");
  res.json(rows);
});

router.get("/init-check", async (req, res) => {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = 'initialized'");
  res.json({ initialized: rows.length ? rows[0].value === "true" : false });
});

router.post("/initialize", async (req, res) => {
  try {
    await runMigrations();
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM teams");
    res.json({ initialized: true, teamCount: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "初始化失败" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { team_name, budget, level } = req.body || {};
  const { rows } = await pool.query("SELECT * FROM teams WHERE id=$1", [id]);
  if (!rows.length) return res.status(404).json({ message: "未找到球队" });
  const team = rows[0];

  const updates = [];
  const values = [];
  if (team_name !== undefined) {
    values.push(team_name);
    updates.push(`team_name=$${values.length}`);
  }
  if (budget !== undefined) {
    values.push(Number(budget));
    updates.push(`budget=$${values.length}`);
  }
  if (level !== undefined) {
    values.push(Number(level));
    updates.push(`level=$${values.length}`);
  }
  if (!updates.length) return res.json(team);
  values.push(id);
  const setClause = updates.join(", ");
  const updateSql = `UPDATE teams SET ${setClause}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`;
  const { rows: updatedRows } = await pool.query(updateSql, values);
  const updated = updatedRows[0];

  if (team_name !== undefined && team_name !== team.team_name) {
    await logHistory({ teamId: id, fieldName: "team_name", oldValue: team.team_name, newValue: team_name });
  }
  if (budget !== undefined && Number(budget) !== Number(team.budget)) {
    await logHistory({ teamId: id, fieldName: "budget", oldValue: team.budget, newValue: budget });
  }
  if (level !== undefined && Number(level) !== Number(team.level)) {
    await logHistory({ teamId: id, fieldName: "level", oldValue: team.level, newValue: level });
  }

  res.json(updated);
});

router.post("/", authMiddleware, async (req, res) => {
  const { team_name, level = 1, budget = 0 } = req.body || {};
  if (!team_name) return res.status(400).json({ message: "球队名称必填" });
  const { rows: last } = await pool.query("SELECT COALESCE(MAX(position_order),0) as max FROM teams WHERE level=$1", [level]);
  const position_order = Number(last[0].max) + 1;
  const { rows } = await pool.query(
    "INSERT INTO teams (team_name, level, budget, position_order) VALUES ($1, $2, $3, $4) RETURNING *",
    [team_name, level, budget, position_order]
  );
  await logHistory({ teamId: rows[0].id, fieldName: "create", oldValue: null, newValue: { team_name, level, budget } });
  res.status(201).json(rows[0]);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query("SELECT * FROM teams WHERE id=$1", [id]);
  if (!rows.length) return res.status(404).json({ message: "未找到球队" });
  await pool.query("DELETE FROM teams WHERE id=$1", [id]);
  await logHistory({ teamId: id, fieldName: "delete", oldValue: rows[0], newValue: null });
  res.json({ message: "已删除" });
});

router.post("/swap", authMiddleware, async (req, res) => {
  const { team1Id, team2Id } = req.body || {};
  if (!team1Id || !team2Id) return res.status(400).json({ message: "需要两个球队ID" });
  const { rows } = await pool.query("SELECT * FROM teams WHERE id = ANY($1::int[])", [[team1Id, team2Id]]);
  if (rows.length !== 2) return res.status(404).json({ message: "有球队未找到" });
  const t1 = rows.find((t) => t.id === Number(team1Id));
  const t2 = rows.find((t) => t.id === Number(team2Id));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE teams SET level=$1, position_order=$2, updated_at=NOW() WHERE id=$3",
      [t2.level, t2.position_order, t1.id]
    );
    await client.query(
      "UPDATE teams SET level=$1, position_order=$2, updated_at=NOW() WHERE id=$3",
      [t1.level, t1.position_order, t2.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "交换失败" });
  } finally {
    client.release();
  }

  await logHistory({
    teamId: t1.id,
    fieldName: "swap",
    oldValue: { level: t1.level, position_order: t1.position_order },
    newValue: { level: t2.level, position_order: t2.position_order }
  });
  await logHistory({
    teamId: t2.id,
    fieldName: "swap",
    oldValue: { level: t2.level, position_order: t2.position_order },
    newValue: { level: t1.level, position_order: t1.position_order }
  });
  res.json({ message: "交换成功" });
});

module.exports = router;

