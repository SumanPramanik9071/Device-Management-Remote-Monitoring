// ===== SP TECH SAFE — REGISTER LOGIC =====

// ── Shared Particle Canvas Background ────────────────────────────────────────
(function() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, parts = [];
  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  function mkP()    { return { x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:Math.random()*1.8+.6, hue:Math.random()>.5?"61,232,212":"99,102,241" }; }
  function init()   { parts=[]; const n=Math.min(Math.floor(W*H/12000),100); for(let i=0;i<n;i++) parts.push(mkP()); }
  function draw()   {
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<parts.length;i++) for(let j=i+1;j<parts.length;j++) {
      const dx=parts[i].x-parts[j].x, dy=parts[i].y-parts[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<130){ ctx.beginPath(); ctx.strokeStyle=`rgba(61,232,212,${.12*(1-d/130)})`; ctx.lineWidth=.5; ctx.moveTo(parts[i].x,parts[i].y); ctx.lineTo(parts[j].x,parts[j].y); ctx.stroke(); }
    }
    parts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(${p.hue},.7)`; ctx.fill(); });
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", () => { resize(); init(); });
  resize(); init(); draw();
})();


function showToast(message, type = "error") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "login-toast show" + (type === "success" ? " success" : "");

  setTimeout(() => {
    toast.className = "login-toast";
  }, 3000);
}

async function handleRegister(e) {
  e.preventDefault();

  const btn = document.getElementById("regBtn");
  const username = document.getElementById("regUser").value.trim();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const phoneOtp = document.getElementById("regPhoneOtp").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const emailOtp = document.getElementById("regEmailOtp").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPass = document.getElementById("regPassConfirm").value;

  if (!username || !name || !phone || !phoneOtp || !email || !emailOtp || !password || !confirmPass) {
    showToast("Please fill in all fields");
    return false;
  }

  if (password !== confirmPass) {
    showToast("Passwords do not match!");
    return false;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters long.");
    return false;
  }

  // Show loading state
  btn.classList.add("loading");

  try {
    const payload = {
      username,
      name,
      phone,
      phoneOtp,
      email,
      emailOtp,
      password
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Account created successfully! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "index.html"; // Go back to login
      }, 1500);

    } else {
      showToast(data.msg || "Registration failed");
      btn.classList.remove("loading");
    }

  } catch (err) {
    showToast("Server unreachable. Please try again.");
    btn.classList.remove("loading");
  }

  return false;
}

// ── Shared Toggle Password Function ──────────────────────────────────────────
function toggleRegPassword(inputId, iconId) {
  const passInput = document.getElementById(inputId);
  const eyeIcon = document.getElementById(iconId);
  if (!passInput || !eyeIcon) return;

  if (passInput.type === "password") {
    passInput.type = "text";
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash");
  } else {
    passInput.type = "password";
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye");
  }
}

// ── Get OTP Handlers ─────────────────────────────────────────────────────────
async function getPhoneOtp() {
  const phoneInput = document.getElementById("regPhone");
  if (!phoneInput || !phoneInput.value.trim()) {
    showToast("Please enter a valid phone number first.");
    return;
  }
  const btn = document.getElementById("btnPhoneOtp");
  btn.innerText = "Sending...";
  btn.disabled = true;
  
  try {
    const res = await fetch("/api/auth/send-phone-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneInput.value.trim() })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // For demo purposes, we still auto-fill if the server returned it, 
      // but the server also just attempted a real Twilio text.
      if (data.otp) {
        document.getElementById("regPhoneOtp").value = data.otp;
      }
      showToast(data.msg || "OTP sent to your phone!", "success");
    } else {
      showToast(data.msg || "Failed to send OTP to phone.", "error");
    }
  } catch (err) {
    showToast("Server error. Could not send OTP.");
  }
  
  setTimeout(() => { btn.innerText = "Get OTP"; btn.disabled = false; }, 30000);
}

async function getEmailOtp() {
  const emailInput = document.getElementById("regEmail");
  if (!emailInput || !emailInput.value.trim() || !emailInput.value.includes("@")) {
    showToast("Please enter a valid email address first.");
    return;
  }
  const btn = document.getElementById("btnEmailOtp");
  btn.innerText = "Sending...";
  btn.disabled = true;
  
  try {
    const res = await fetch("/api/auth/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value.trim() })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      if (data.otp) {
        document.getElementById("regEmailOtp").value = data.otp;
      }
      showToast(data.msg || "OTP sent to your email!", "success");
    } else {
      showToast(data.msg || "Failed to send OTP to email.", "error");
    }
  } catch (err) {
    showToast("Server error. Could not send OTP.");
  }
  
  setTimeout(() => { btn.innerText = "Get OTP"; btn.disabled = false; }, 30000);
}
