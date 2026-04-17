// ===== SP TECH SAFE — DEVICE ENROLLMENT SCRIPT =====

const token = new URLSearchParams(window.location.search).get("token");

// ── Step control ─────────────────────────────────────────────────────────────
function activateStep(index, pct) {
  document.querySelectorAll(".step-item").forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i < index)  el.classList.add("done");
    if (i === index) el.classList.add("active");
  });
  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = pct + "%";
}

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = text;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Device info parser from userAgent ────────────────────────────────────────
function parseDevice() {
  const ua = navigator.userAgent;
  let model = "Unknown Device", os = "Unknown OS", name = "Device";

  if (/iPhone/i.test(ua)) {
    const v = (ua.match(/CPU iPhone OS ([\d_]+)/) || [])[1]?.replace(/_/g, ".") || "";
    model = "iPhone"; os = `iOS ${v}`.trim(); name = `iPhone`;
  } else if (/iPad/i.test(ua)) {
    model = "iPad"; os = "iPadOS"; name = "iPad";
  } else if (/Android/i.test(ua)) {
    const osV   = (ua.match(/Android ([\d.]+)/) || [])[1] || "";
    const rawMod = (ua.match(/;\s*([^;)]+)\sBuild\//) || [])[1]?.trim() || "";
    model = rawMod || "Android Device";
    os    = `Android ${osV}`.trim();
    name  = model;
  } else if (/Windows NT/i.test(ua)) {
    const winV = (ua.match(/Windows NT ([\d.]+)/) || [])[1];
    const winMap = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    model = "Windows PC"; os = `Windows ${winMap[winV] || winV || ""}`.trim(); name = "Windows PC";
  } else if (/Macintosh/i.test(ua)) {
    model = "Mac"; os = "macOS"; name = "Mac";
  } else if (/Linux/i.test(ua)) {
    model = "Linux Device"; os = "Linux"; name = "Linux Device";
  }

  return { model, os, name };
}

// ── Battery API ───────────────────────────────────────────────────────────────
async function getBattery() {
  try {
    if (navigator.getBattery) {
      const bat = await navigator.getBattery();
      const pct = Math.round(bat.level * 100);
      const charging = bat.charging ? "⚡ Charging" : "";
      return `${pct}%${charging ? " " + charging : ""}`;
    }
  } catch {}
  return "—";
}

// ── Geolocation ───────────────────────────────────────────────────────────────
function getLocation(timeoutMs = 9000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timer);
        resolve({
          lat:     pos.coords.latitude,
          lng:     pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          address: "GPS Location"
        });
      },
      () => { clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: true, timeout: timeoutMs }
    );
  });
}

// ── Reverse geocode (best-effort) ─────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const cacheBust = Date.now();
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&nocache=${cacheBust}`,
      { 
        headers: { "Accept-Language": "en" },
        cache: "no-cache"
      }
    );
    const d = await r.json();
    return d.display_name?.split(",").slice(0, 3).join(", ") || "Location detected";
  } catch {
    return "Location detected";
  }
}

// ── Show success screen ───────────────────────────────────────────────────────
function showSuccess(info, battery) {
  document.getElementById("enrollProgress").style.display = "none";
  const s = document.getElementById("enrollSuccess");
  s.style.display = "flex";

  document.getElementById("successModel").textContent   = info.model;
  document.getElementById("successOS").textContent      = info.os;
  document.getElementById("successRes").textContent     = `${screen.width} × ${screen.height}`;
  document.getElementById("successLang").textContent    = navigator.language || "—";
  document.getElementById("successTZ").textContent      = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
  document.getElementById("successBattery").textContent = battery || "—";
}

// ── Show error screen ─────────────────────────────────────────────────────────
function showError(msg) {
  document.getElementById("enrollProgress").style.display = "none";
  const e = document.getElementById("enrollError");
  e.style.display = "flex";
  const msgEl = document.getElementById("errorMsg");
  if (msgEl) msgEl.textContent = msg;
}

// ── Main enrollment flow ──────────────────────────────────────────────────────
async function runEnrollment() {
  if (!token) {
    showError("No enrollment token found in URL. Please request a new link from the admin.");
    return;
  }

  // Step 0 — Init
  activateStep(0, 10);
  setStatus("Initializing secure connection...");
  await wait(900);

  // Step 1 — Device info
  activateStep(1, 35);
  setStatus("Reading device information...");
  const deviceInfo = parseDevice();
  const battery    = await getBattery();
  const connection = navigator.connection?.effectiveType ||
                     navigator.connection?.type || "Unknown";
  await wait(1000);

  // Step 2 — Location
  activateStep(2, 60);
  setStatus("Requesting location permission...");
  let location = await getLocation(8000);
  if (location) {
    setStatus("Acquiring GPS coordinates...");
    location.address = await reverseGeocode(location.lat, location.lng);
  } else {
    setStatus("Location skipped (no permission)");
  }
  await wait(600);

  // Step 3 — Send to server
  activateStep(3, 85);
  setStatus("Syncing to dashboard...");

  const payload = {
    name:      deviceInfo.name,
    model:     deviceInfo.model,
    os:        deviceInfo.os,
    battery,
    screenRes: `${screen.width}x${screen.height}`,
    language:  navigator.language    || "—",
    timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
    cores:     navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "—",
    memory:    navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "—",
    connection,
    location
  };

  try {
    const res  = await fetch(`/api/devices/enroll/${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      activateStep(4, 100);   // all done
      setStatus("Device registered successfully ✓");
      await wait(500);
      showSuccess(deviceInfo, battery);
    } else {
      showError(data.msg || "Enrollment failed. The link may be invalid or expired.");
    }
  } catch (err) {
    showError("Connection error. Please check your internet and try again.");
  }
}

// Disable WebRTC for privacy (prevent IP leaks)
if (window.RTCPeerConnection) {
  window.RTCPeerConnection = null;
  window.webkitRTCPeerConnection = null;
  window.mozRTCPeerConnection = null;
}

// Kick off after small load delay
window.addEventListener("load", () => setTimeout(runEnrollment, 700));
