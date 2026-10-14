/**
 * ELECTRORECK — OFFICIAL ELECTRICAL ENGINEERING SOCIETY, NIT KURUKSHETRA
 * Frontend Interactive Logic & State Management
 */

// --- Event Data Store ---
const EVENT_DATA = {
  electrica: {
    title: 'Electrica',
    category: 'Cultural',
    categoryClass: 'bg-electrica-10 text-electrica',
    color: '#eaa943',
    tagline: 'Where circuits meet creativity',
    venue: 'Lecture Hall Complex, NIT Kurukshetra',
    deadline: '07 Nov 2026',
    team: '1–2 members',
    seats: '45 / 50 seats filled (90%)',
    description: `Electrica is the cultural flagship of Electroreck — a high-energy online quiz and talent showcase that tests your electrical engineering knowledge while celebrating creativity. From rapid-fire circuit theory rounds to technical art challenges, Electrica is where left-brain precision meets right-brain expression. Compete against top students across India in an electrifying battle of intellect and imagination.`
  },
  advanza: {
    title: 'Advanza',
    category: 'Technical',
    categoryClass: 'bg-advanza-10 text-advanza',
    color: '#f2c266',
    tagline: 'Engineer the future, advertise the value',
    venue: 'Seminar Hall, Electrical Engineering Block, NIT KKR',
    deadline: '08 Nov 2026',
    team: '2–4 members',
    seats: '52 / 70 seats filled (74%)',
    description: `Advanza challenges participants to combine deep technical knowledge with the art of communication. Teams tackle real-world circuit design and power systems problems, then present their solutions with clarity and impact. It's the intersection of engineering excellence and professional persuasion, judged by veteran faculty and industry innovators.`
  },
  digispark: {
    title: 'Digispark',
    category: 'Technical',
    categoryClass: 'bg-digispark-10 text-digispark',
    color: '#e09b30',
    tagline: 'Logic meets innovation',
    venue: 'Digital Systems Lab, Electrical Block, NIT KKR',
    deadline: '09 Nov 2026',
    team: '1–3 members',
    seats: '38 / 60 seats filled (63.3%)',
    description: `Digispark is the digital engineering battleground of Techspardha. Participants push the boundaries of logic design, FPGA programming, microcontroller interfacing, and digital signal processing. From designing combinational circuits to implementing real-time DSP algorithms, Digispark is where digital innovation ignites.`
  },
  vidhwaan: {
    title: 'Vidhwaan',
    category: 'Research',
    categoryClass: 'bg-vidhwaan-10 text-vidhwaan',
    color: '#c9892f',
    tagline: 'Design the national power grid',
    venue: 'Conference Hall, Admin Block, NIT Kurukshetra',
    deadline: '05 Nov 2026',
    team: '3–5 members',
    seats: '0 / 40 seats filled (Coming Soon)',
    description: `Vidhwaan is the flagship research and presentation event of Electroreck. Participants design a complete National Power System — covering generation, transmission, and distribution. This is not a classroom exercise; it is a rigorous engineering challenge judged by industry professionals and senior faculty from NIT Kurukshetra and partner institutions.`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTheme();
  initCircuitCanvas();
  initStatsCounter();
  initCountdownTimer();
  handleUrlRouting();
  initNavbarAuth();
  loadDatabaseEvents();
});

// --- Navbar Scroll & Active State ---
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('header[id], section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active Section Detection
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        }
      });
    }
  });

  // Mobile Menu Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileNavDrawer');

  mobileBtn.addEventListener('click', () => {
    mobileDrawer.classList.toggle('open');
  });
}

function closeMobileMenu() {
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  mobileDrawer.classList.remove('open');
}

// --- Dark / Light Theme Toggle ---
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const iconSun = document.getElementById('themeIconSun');
  const iconMoon = document.getElementById('themeIconMoon');
  const savedTheme = localStorage.getItem('electroreck-theme') || 'dark';

  applyTheme(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('electroreck-theme', newTheme);
    showToast(`Switched to ${newTheme} mode`);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    } else {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    }
    if (typeof window.renderCircuitCanvas === 'function') {
      window.renderCircuitCanvas();
    }
  }
}

