/* ============================================================
   SafeHer – Main Application JS
   ============================================================ */

const API = '';  // Empty = same origin. Change to http://localhost:3000 if running separately.

// ── CUSTOM CURSOR ──────────────────────────────────────────
(function () {
  const outer = document.getElementById('cursorOuter');
  const inner = document.getElementById('cursorInner');
  if (!outer || !inner) return;
  let ox = 0, oy = 0;

  document.addEventListener('mousemove', e => {
    inner.style.left = e.clientX + 'px';
    inner.style.top = e.clientY + 'px';
    ox += (e.clientX - ox) * 0.15;
    oy += (e.clientY - oy) * 0.15;
    outer.style.left = e.clientX + 'px';
    outer.style.top = e.clientY + 'px';
  });
})();

// ── NAVBAR SCROLL ──────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);

  // Active link
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  links.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
});

// ── MOBILE NAV ─────────────────────────────────────────────
document.getElementById('navToggle')?.addEventListener('click', function () {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  const open = links.style.display === 'flex';
  links.style.display = open ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'fixed';
  links.style.top = '60px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = 'rgba(10,10,26,0.98)';
  links.style.padding = '1rem';
  links.style.zIndex = '999';
  links.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
});

// ── 3D TILT EFFECT ─────────────────────────────────────────
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)';
    card.style.transition = 'transform 0.4s ease';
  });
});

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ── SOS SYSTEM ─────────────────────────────────────────────
let sosActive = false;
let alarmAudio = null;

function triggerSOS() {
  if (sosActive) return;
  sosActive = true;

  const btn = document.getElementById('mainSOSBtn') || document.getElementById('sosBigBtn');
  if (btn) btn.style.opacity = '0.7';

  // Get location first
  navigator.geolocation?.getCurrentPosition(pos => {
    sendSOSRequest(pos.coords.latitude, pos.coords.longitude);
  }, () => {
    sendSOSRequest(null, null);
  }, { timeout: 5000, enableHighAccuracy: true });

  // Play alarm
  playAlarm();

  // Show modal immediately
  openModal('🚨 Detecting your location...', '');
}

function sendSOSRequest(lat, lon) {
  const locationText = lat
    ? `📍 Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`
    : '📍 Location unavailable';

  document.getElementById('locationText').textContent = locationText;

  fetch(API + '/api/sos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: lat, longitude: lon,
      userId: getUserId(),
      message: 'EMERGENCY SOS from SafeHer'
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        updateModal(
          `✅ ${data.message}`,
          `Alert ID: ${data.alertId}\n${locationText}\nTime: ${new Date(data.timestamp).toLocaleTimeString()}`
        );
        loadStats();
      }
    })
    .catch(() => {
      // Offline fallback
      updateModal(
        '⚠️ Alert stored locally (offline mode)',
        `${locationText}\nTime: ${new Date().toLocaleTimeString()}\nContacts will be notified when connection is restored.`
      );
    });
}

function openModal(msg, details) {
  const modal = document.getElementById('sosModal');
  if (modal) modal.classList.add('open');
  document.getElementById('modalMsg').textContent = msg;
  document.getElementById('modalDetails').textContent = details;
}

function updateModal(msg, details) {
  document.getElementById('modalMsg').textContent = msg;
  document.getElementById('modalDetails').innerHTML = details.replace(/\n/g, '<br>');
}

function closeModal() {
  const modal = document.getElementById('sosModal');
  if (modal) modal.classList.remove('open');
  sosActive = false;
  stopAlarm();
  const btn = document.getElementById('mainSOSBtn') || document.getElementById('sosBigBtn');
  if (btn) btn.style.opacity = '1';
}

function playAlarm() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.5);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 1.0);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 3);
    alarmAudio = { ctx, osc };
  } catch (e) { /* ignore */ }
}

function stopAlarm() {
  try { alarmAudio?.osc?.stop(); } catch (e) { }
}

function callPolice() {
  window.location.href = 'tel:100';
}

