const { pool } = require("../db/connection");
const jwt = require("jsonwebtoken");

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

// Optional auth: accepts either JWT (for editors) or team token (for visitors)
async function optionalAuth(req, res, next) {
  // Check for JWT token first (editor authentication)
  const authHeader = req.headers.authorization || "";
  const jwtToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  if (jwtToken) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
      jwt.verify(jwtToken, JWT_SECRET);
      // JWT is valid, proceed without team token
      return next();
    } catch (err) {
      // JWT invalid, fall through to check team token
    }
  }

  // Check for team token (visitor authentication)
  const teamToken =
    req.headers["x-team-token"] ||
    req.query?.token ||
    (typeof req.body === "object" ? req.body.token : null);

  if (teamToken) {
    try {
      const { rows } = await pool.query(
        `SELECT team_id, token, team_name 
         FROM lb_team_tokens 
         WHERE token = $1 AND active = true`,
        [teamToken]
      );
      if (rows.length) {
        req.tokenTeam = {
          id: rows[0].team_id,
          name: rows[0].team_name,
          token: rows[0].token
        };
        return next();
      }
    } catch (err) {
      console.error("Team token validation failed:", err);
    }
  }

  // Neither token is valid, require team token for visitors
  return res.status(401).json({ message: "需要令牌才能访问" });
}

module.exports = { requireTeamToken, optionalAuth };
