# 🛡️ SP Tech Safe — Device Management Dashboard

A full-stack, enterprise-grade **Device Management & Remote Monitoring** web application with secure admin authentication, OTP verification, real-time device enrollment, and a premium dark-mode dashboard UI.

---

## 📸 Preview

| Login | Register | Dashboard |
|-------|----------|-----------|
| Premium split-screen auth | OTP-verified account creation | Real-time device tracking |

---

## ✨ Features

### 🔐 Authentication
- **Admin Login** with bcrypt-hashed password verification
- **OTP-based Registration** — dual-factor via Phone (Twilio SMS) + Email (Nodemailer)
- **Forgot Password** — multi-step reset flow with OTP verification
- **CAPTCHA** challenge on login for bot protection
- Remember Me session support

### 📱 Device Management
- **Device Enrollment** via shareable tokenized link (24h expiry)
- **Real-time Device Data** — IP, OS, model, battery, screen resolution, timezone, language, connection type
- **GPS Location Tracking** with coordinate capture on enrollment
- **IP Logs, Call Logs, SMS, Contacts, App List** per device
- **Device Status** — active / pending / inactive tracking
- **Rate-limited enrollment** — max 3 attempts per IP per hour

### 🎨 UI / UX
- Premium **dark-mode** design with glassmorphism cards
- Animated particle canvas background
- Split-screen layout (info panel + form card)
- Smooth micro-animations and hover effects
- Fully **responsive** — desktop, tablet, mobile
- Toast notification system
- Shimmer gradient header bars

---

## 🗂️ Project Structure

```
SP Tech Safe/
├── client/                   # Frontend (static HTML/CSS/JS)
│   ├── index.html            # Login page
│   ├── register.html         # Admin registration page
│   ├── dashboard.html        # Main device management dashboard
│   ├── enroll.html           # Device enrollment landing page
│   ├── style.css             # Global shared styles
│   ├── css/                  # Additional stylesheets
│   ├── js/                   # Frontend JS modules
│   └── src/                  # Assets / images
│
├── server/                   # Backend (Node.js + Express)
│   ├── server.js             # Express app entry point
│   ├── seed.js               # DB seed script (default admin user)
│   ├── config/
│   │   └── db.js             # JSON file-based database layer
│   ├── db/
│   │   ├── users.json        # User store (bcrypt hashed passwords)
│   │   └── devices.json      # Device store
│   ├── models/
│   │   ├── User.js           # User schema
│   │   └── Device.js         # Device schema (contacts, logs, GPS…)
│   └── routes/
│       ├── auth.js           # Auth API routes
│       └── devices.js        # Device API routes
│
├── agent.js                  # Agent helper script
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/sp-tech-safe.git
cd sp-tech-safe

# 2. Install dependencies
npm install

# 3. Seed the default admin user
node server/seed.js

# 4. Start the server
npm start
```

The app will be running at → **http://localhost:5000**

---

## 🔑 Default Admin Credentials

```
Username: admin
Password: admin123
```

> ⚠️ Change these immediately after first login.

---

## 🌐 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Admin login |
| `POST` | `/register` | Register new admin (requires OTP) |
| `POST` | `/send-phone-otp` | Send OTP to phone number |
| `POST` | `/send-email-otp` | Send OTP to email address |
| `POST` | `/reset-password` | Reset admin password |

### Device Routes — `/api/devices`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all devices |
| `GET` | `/:id` | Get single device |
| `POST` | `/add` | Manually add a device |
| `PUT` | `/:id` | Update device fields |
| `PATCH` | `/:id/push` | Push data into array field (contacts, logs…) |
| `DELETE` | `/:id` | Delete a device |
| `POST` | `/generate-link` | Generate tokenized enrollment link |
| `POST` | `/enroll/:token` | Device submits data via enrollment link |

### Health Check

```
GET /api/health  →  { "status": "ok", "time": "..." }
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory to enable real OTP delivery:

```env
# Server
PORT=5000

# Twilio (Phone OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Nodemailer (Email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

> Without these vars, OTP codes are printed to the server console and also returned in the API response for development/demo purposes.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| Backend | Node.js, Express.js |
| Database | JSON file-based (no MongoDB required) |
| Auth | bcryptjs (password hashing) |
| SMS OTP | Twilio |
| Email OTP | Nodemailer |
| Fonts | Google Fonts — Inter, Space Grotesk |
| Icons | Font Awesome 6.5 |

---

## 🔒 Security Notes

- Passwords are **bcrypt-hashed** with salt rounds of 10
- Enrollment tokens expire after **24 hours**
- Enrollment endpoint is **rate-limited** — 3 attempts per IP per hour
- OTP codes are 6-digit randomly generated numbers
- No sensitive credentials stored in client-side code

---

## 🌍 Deployment (Railway.app — Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "deploy"
git push origin main

# 2. Go to railway.app
# New Project → Deploy from GitHub → Select repo

# 3. Add environment variables in Railway dashboard

# 4. Add Custom Domain:
#    Settings → Domains → Add Custom Domain
#    Copy CNAME → paste in your domain DNS provider
```

---

## 📋 TODO

See [`TODO.md`](./TODO.md) for planned features and known issues.

---

## 📄 License

ISC © SP Tech Safe
```

---

> Built with ❤️ by the SP Tech Safe team