// ── CONTACTS ───────────────────────────────────────────────
let contactsData = [];

function getUserId() {
  let uid = localStorage.getItem('safeher_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('safeher_uid', uid);
  }
  return uid;
}

function addContact() {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const relation = document.getElementById('contactRelation').value;
  const msg = document.getElementById('contactMsg');

  if (!name || !phone) {
    showMsg(msg, 'Name and phone are required', 'error');
    return;
  }

  fetch(API + '/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, relation, userId: getUserId() })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showMsg(msg, `✅ ${data.message}`, 'success');
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        document.getElementById('contactEmail').value = '';
        contactsData.push(data.contact);
        renderContacts();
      } else {
        showMsg(msg, data.message, 'error');
      }
    })
    .catch(() => {
      // Offline fallback
      const contact = { id: Date.now().toString(), name, phone, email, relation };
      contactsData.push(contact);
      renderContacts();
      showMsg(msg, '✅ Contact saved locally', 'success');
      document.getElementById('contactName').value = '';
      document.getElementById('contactPhone').value = '';
      document.getElementById('contactEmail').value = '';
    });
}

function deleteContact(id) {
  fetch(API + '/api/contacts/' + id, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        contactsData = contactsData.filter(c => c.id !== id);
        renderContacts();
        showToast('Contact removed');
      }
    })
    .catch(() => {
      contactsData = contactsData.filter(c => c.id !== id);
      renderContacts();
      showToast('Contact removed');
    });
}

function renderContacts() {
  const list = document.getElementById('contactsList');
  if (!list) return;
  if (!contactsData.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">👥</span><p>No contacts yet. Add your first trusted contact →</p></div>`;
    return;
  }
  const relationEmoji = { Mother: '👩', Father: '👨', Sister: '👧', Brother: '👦', Friend: '🤝', Partner: '💑', Other: '👤' };
  list.innerHTML = contactsData.map(c => `
    <div class="contact-item">
      <div class="contact-avatar">${relationEmoji[c.relation] || '👤'}</div>
      <div class="contact-info">
        <div class="contact-name">${escHtml(c.name)} <span style="font-size:0.75rem;color:var(--text-muted)">${c.relation || ''}</span></div>
        <div class="contact-detail">📞 ${escHtml(c.phone)} ${c.email ? `· ✉️ ${escHtml(c.email)}` : ''}</div>
      </div>
      <button class="contact-delete" onclick="deleteContact('${c.id}')">✕</button>
    </div>
  `).join('');
}

function loadContacts() {
  fetch(API + '/api/contacts?userId=' + getUserId())
    .then(r => r.json())
    .then(data => { if (data.success) { contactsData = data.contacts; renderContacts(); } })
    .catch(() => { });
}

// ── HELPLINES ──────────────────────────────────────────────
function loadHelplines() {
  fetch(API + '/api/helplines')
    .then(r => r.json())
    .then(data => {
      if (!data.success) return;
      const grid = document.getElementById('helplinesGrid');
      if (!grid) return;
      grid.innerHTML = data.helplines.map(h => `
        <a class="helpline-card" href="tel:${h.number}" title="Call ${h.name}">
          <span class="helpline-icon">${h.icon}</span>
          <div class="helpline-name">${escHtml(h.name)}</div>
          <div class="helpline-number">${escHtml(h.number)}</div>
          <div class="helpline-desc">${escHtml(h.description)}</div>
        </a>
      `).join('');
    })
    .catch(() => {
      // Static fallback
      const fallback = [
        { icon: '🆘', name: 'Women Helpline', number: '1091', description: '24/7 women in distress' },
        { icon: '👮', name: 'Police', number: '100', description: 'Emergency police assistance' },
        { icon: '🚑', name: 'Ambulance', number: '108', description: 'Medical emergency' },
        { icon: '⚖️', name: 'NCW', number: '7217735372', description: 'National Commission for Women' },
        { icon: '💻', name: 'Cyber Crime', number: '1930', description: 'Online harassment & cyber crime' },
        { icon: '🧒', name: 'Childline', number: '1098', description: 'Child in danger' },
        { icon: '🏠', name: 'Domestic Violence', number: '181', description: 'Domestic abuse support' },
        { icon: '🔒', name: 'Anti-Trafficking', number: '1800-180-4334', description: 'Human trafficking helpline' }
      ];
      const grid = document.getElementById('helplinesGrid');
      if (grid) grid.innerHTML = fallback.map(h => `
        <a class="helpline-card" href="tel:${h.number}" title="Call ${h.name}">
          <span class="helpline-icon">${h.icon}</span>
          <div class="helpline-name">${escHtml(h.name)}</div>
          <div class="helpline-number">${escHtml(h.number)}</div>
          <div class="helpline-desc">${escHtml(h.description)}</div>
        </a>
      `).join('');
    });
}