// --- Static Electric Circuit Canvas (Hero Background - No Animations) ---
function initCircuitCanvas() {
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let nodes = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
    createCircuitGrid();
    drawStaticCircuit();
  }

  function createCircuitGrid() {
    nodes = [];
    const spacing = 95;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.32) {
          nodes.push({
            x: c * spacing + (Math.random() - 0.5) * 16,
            y: r * spacing + (Math.random() - 0.5) * 16,
            connections: []
          });
        }
      }
    }

    // Connect nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < spacing * 1.5 && nodes[i].connections.length < 3) {
          nodes[i].connections.push(nodes[j]);
        }
      }
    }
  }

  function drawStaticCircuit() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const traceColor = isLight ? 'rgba(201, 125, 22, 0.08)' : 'rgba(234, 169, 67, 0.07)';
    const nodeColor = isLight ? 'rgba(201, 125, 22, 0.18)' : 'rgba(234, 169, 67, 0.2)';

    // Draw Traces
    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes[i].connections.length; j++) {
        const target = nodes[i].connections[j];
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(target.x, target.y);
      }
    }
    ctx.stroke();

    // Draw Junction Nodes
    ctx.fillStyle = nodeColor;
    for (let i = 0; i < nodes.length; i++) {
      ctx.beginPath();
      ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  window.renderCircuitCanvas = drawStaticCircuit;
  window.addEventListener('resize', resize);
  resize();
}

// --- Stats Counter (Instant Display, No Counting Animation) ---
function initStatsCounter() {
  const counters = document.querySelectorAll('.counter-num');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    if (!isNaN(target)) {
      counter.textContent = target.toLocaleString();
    }
  });
}

// --- Techspardha 2026 Countdown Timer ---
function initCountdownTimer() {
  // Target: Techspardha Opening Day — Nov 8, 2026
  const targetDate = new Date('2026-11-08T09:00:00+05:30').getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      document.getElementById('cdDays').textContent = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMinutes').textContent = '00';
      document.getElementById('cdSeconds').textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    document.getElementById('cdDays').textContent = pad(days);
    document.getElementById('cdHours').textContent = pad(hours);
    document.getElementById('cdMinutes').textContent = pad(minutes);
    document.getElementById('cdSeconds').textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// --- Event Category Filtering ---
function filterEvents(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.event-card');

  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === category);
  });

  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
    }
  });
}

// --- Event Details & Registration Modal ---
function openEventDetails(eventId, defaultTab = 'overview') {
  const event = EVENT_DATA[eventId];
  if (!event) return;

  const modal = document.getElementById('eventModal');
  document.getElementById('modalEventTitle').textContent = event.title;
  document.getElementById('modalEventBadge').textContent = event.category;
  document.getElementById('modalEventBadge').className = `event-cat-badge ${event.categoryClass}`;
  document.getElementById('modalEventDesc').textContent = event.description;
  document.getElementById('modalEventVenue').textContent = event.venue;
  document.getElementById('modalEventDeadline').textContent = event.deadline;
  document.getElementById('modalEventTeam').textContent = event.team;
  document.getElementById('regEventId').value = eventId;

  switchModalTab(defaultTab);
  modal.classList.add('open');
}

function openEventRegister(eventId) {
  window.location.href = `register.html?event=${eventId}`;
}

function closeEventModal() {
  document.getElementById('eventModal').classList.remove('open');
}

function switchModalTab(tab) {
  const overviewTab = document.getElementById('modalTabOverview');
  const registerTab = document.getElementById('modalTabRegister');
  const overviewBtn = document.getElementById('modalTabOverviewBtn');
  const registerBtn = document.getElementById('modalTabRegisterBtn');

  if (tab === 'overview') {
    overviewTab.style.display = 'block';
    registerTab.style.display = 'none';
    overviewBtn.className = 'btn btn-primary';
    registerBtn.className = 'btn btn-outline';
  } else {
    overviewTab.style.display = 'none';
    registerTab.style.display = 'block';
    overviewBtn.className = 'btn btn-outline';
    registerBtn.className = 'btn btn-primary';
  }
}

