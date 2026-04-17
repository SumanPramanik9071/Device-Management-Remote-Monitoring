/**
 * SP Tech Safe — Simulated Device Agent
 * Run this script to simulate a device pushing data to the dashboard backend.
 * Usage: node agent.js
 */

const http = require("http");

const API_SERVER = "http://localhost:5000";
let deviceId = null;

// 1. Initial Device Registration Payload
const deviceProfile = {
  imei: "359" + Math.floor(Math.random() * 1000000000000),
  name: "Target_Samsung_S22",
  phone: "+1 (555) " + Math.floor(1000 + Math.random() * 9000),
  email: "target@spymail.com",
  model: "SM-S901U",
  os: "Android 14",
  battery: "84%",
  ip: "192.168.1.104",
  lastOnline: new Date().toLocaleTimeString()
};

// 2. Register Device on Server
console.log("🚀 Agent Starting...");
async function registerDevice() {
  try {
    const res = await fetch(`${API_SERVER}/api/devices/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceProfile)
    });
    const data = await res.json();
    deviceId = data.device._id;
    console.log(`✅ Device Registered successfully! ID: ${deviceId}`);
    
    // Start Data Sync Loop
    setInterval(syncData, 5000);
  } catch (err) {
    console.error("❌ Failed to register device. Is the server running?");
  }
}

// 3. Helper to Push Data 
async function pushData(field, payload) {
  if (!deviceId) return;
  try {
    const res = await fetch(`${API_SERVER}/api/devices/${deviceId}/push`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, data: payload })
    });
    if (res.ok) console.log(`📡 Pushed new [${field}] record.`);
  } catch (err) {
    console.error(`❌ Failed to push to [${field}]`);
  }
}

// 4. Simulated Data Payloads
const randomNetworks = ["Home_5GHz", "Starbucks WiFi", "Airport_Free", "NETGEAR-60", "Hilton_Honors"];
function syncData() {
  console.log("🔄 Syncing data...");
  
  // Randomly send a new Wi-Fi log
  pushData("wifiLogs", {
    ssid: randomNetworks[Math.floor(Math.random() * randomNetworks.length)],
    bssid: "00:1A:2B:3C:" + Math.floor(Math.random()*99) + ":FF",
    signal: "-" + Math.floor(Math.random() * 90 + 30) + " dBm",
    date: new Date().toLocaleString()
  });

  // Randomly send a keylog
  const sampleKeys = ["Hello how are you?", "my password is pass123", "where are you going?", "delete this message"];
  pushData("keylogs", {
    app: "WhatsApp",
    text: sampleKeys[Math.floor(Math.random() * sampleKeys.length)],
    date: new Date().toLocaleString()
  });

  // Update battery random life
  const newBat = Math.floor(10 + Math.random() * 90) + "%";
  fetch(`${API_SERVER}/api/devices/${deviceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ battery: newBat, lastOnline: new Date().toLocaleTimeString() })
  }).catch(() => {});
}

// Start Agent Process
registerDevice();
