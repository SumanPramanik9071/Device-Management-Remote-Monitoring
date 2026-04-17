// ===== SP TECH SAFE — LOGIN LOGIC =====

// ── Particle Canvas Background ────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r = Math.random() * 1.8 + 0.6;
    this.hue = Math.random() > 0.5 ? "61,232,212" : "99,102,241";
  }

  Particle.prototype.update = function () {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
    if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
  };

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 12000), 100);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(61,232,212,${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    // Dots
    particles.forEach(p => {
      p.update();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},0.7)`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); initParticles(); });
  resize();
  initParticles();
  draw();
})();

// ── Forgot Password ───────────────────────────────────────────────────────────
let _fpOtpCode = "";
let _fpUsername = "";
let _fpTimer = null;

function openForgotPassword() {
  fpGoStep(1);
  document.getElementById("fpOverlay").classList.add("open");
  setTimeout(() => { const el = document.getElementById("fpUsername"); if (el) el.focus(); }, 300);
}

function closeForgotPassword() {
  document.getElementById("fpOverlay").classList.remove("open");
  clearInterval(_fpTimer);
  // Reset
  ["fpUsername", "fpNewPass", "fpConfirmPass", "fpOtp1", "fpOtp2", "fpOtp3", "fpOtp4"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

function handleFpOverlayClick(e) {
  if (e.target === document.getElementById("fpOverlay")) closeForgotPassword();
}

function fpGoStep(n) {
  document.querySelectorAll(".fp-step").forEach(el => el.classList.remove("active"));
  const step = document.getElementById("fp-step".replace("fp-step", "fpStep") || "fpStep" + n);
  if (step) step.classList.add("active");
  // Fallback
  const el = document.getElementById("fpStep" + n);
  if (el) el.classList.add("active");

  const titles = ["", "Reset Password", "Enter Reset Code", "Create New Password", "All Done!"];
  const subs = ["",
    "Enter your admin username to receive a reset code",
    "A 4-digit code was generated — check console in demo mode",
    "Choose a strong new password for your account",
    "Your password has been updated successfully"
  ];
  const titleEl = document.getElementById("fpTitle");
  const subEl = document.getElementById("fpSub");
  if (titleEl) titleEl.textContent = titles[n];
  if (subEl) subEl.textContent = subs[n];
}

function fpSendCode() {
  const username = (document.getElementById("fpUsername")?.value || "").trim();
  if (!username) { showToast("Please enter your username"); return; }

  _fpUsername = username;
  _fpOtpCode = String(Math.floor(1000 + Math.random() * 9000));

  // In a real app this would POST to /api/auth/forgot-password
  // Demo: log to console and show in timer area
  console.info(`[SP Tech Safe] Reset code for "${username}": ${_fpOtpCode}`);

  // Show the code on screen briefly (demo mode only — remove in production)
  const countdown = document.getElementById("fpCountdown");
  fpGoStep(2);
  if (countdown) countdown.setAttribute("data-code", _fpOtpCode);

  // Easter egg: show code in toast as demo hint
  showToast(`Demo code: ${_fpOtpCode} (check console)`, "success");

  // 2 min countdown
  let secs = 120;
  clearInterval(_fpTimer);
  function tick() {
    secs--;
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    if (countdown) countdown.textContent = `${m}:${s}`;
    if (secs <= 0) { clearInterval(_fpTimer); if (countdown) countdown.textContent = "Expired"; }
  }
  _fpTimer = setInterval(tick, 1000);
}

function fpOtpNav(input, prev, next) {
  if (input.value && next) next.focus();
  if (!input.value && prev) { /* handled by keydown */ }
  input.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !input.value && prev) prev.focus();
  }, { once: true });
}

function fpVerifyOtp() {
  const entered = ["fpOtp1", "fpOtp2", "fpOtp3", "fpOtp4"]
    .map(id => document.getElementById(id)?.value || "").join("");

  if (entered.length < 4) { showToast("Enter all 4 digits"); return; }
  if (entered !== _fpOtpCode) { showToast("Incorrect code. Try again."); return; }

  clearInterval(_fpTimer);
  fpGoStep(3);
  setTimeout(() => { document.getElementById("fpNewPass")?.focus(); }, 200);
}

async function fpResetPassword() {
  const newPass = document.getElementById("fpNewPass")?.value || "";
  const confirmPass = document.getElementById("fpConfirmPass")?.value || "";

  if (newPass.length < 6) { showToast("Password must be at least 6 characters"); return; }
  if (newPass !== confirmPass) { showToast("Passwords do not match"); return; }

  const btn = document.getElementById("btnFpReset");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...'; }

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: _fpUsername, newPassword: newPass })
    });
    const data = await res.json();

    if (res.ok) {
      fpGoStep(4);
    } else {
      showToast(data.msg || "Reset failed");
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Reset Password'; }
    }
  } catch {
    showToast("Server error. Please try again.");
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Reset Password'; }
  }
}


function togglePassword() {
  const passInput = document.getElementById("pass");
  const eyeIcon = document.getElementById("eyeIcon");

  if (passInput.type === "password") {
    passInput.type = "text";
    eyeIcon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    passInput.type = "password";
    eyeIcon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

let currentCaptchaCode = "";

function refreshCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  currentCaptchaCode = code;
  const box = document.getElementById("captchaCodeText");
  if (box) box.textContent = code;
}

function showToast(message, type = "error") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "login-toast show" + (type === "success" ? " success" : "");

  setTimeout(() => {
    toast.className = "login-toast";
  }, 3000);
}

async function handleLogin(e) {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;
  const captcha = document.getElementById("captchaInput").value.trim().toUpperCase();

  if (!username || !password || !captcha) {
    showToast("Please fill in all fields (username, password, capture code)");
    return false;
  }

  if (captcha !== currentCaptchaCode) {
    showToast("Invalid capture code!");
    refreshCaptcha();
    return false;
  }

  // Show loading state
  btn.classList.add("loading");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.msg === "Login success") {
      localStorage.setItem("token", "true");
      localStorage.setItem("admin", "true");
      localStorage.setItem("adminName", data.username);

      const remember = document.getElementById("remember");
      if (remember && remember.checked) {
        localStorage.setItem("rememberedUser", username);
      } else {
        localStorage.removeItem("rememberedUser");
      }

      showToast("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);

    } else {
      showToast(data.msg || "Invalid credentials");
      btn.classList.remove("loading");
    }

  } catch (err) {
    showToast("Server unreachable. Please try again.");
    btn.classList.remove("loading");
  }

  return false;
}

// Auto-redirect if already logged in + boot animations
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("admin") === "true") {
    window.location.href = "dashboard.html";
  }

  const rememberedUser = localStorage.getItem("rememberedUser");
  const user = document.getElementById("user");
  const remember = document.getElementById("remember");

  if (rememberedUser && user && remember) {
    user.value = rememberedUser;
    remember.checked = true;
    setTimeout(() => {
      user.dispatchEvent(new Event("input"));
    }, 100);
  }

  refreshCaptcha();
  animateCounters();
  setupInlineValidation();
});

// ── Animate left-panel stat counters ─────────────────────────────────────────
function animateCounters() {
  const configs = [
    { id: "statDevices", target: 847, suffix: "", decimals: 0, duration: 1800 },
    { id: "statLogs", target: 12.4, suffix: "k", decimals: 1, duration: 2200 },
    { id: "statUptime", target: 99.9, suffix: "%", decimals: 1, duration: 1600 }
  ];

  configs.forEach(({ id, target, suffix, decimals, duration }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const value = target * easeOut(elapsed);
      el.textContent = value.toFixed(decimals) + suffix;
      if (elapsed < 1) requestAnimationFrame(tick);
    }
    // Small delay so the panel fade-in is visible first
    setTimeout(() => requestAnimationFrame(tick), 500);
  });
}

// ── Inline username validation ───────────────────────────────────────────────
function setupInlineValidation() {
  const userInput = document.getElementById("user");
  const validIcon = document.getElementById("validUser");
  if (!userInput || !validIcon) return;

  userInput.addEventListener("input", () => {
    if (userInput.value.trim().length >= 3) {
      validIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      validIcon.classList.add("visible");
    } else {
      validIcon.classList.remove("visible");
    }
  });
}