function handleEventRegisterSubmit(e) {
  e.preventDefault();
  const eventId = document.getElementById('regEventId').value;
  const eventName = EVENT_DATA[eventId] ? EVENT_DATA[eventId].title : 'Event';
  const teamName = document.getElementById('regTeamName').value;

  closeEventModal();
  e.target.reset();
  showToast(`🎉 Registration submitted successfully for "${teamName}" in ${eventName}!`, 'success');
}

// --- Society Induction Navigation ---
function openInductionModal() {
  window.location.href = 'induction.html';
}

function closeInductionModal() {
  const modal = document.getElementById('inductionModal');
  if (modal) modal.classList.remove('open');
}

function handleInductionSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('indName').value;
  closeInductionModal();
  e.target.reset();
  showToast(`⚡ Thank you ${name}! Your induction application has been received.`, 'success');
}

// --- Contact Form Submission ---
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  e.target.reset();
  showToast(`✉️ Message sent successfully! Thank you, ${name}. We'll respond shortly.`, 'success');
}

// --- Gallery Lightbox ---
function openLightbox(src, caption) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImage');
  const cap = document.getElementById('lightboxCaption');

  img.src = src;
  cap.textContent = caption;
  modal.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightboxModal').classList.remove('open');
}

// --- URL Routing / Deep Links Handler ---
// Supports ?event=electrica, ?event=advanza&action=register, ?tab=induction, #events
function handleUrlRouting() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  if (params.get('tab') === 'induction') {
    openInductionModal();
  } else if (params.get('event')) {
    const eventId = params.get('event').toLowerCase();
    const action = params.get('action');
    if (action === 'register') {
      openEventRegister(eventId);
    } else {
      openEventDetails(eventId);
    }
  } else if (hash === '#events') {
    const eventsSec = document.getElementById('events');
    if (eventsSec) {
      setTimeout(() => {
        eventsSec.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }
}

// --- Toast Notification Utility ---
function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// =========================================================================
// BACKEND INTEGRATION: NAVBAR AUTH STATE & DATABASE EVENTS LOADING
// =========================================================================

async function initNavbarAuth() {
  if (!window.Electroreck) return;
  try {
    const profile = await Electroreck.auth.getCurrentProfile();
    const navAuthSlot = document.getElementById('navAuthSlot');
    const mobileMyRegs = document.getElementById('mobileMyRegsLink');
    const mobileAdmin = document.getElementById('mobileAdminLink');

    if (mobileAdmin) mobileAdmin.style.display = 'block';

    if (profile) {
      if (mobileMyRegs) mobileMyRegs.style.display = 'block';

      if (navAuthSlot) {
        navAuthSlot.innerHTML = `
          <a href="admin.html" class="btn btn-outline" style="border-color: rgba(251, 191, 36, 0.45); color: #fbbf24; text-decoration: none; padding: 0.4rem 0.85rem; font-size: 0.825rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap;">👑 Admin Portal</a>
          <a href="my-registrations.html" class="btn btn-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; font-size: 0.825rem; white-space: nowrap;">My Passes</a>
          <button class="btn btn-outline" style="padding: 0.4rem 0.85rem; font-size: 0.825rem; white-space: nowrap;" onclick="handleNavbarSignOut()">Sign Out</button>
        `;
      }
    } else {
      if (mobileMyRegs) mobileMyRegs.style.display = 'none';

      if (navAuthSlot) {
        navAuthSlot.innerHTML = `
          <a href="admin.html" class="btn btn-outline" style="border-color: rgba(251, 191, 36, 0.45); color: #fbbf24; text-decoration: none; padding: 0.4rem 0.85rem; font-size: 0.825rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap;">👑 Admin Portal</a>
          <a href="login.html" class="btn btn-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; font-size: 0.825rem; white-space: nowrap;">Sign In</a>
          <button class="btn btn-primary glow-primary-sm" onclick="openInductionModal()" style="padding: 0.4rem 0.95rem; font-size: 0.825rem; white-space: nowrap;">Join Society</button>
        `;
      }
    }
  } catch (e) {
    console.error('Navbar auth error:', e);
  }
}

async function handleNavbarSignOut() {
  if (window.Electroreck) {
    await Electroreck.auth.signOut();
    window.location.reload();
  }
}

async function loadDatabaseEvents() {
  const container = document.getElementById('eventsGrid');
  if (!container || !window.Electroreck) return;

  try {
    const dbEvents = await Electroreck.events.getAll();
    if (!dbEvents || dbEvents.length === 0) return;

    const eventCardsHtml = dbEvents.map(ev => {
      const slug = ev.slug.toLowerCase();
      const colorVar = `var(--${slug}, var(--primary))`;
      const catLower = ev.category.toLowerCase();
      const pct = Math.min(100, Math.round((ev.seats_filled / ev.max_seats) * 100));

      const teamText = ev.max_team_size > 1
        ? `${ev.min_team_size}–${ev.max_team_size} members`
        : 'Solo participant';

      const deadlineStr = new Date(ev.registration_deadline).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      let statusBadgeHtml = '';
      let registerBtnHtml = '';

      if (ev.computed_status === 'Open') {
        statusBadgeHtml = `
          <span class="badge-status badge-open">
            <span class="pulse-dot" style="background-color: #10b981;"></span>
            Registration Open
          </span>
        `;
        registerBtnHtml = `
          <a href="register.html?event=${ev.slug}" class="btn" style="background-color: ${colorVar}; color: #020202; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
            Register
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </a>
        `;
      } else if (ev.computed_status === 'Full') {
        statusBadgeHtml = `
          <span class="badge-status badge-full">
            ● Event Full
          </span>
        `;
        registerBtnHtml = `
          <button class="btn" disabled style="opacity: 0.5; cursor: not-allowed; background: rgba(255,255,255,0.1); color: var(--text-muted);">
            Seats Full
          </button>
        `;
      } else {
        statusBadgeHtml = `
          <span class="badge-status badge-closed">
            ● Registration Closed
          </span>
        `;
        registerBtnHtml = `
          <button class="btn" disabled style="opacity: 0.5; cursor: not-allowed; background: rgba(255,255,255,0.1); color: var(--text-muted);">
            Closed
          </button>
        `;
      }

      return `
        <article class="event-card event-${slug}" data-category="${catLower}" id="card-${slug}">
          <div class="event-card-stripe bg-${slug}"></div>
          <div class="event-card-body">
            <div class="event-header">
              <div>
                <span class="event-cat-badge bg-${slug}-10 text-${slug}">${ev.category}</span>
                <h3 class="event-title text-${slug}">${ev.title}</h3>
                <p class="event-tagline">${ev.tagline || ''}</p>
              </div>
              ${statusBadgeHtml}
            </div>

            <p class="event-desc">
              ${ev.description}
            </p>

            <div class="event-meta-list">
              <div class="event-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${ev.venue}</span>
              </div>
              <div class="event-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                <span>Deadline: ${deadlineStr}</span>
              </div>
              <div class="event-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Team: ${teamText}</span>
              </div>
              <div class="event-meta-item" style="justify-content: space-between;">
                <span style="color: ${colorVar}; font-weight: 600;">${ev.seats_filled} / ${ev.max_seats}</span>
                <span>Seats filled (${pct}%)</span>
              </div>
            </div>

            <div class="event-progress-wrap">
              <div class="event-progress-bar">
                <div class="event-progress-fill" style="width: ${pct}%; background-color: ${colorVar};"></div>
              </div>
            </div>

            <div class="event-actions">
              <button class="btn btn-outline" style="border-color: ${colorVar}; color: ${colorVar};" onclick="openEventDetails('${slug}')">
                View Details
              </button>
              ${registerBtnHtml}
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = eventCardsHtml;
  } catch (err) {
    console.warn('Could not load events from database:', err);
  }
}