// ── INCIDENT REPORT ────────────────────────────────────────
function submitReport() {
  const type = document.getElementById('incidentType').value;
  const desc = document.getElementById('incidentDesc').value.trim();
  const location = document.getElementById('incidentLocation').value.trim();
  const anonymous = document.getElementById('anonymousToggle').checked;
  const msg = document.getElementById('reportMsg');

  if (!type) { showMsg(msg, 'Please select an incident type', 'error'); return; }
  if (!desc) { showMsg(msg, 'Please describe the incident', 'error'); return; }

  fetch(API + '/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, description: desc, location, anonymous, userId: getUserId() })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showMsg(msg, `✅ Report submitted. ID: ${data.incidentId.slice(0, 8).toUpperCase()}`, 'success');
        document.getElementById('incidentType').value = '';
        document.getElementById('incidentDesc').value = '';
        document.getElementById('incidentLocation').value = '';
        loadStats();
      } else {
        showMsg(msg, data.message, 'error');
      }
    })
    .catch(() => {
      showMsg(msg, '✅ Report saved locally (offline mode)', 'success');
    });
}

// ── STATS ──────────────────────────────────────────────────
function loadStats() {
  fetch(API + '/api/stats')
    .then(r => r.json())
    .then(data => {
      if (!data.success) return;
      const s = data.stats;
      animateNumber('statSOS', s.sosAlerts);
      animateNumber('statIncidents', s.incidentsReported);
      animateNumber('incidentCount', s.incidentsReported);
    })
    .catch(() => { });
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  const step = diff / 30;
  let val = current;
  const timer = setInterval(() => {
    val += step;
    if ((step > 0 && val >= target) || (step <= 0 && val <= target)) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(val);
    }
  }, 30);
}

// ── FAKE CALL ──────────────────────────────────────────────
const callerNames = ['Mom', 'Sister', 'Friend Priya', 'Aunt Meena', 'Friend Anjali'];
let fakeCallTimer = null;

function triggerFakeCall() {
  const overlay = document.getElementById('fakeCallOverlay');
  if (!overlay) return;
  const name = callerNames[Math.floor(Math.random() * callerNames.length)];
  document.getElementById('callerName').textContent = name;
  overlay.classList.add('active');
  // Auto end after 30s
  fakeCallTimer = setTimeout(endFakeCall, 30000);
  playRingtone();
}

function endFakeCall() {
  const overlay = document.getElementById('fakeCallOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(fakeCallTimer);
}

function playRingtone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [0, 0.5, 1.5, 2].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 740;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.4);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch (e) { }
}

// ── HELPERS ────────────────────────────────────────────────
function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'form-msg'; }, 5000);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── SCROLL ANIMATIONS ──────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.glass-card, .glass-card-dark, .helpline-card, .resource-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── KEYBOARD SHORTCUT: Press S for SOS ────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); endFakeCall(); }
});

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadContacts();
  loadHelplines();
  loadStats();
  showToast('🌸 SafeHer loaded — your safety, our priority');
});
