const express  = require("express");
const cors     = require("cors");
const path     = require("path");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static client files ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../client")));

console.log("✅  JSON Database initialized in /server/db");

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/devices", require("./routes/devices"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date() }));

// ── SPA fallback — serve index.html for all non-API routes ───────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ msg: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  SP Tech Safe server → http://localhost:${PORT}`);
});