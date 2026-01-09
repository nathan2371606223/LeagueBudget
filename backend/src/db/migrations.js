const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { pool } = require("./connection");

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "admin";
const SALT_ROUNDS = 10;

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_config (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_teams (
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
    CREATE TABLE IF NOT EXISTS lb_modification_history (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES lb_teams(id) ON DELETE SET NULL,
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
  await ensureTeamTokens();
}

async function ensureDefaultPassword() {
  const { rows } = await pool.query("SELECT value FROM lb_config WHERE key = 'public_password'");
  if (rows.length === 0) {
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    await pool.query("INSERT INTO lb_config (key, value) VALUES ($1, $2)", ["public_password", hashed]);
  }
}

async function ensureDefaultLevelNames() {
  const defaults = [
    { key: "level_name_1", value: "Level 1" },
    { key: "level_name_2", value: "Level 2" },
    { key: "level_name_3", value: "Level 3" }
  ];
  for (const item of defaults) {
    const { rows } = await pool.query("SELECT value FROM lb_config WHERE key = $1", [item.key]);
    if (!rows.length) {
      await pool.query("INSERT INTO lb_config (key, value) VALUES ($1, $2)", [item.key, item.value]);
    }
  }
}

async function ensureTeamsInitialized() {
  const initFlag = await pool.query("SELECT value FROM lb_config WHERE key = 'initialized'");
  if (initFlag.rows.length && initFlag.rows[0].value === "true") return;

  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int as count FROM lb_teams");
  if (countRows[0].count > 0) {
    await pool.query("INSERT INTO lb_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", ["initialized", "true"]);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let level = 1; level <= 3; level += 1) {
      for (let i = 1; i <= 20; i += 1) {
        const name = `Level ${level} Team ${i}`;
        await client.query(
          "INSERT INTO lb_teams (level, team_name, budget, position_order) VALUES ($1, $2, $3, $4)",
          [level, name, 0, i]
        );
      }
    }
    await client.query(
      "INSERT INTO lb_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
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

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

async function ensureTeamTokens() {
  // Token table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_team_tokens (
      team_id INTEGER PRIMARY KEY REFERENCES lb_teams(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      team_name VARCHAR(255),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Add team_name column if it doesn't exist (for existing databases)
  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='lb_team_tokens' AND column_name='team_name'
      ) THEN
        ALTER TABLE lb_team_tokens ADD COLUMN team_name VARCHAR(255);
      END IF;
    END $$;
  `);

  // Populate team_name for existing records
  await pool.query(`
    UPDATE lb_team_tokens tt
    SET team_name = t.team_name
    FROM lb_teams t
    WHERE tt.team_id = t.id AND (tt.team_name IS NULL OR tt.team_name != t.team_name);
  `);

  // Alert table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_token_alerts (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES lb_teams(id) ON DELETE SET NULL,
      token TEXT,
      module TEXT NOT NULL,
      payload JSONB,
      message TEXT,
      resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed tokens for teams without one
  const { rows: teams } = await pool.query("SELECT id, team_name FROM lb_teams");
  for (const t of teams) {
    const { rows: existing } = await pool.query(
      "SELECT token FROM lb_team_tokens WHERE team_id=$1",
      [t.id]
    );
    if (existing.length === 0) {
      const token = generateToken();
      await pool.query(
        "INSERT INTO lb_team_tokens (team_id, token, team_name) VALUES ($1, $2, $3)",
        [t.id, token, t.team_name]
      );
    } else {
      // Update team_name if it's missing or different
      await pool.query(
        "UPDATE lb_team_tokens SET team_name=$1 WHERE team_id=$2 AND (team_name IS NULL OR team_name != $1)",
        [t.team_name, t.id]
      );
    }
  }

  // Create announcement table for LeagueBudget
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_announcement (
      id SERIAL PRIMARY KEY,
      content TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Initialize with empty announcement if none exists
  const { rows: existingAnnouncement } = await pool.query("SELECT id FROM lb_announcement LIMIT 1");
  if (existingAnnouncement.length === 0) {
    await pool.query("INSERT INTO lb_announcement (content) VALUES ('')");
  }
}

// NOTE: This function is no longer needed as old tables have been cleaned up.
// Kept for reference only. If needed in the future, uncomment and use.
/*
async function dropOldTables() {
  // Drop old tables if they exist (after migration to lb_* tables)
  // Note: This will permanently delete data in old tables
  // Make sure data has been migrated to lb_* tables before running this
  
  const tables = ['modification_history', 'teams', 'config'];
  
  for (const table of tables) {
    try {
      // Check if table exists
      const { rows } = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (rows[0].exists) {
        console.log(`Dropping old table: ${table}...`);
        // Drop with CASCADE to handle foreign key constraints
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        console.log(`✓ Successfully dropped table: ${table}`);
      } else {
        console.log(`- Table ${table} does not exist, skipping`);
      }
    } catch (err) {
      console.error(`✗ Error dropping table ${table}:`, err.message || err);
      // Continue with other tables even if one fails
    }
  }
}
*/

module.exports = { runMigrations };

