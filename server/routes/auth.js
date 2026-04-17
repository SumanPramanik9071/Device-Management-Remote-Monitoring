const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { Users } = require("../config/db");

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "Username and password are required" });
    }

    const user = Users.findOne(u => u.username === username.trim());
    if (!user) return res.status(401).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ msg: "Wrong password" });

    res.json({ msg: "Login success", username: user.username });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error. Please try again." });
  }
});

// ── POST /api/auth/send-phone-otp ─────────────────────────────────────────────
router.post("/send-phone-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: "Phone number required" });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`[OTP] Generated Phone OTP for ${phone}: ${otp}`);

    // If TWILIO credentials are set, actually send the SMS
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      const twilio = require('twilio');
      const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your SP Tech Safe authentication code is: ${otp}`,
        to: phone, // e.g., +1234567890
        from: TWILIO_PHONE_NUMBER // Your Twilio number
      });
      console.log(`[OTP] SMS sent successfully via Twilio!`);
    } else {
      console.log(`[OTP] Twilio not configured. Real SMS skipped. Setting OTP in response for demo.`);
    }

    res.json({ msg: "OTP sent successfully", otp: otp });
  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({ msg: "Server error sending OTP." });
  }
});

// ── POST /api/auth/send-email-otp ─────────────────────────────────────────────
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email address required" });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`[OTP] Generated Email OTP for ${email}: ${otp}`);

    // If SMTP credentials are set, actually send the Email
    const SMTP_HOST = process.env.SMTP_HOST || "";
    const SMTP_PORT = process.env.SMTP_PORT || "";
    const SMTP_USER = process.env.SMTP_USER || "";
    const SMTP_PASS = process.env.SMTP_PASS || "";

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT == 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"SP Tech Safe" <${SMTP_USER}>`,
        to: email,
        subject: "Your Authentication Code",
        text: `Your SP Tech Safe authentication code is: ${otp}`
      });
      console.log(`[OTP] Email sent successfully via Nodemailer!`);
    } else {
      console.log(`[OTP] Nodemailer not configured. Real email skipped. Setting OTP in response for demo.`);
    }

    res.json({ msg: "OTP sent successfully", otp: otp });
  } catch (err) {
    console.error("Email OTP send error:", err.message);
    res.status(500).json({ msg: "Server error sending Email OTP." });
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const exists = Users.findOne(u => u.username === username.trim());
    if (exists) return res.status(409).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = Users.create({ username: username.trim(), password: hashed });

    res.json({ msg: "Admin registered successfully" });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ msg: "Server error." });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.status(400).json({ msg: "Missing fields" });
    if (newPassword.length < 6)    return res.status(400).json({ msg: "Password too short" });

    const users = require("fs").existsSync
      ? JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../db/users.json"), "utf8"))
      : [];

    const idx = users.findIndex(u => u.username === username.trim());
    if (idx === -1) return res.status(404).json({ msg: "User not found" });

    users[idx].password = await bcrypt.hash(newPassword, 10);
    require("fs").writeFileSync(require("path").join(__dirname, "../db/users.json"), JSON.stringify(users, null, 2), "utf8");

    res.json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("Reset error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;