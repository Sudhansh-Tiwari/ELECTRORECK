/**
 * ELECTRORECK — OFFICIAL ELECTRICAL ENGINEERING SOCIETY, NIT KURUKSHETRA
 * Frontend Interactive Logic & Micro-Animations
 */

// --- Event Data Store ---
const EVENT_DATA = {
  electrica: {
    title: 'Electrica',
    category: 'Cultural',
    categoryClass: 'bg-electrica-10 text-electrica',
    color: '#f59e0b',
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
    color: '#06b6d4',
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
    color: '#10b981',
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
    color: '#8b5cf6',
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
  }
}

// --- Interactive Electric Circuit Canvas (Hero Background) ---
function initCircuitCanvas() {
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let nodes = [];
  let pulses = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
    createCircuitGrid();
  }

  function createCircuitGrid() {
    nodes = [];
    pulses = [];
    const spacing = 90;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Randomly include ~35% of grid points as circuit junctions
        if (Math.random() < 0.35) {
          nodes.push({
            x: c * spacing + (Math.random() - 0.5) * 20,
            y: r * spacing + (Math.random() - 0.5) * 20,
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
        if (dist < spacing * 1.6 && nodes[i].connections.length < 3) {
          nodes[i].connections.push(nodes[j]);
        }
      }
    }

    // Spawn initial electric pulses
    for (let p = 0; p < 12; p++) {
      spawnPulse();
    }
  }

  function spawnPulse() {
    if (nodes.length === 0) return;
    const startNode = nodes[Math.floor(Math.random() * nodes.length)];
    if (startNode.connections.length > 0) {
      const endNode = startNode.connections[Math.floor(Math.random() * startNode.connections.length)];
      pulses.push({
        start: startNode,
        end: endNode,
        progress: 0,
        speed: 0.006 + Math.random() * 0.012,
        color: Math.random() > 0.4 ? '#00d4ff' : '#f59e0b'
      });
    }
  }

  window.addEventListener('resize', resize);
  resize();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const traceColor = isLight ? 'rgba(0, 160, 220, 0.07)' : 'rgba(0, 212, 255, 0.06)';
    const nodeColor = isLight ? 'rgba(0, 160, 220, 0.15)' : 'rgba(0, 212, 255, 0.18)';

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
      ctx.arc(nodes[i].x, nodes[i].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animate Electric Pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        pulses.splice(i, 1);
        spawnPulse();
        continue;
      }

      const px = p.start.x + (p.end.x - p.start.x) * p.progress;
      const py = p.start.y + (p.end.y - p.start.y) * p.progress;

      // Glow pulse head
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// --- Animated Stats Counter ---
function initStatsCounter() {
  const counters = document.querySelectorAll('.counter-num');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-target'), 10);
          const duration = 1600;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              counter.textContent = target.toLocaleString();
              clearInterval(timer);
            } else {
              counter.textContent = Math.floor(current).toLocaleString();
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats');
  if (statsSection) {
    observer.observe(statsSection);
  }
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
  openEventDetails(eventId, 'register');
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

// --- Society Induction Modal ---
function openInductionModal() {
  document.getElementById('inductionModal').classList.add('open');
}

function closeInductionModal() {
  document.getElementById('inductionModal').classList.remove('open');
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
        eventsSec.scrollIntoView({ behavior: 'smooth' });
      }, 300);
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
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}
