const { pool } = require("../db/connection");

async function requireTeamToken(req, res, next) {
  const token =
    req.headers["x-team-token"] ||
    req.query?.token ||
    (typeof req.body === "object" ? req.body.token : null);

  if (!token) {
    return res.status(401).json({ message: "需要令牌才能访问" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT team_id, token, team_name 
       FROM lb_team_tokens 
       WHERE token = $1 AND active = true`,
      [token]
    );
    if (!rows.length) {
      return res.status(403).json({ message: "令牌无效或已失效" });
    }
    req.tokenTeam = {
      id: rows[0].team_id,
      name: rows[0].team_name,
      token: rows[0].token
    };
    next();
  } catch (err) {
    console.error("Token validation failed:", err);
    return res.status(500).json({ message: "令牌验证失败" });
  }
}

module.exports = { requireTeamToken };
