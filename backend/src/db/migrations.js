const bcrypt = require("bcrypt");
const { pool } = require("./connection");

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "admin";
const SALT_ROUNDS = 10;

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      level INTEGER NOT NULL,
      team_name VARCHAR(255) NOT NULL,
      budget NUMERIC(14,2) DEFAULT 0,
      position_order INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS modification_history (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
      field_name VARCHAR(255) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      transfer_player VARCHAR(255),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await ensureDefaultPassword();
  await ensureDefaultLevelNames();
  await ensureTeamsInitialized();
}

async function ensureDefaultPassword() {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = 'public_password'");
  if (rows.length === 0) {
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    await pool.query("INSERT INTO config (key, value) VALUES ($1, $2)", ["public_password", hashed]);
  }
}

async function ensureDefaultLevelNames() {
  const defaults = [
    { key: "level_name_1", value: "Level 1" },
    { key: "level_name_2", value: "Level 2" },
    { key: "level_name_3", value: "Level 3" }
  ];
  for (const item of defaults) {
    const { rows } = await pool.query("SELECT value FROM config WHERE key = $1", [item.key]);
    if (!rows.length) {
      await pool.query("INSERT INTO config (key, value) VALUES ($1, $2)", [item.key, item.value]);
    }
  }
}

async function ensureTeamsInitialized() {
  const initFlag = await pool.query("SELECT value FROM config WHERE key = 'initialized'");
  if (initFlag.rows.length && initFlag.rows[0].value === "true") return;

  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int as count FROM teams");
  if (countRows[0].count > 0) {
    await pool.query("INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", ["initialized", "true"]);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let level = 1; level <= 3; level += 1) {
      for (let i = 1; i <= 20; i += 1) {
        const name = `Level ${level} Team ${i}`;
        await client.query(
          "INSERT INTO teams (level, team_name, budget, position_order) VALUES ($1, $2, $3, $4)",
          [level, name, 0, i]
        );
      }
    }
    await client.query(
      "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
      ["initialized", "true"]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };

