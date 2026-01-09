const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const teamsRoutes = require("./routes/teams");
const transfersRoutes = require("./routes/transfers");
const historyRoutes = require("./routes/history");
const tokenAlertsRoutes = require("./routes/tokenAlerts");
const { runMigrations } = require("./db/migrations");

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);

app.use(bodyParser.json({ limit: "1mb", type: "application/json" }));
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.length === 0) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    }
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/token-alerts", tokenAlertsRoutes);

const start = async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

