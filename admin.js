/**
 * ELECTRORECK — ADMIN PORTAL JAVASCRIPT
 * Role-based admin portal with full CRUD, approve/reject workflow,
 * detail drawers, bulk actions, activity log, and toast notifications.
 *
 * Roles: admin (Super Admin) | coordinator (Organizer) | student (blocked)
 * Status flow: Pending → Approved | Rejected (event regs & society apps)
 */

'use strict';

/* =========================================================================
   STATE
   ========================================================================= */
let currentAdminProfile = null;
let allEvents            = [];
let allEventRequests     = [];
let allSocietyApps       = [];
let allWings             = [];
let activityLog          = [];

// UI State
let pendingRejectTarget  = null;   // { type: 'event'|'society', id, isBulk, ids }
let pendingConfirmCb     = null;   // generic confirm callback

/* =========================================================================
   INIT
   ========================================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  // Check if active admin session exists in isolated storage
  const adminSession = (window.Electroreck && window.Electroreck.adminAuth) ? window.Electroreck.adminAuth.getSession() : null;
  
  if (adminSession && adminSession.profile) {
    currentAdminProfile = adminSession.profile;
    showPortalView();
  } else {
    showLoginView();
  }
});

function showLoginView() {
  const loginGate = document.getElementById('loginGateway');
  const portal = document.getElementById('adminPortal');
  const bottomNav = document.getElementById('bottomMobileNav');
  if (loginGate) loginGate.style.display = 'flex';
  if (portal) portal.style.display = 'none';
  if (bottomNav) bottomNav.style.display = 'none';
}

function showPortalView() {
  const loginGate = document.getElementById('loginGateway');
  const portal = document.getElementById('adminPortal');
  const bottomNav = document.getElementById('bottomMobileNav');
  if (loginGate) loginGate.style.display = 'none';
  if (portal) portal.style.display = 'flex';
  if (bottomNav) bottomNav.style.display = window.innerWidth <= 900 ? 'grid' : 'none';

  initPortal();
}

window.addEventListener('resize', () => {
  const bottomNav = document.getElementById('bottomMobileNav');
  const portal = document.getElementById('adminPortal');
  if (bottomNav && portal && portal.style.display !== 'none') {
    bottomNav.style.display = window.innerWidth <= 900 ? 'grid' : 'none';
  }
});

function selectRolePreset(chip) {
  document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const email = chip.getAttribute('data-email');
  const pass = chip.getAttribute('data-pass');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput && email) emailInput.value = email;
  if (passInput && pass) passInput.value = pass;
  const errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.style.display = 'none';
}

function initPortal() {
  const portal = document.getElementById('adminPortal');
  if (portal) portal.style.display = 'flex';
  const bottomNav = document.getElementById('bottomMobileNav');
  if (bottomNav) bottomNav.style.display = window.innerWidth <= 900 ? 'grid' : 'none';

  if (!currentAdminProfile) {
    const adminSession = window.Electroreck && window.Electroreck.adminAuth && window.Electroreck.adminAuth.getSession();
    if (adminSession && adminSession.profile) {
      currentAdminProfile = adminSession.profile;
    } else {
      showLoginView();
      return;
    }
  }

  // Populate user info
  const name  = currentAdminProfile.full_name || currentAdminProfile.name || 'Administrator';
  const email = currentAdminProfile.email || '';
  const role  = currentAdminProfile.role;
  const roleName = currentAdminProfile.roleName || (role === 'admin' ? '👑 Super Admin' : '⚡ Organizer');

  const nameEl = document.getElementById('sidebarUserName');
  const emailEl = document.getElementById('topbarEmail');
  const avatarEl = document.getElementById('sidebarAvatar');
  const sidebarRoleEl = document.getElementById('sidebarUserRole');
  const topbarRoleEl = document.getElementById('topbarRoleBadge');

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  if (sidebarRoleEl) sidebarRoleEl.textContent = roleName;
  if (topbarRoleEl) topbarRoleEl.textContent = roleName;

  // Show Activity Log & Create Event only for super admin
  const navActivity = document.getElementById('nav-activity');
  const createEventBtn = document.getElementById('createEventBtn');
  if (role === 'admin') {
    if (navActivity) navActivity.style.display = 'flex';
    if (createEventBtn) createEventBtn.style.display = 'flex';
  } else {
    if (navActivity) navActivity.style.display = 'none';
    if (createEventBtn) createEventBtn.style.display = 'none';
  }

  // Hide society page for coordinators (view-only limited scope)
  const navSociety = document.getElementById('nav-society-requests');
  if (role === 'coordinator') {
    if (navSociety) navSociety.style.display = 'none';
  } else {
    if (navSociety) navSociety.style.display = 'flex';
  }

  refreshAllData();
}

/* =========================================================================
   LOGIN
   ========================================================================= */
async function handleAdminLogin(e) {
  e.preventDefault();
  const btn       = document.getElementById('loginSubmitBtn');
  const errorEl   = document.getElementById('loginError');
  const email     = document.getElementById('loginEmail').value.trim();
  const password  = document.getElementById('loginPassword').value;

  btn.disabled    = true;
  btn.innerHTML   = `<span>Verifying credentials...</span>`;
  errorEl.style.display = 'none';

  try {
    if (!window.Electroreck || !window.Electroreck.adminAuth) {
      throw new Error('Electroreck Authentication subsystem not loaded.');
    }

    const adminSession = await window.Electroreck.adminAuth.login(email, password);
    currentAdminProfile = adminSession.profile;
    showPortalView();

  } catch (err) {
    errorEl.textContent = err.message || 'Restricted Access Denied: Invalid Credentials';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.innerHTML   = `<span>Verify Credentials & Enter Console</span> <span>→</span>`;
  }
}

function toggleLoginPassword() {
  const input = document.getElementById('loginPassword');
  const icon  = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

async function handleLogout() {
  if (window.Electroreck && window.Electroreck.adminAuth) {
    window.Electroreck.adminAuth.logout();
  }
  currentAdminProfile = null;
  showLoginView();
}

/* =========================================================================
   NAVIGATION
   ========================================================================= */
function navigateTo(page) {
  const pages = ['dashboard', 'event-requests', 'society-requests', 'events', 'activity'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = (p === page) ? 'block' : 'none';
  });

  // Update sidebar active states
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Update mobile nav active states
  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Update topbar title
  const titles = {
    'dashboard':        'Dashboard',
    'event-requests':   'Event Requests',
    'society-requests': 'Society Applications',
    'events':           'Events Management',
    'activity':         'Activity Log'
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;

  // Close mobile sidebar
  closeSidebar();
}

function openSidebar() {
  document.getElementById('adminSidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('adminSidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* =========================================================================
   DATA REFRESH
   ========================================================================= */
async function refreshAllData() {
  const btn = document.getElementById('refreshBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="loading-spinner" style="width:14px;height:14px;"></div> Refreshing`; }

  try {
    allEvents = await Electroreck.events.getAll();
    allEventRequests = await ElectroreckAdmin.eventRequests.getAll();

    if (currentAdminProfile.role === 'admin') {
      allSocietyApps = await ElectroreckAdmin.societyApps.getAll();
      allWings       = await Electroreck.wings.getAll(true);
      activityLog    = ElectroreckAdmin.activity.getAll();
    }

    renderDashboard();
    renderEventRequests();
    renderSocietyRequests();
    renderEventsAdmin();
    renderActivityLog();
    updateBadges();

  } catch (err) {
    console.error('Data refresh error:', err);
    showToast(err.message || 'Failed to load data', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Refresh`; }
  }
}

function updateBadges() {
  const pendingEvents   = allEventRequests.filter(r => r.status === 'Pending').length;
  const pendingSociety  = allSocietyApps.filter(a => a.status === 'Pending').length;

  const erBadge = document.getElementById('eventReqBadge');
  const srBadge = document.getElementById('societyReqBadge');

  erBadge.style.display = pendingEvents  > 0 ? 'inline' : 'none';
  srBadge.style.display = pendingSociety > 0 ? 'inline' : 'none';

  erBadge.textContent = pendingEvents;
  srBadge.textContent = pendingSociety;
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */
function renderDashboard() {
  const pendingEvents  = allEventRequests.filter(r => r.status === 'Pending').length;
  const pendingSociety = allSocietyApps.filter(a => a.status === 'Pending').length;
  const activeEvents   = allEvents.filter(e => e.is_registration_open).length;
  const approved       = allEventRequests.filter(r => r.status === 'Approved').length;

  setEl('statPendingEvents',  pendingEvents);
  setEl('statPendingSociety', currentAdminProfile.role === 'admin' ? pendingSociety : '—');
  setEl('statActiveEvents',   activeEvents);
  setEl('statApproved',       approved);

  renderNeedsAction();
  renderRecentActivity();
}

function renderNeedsAction() {
  const container = document.getElementById('needsActionList');
  const countEl   = document.getElementById('needsActionCount');

  // Combine pending event reqs + pending society apps, sort oldest first
  let items = [
    ...allEventRequests
      .filter(r => r.status === 'Pending')
      .map(r => ({
        id:     r.id,
        type:   'event',
        title:  r.team_name ? `Team "${r.team_name}"` : r.full_name || r.leader_name,
        sub:    `${(r.event && r.event.title) || 'Event'} · ${r.college || r.department || ''}`,
        time:   r.created_at
      })),
    ...allSocietyApps
      .filter(a => a.status === 'Pending')
      .map(a => ({
        id:     a.id,
        type:   'society',
        title:  a.full_name,
        sub:    `${(a.wing && a.wing.name) || 'Unknown Wing'} · ${a.year_of_study || ''}`,
        time:   a.created_at
      }))
  ].sort((a, b) => new Date(a.time) - new Date(b.time));

  countEl.textContent = items.length || '';
  countEl.style.display = items.length ? 'inline-flex' : 'none';

  if (!items.length) {
    container.innerHTML = `<div class="loading-state" style="color:var(--text-subtle);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      All caught up! No pending requests.
    </div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="needs-action-item" onclick="${item.type === 'event' ? `openERDrawer('${item.id}')` : `openSRDrawer('${item.id}')`}">
      <div class="needs-action-info">
        <h4>${escHtml(item.title)}</h4>
        <p>${escHtml(item.sub)}</p>
      </div>
      <div class="needs-action-meta">
        <span class="needs-action-time">${timeAgo(item.time)}</span>
        <span class="status-tag status-pending">Pending</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  `).join('');
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivityList');
  const log       = activityLog.slice(0, 10);

  if (!log.length) {
    container.innerHTML = `<div class="loading-state" style="padding:1.5rem;">No activity recorded yet.</div>`;
    return;
  }

  container.innerHTML = log.map(entry => {
    const dotClass = entry.action === 'approved' ? 'approved' :
                     entry.action === 'rejected'  ? 'rejected' :
                     entry.action === 'created'   ? 'created'  : 'pending';
    return `
      <div class="activity-item">
        <div class="activity-dot ${dotClass}"></div>
        <div>
          <div class="activity-text">${escHtml(entry.description)}</div>
          <span class="activity-time">${timeAgo(entry.timestamp)}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================================================================
   EVENT REQUESTS PAGE
   ========================================================================= */
function renderEventRequests() {
  // Populate event filter
  const select = document.getElementById('erEventFilter');
  const current = select.value;
  select.innerHTML = '<option value="all">All Events</option>';
  allEvents.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = `${ev.title} (${ev.category})`;
    if (opt.value === current) opt.selected = true;
    select.appendChild(opt);
  });

  filterEventRequests();
}

function filterEventRequests() {
  const search     = (document.getElementById('erSearch').value || '').toLowerCase().trim();
  const eventId    = document.getElementById('erEventFilter').value;
  const status     = document.getElementById('erStatusFilter').value;

  let filtered = allEventRequests;

  if (eventId !== 'all')   filtered = filtered.filter(r => r.event_id === eventId);
  if (status  !== 'all')   filtered = filtered.filter(r => r.status   === status);
  if (search) {
    filtered = filtered.filter(r =>
      searchIn(r.full_name, search) ||
      searchIn(r.leader_name, search) ||
      searchIn(r.team_name, search) ||
      searchIn(r.pass_id, search) ||
      searchIn(r.college, search) ||
      searchIn(r.phone, search) ||
      searchIn(r.email, search)
    );
  }

  renderERTable(filtered);
}

function renderERTable(list) {
  const tbody  = document.getElementById('erTableBody');
  const footer = document.getElementById('erTableFooter');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No requests match the current filters.</td></tr>`;
    footer.textContent = '';
    return;
  }

  tbody.innerHTML = list.map(reg => {
    const evName = reg.event ? reg.event.title : 'Unknown Event';
    const leader = reg.leader_name || reg.full_name || '—';
    const team   = reg.team_name || null;

    return `
      <tr data-id="${reg.id}">
        <td class="th-check"><input type="checkbox" class="er-checkbox" value="${reg.id}" onchange="updateERBulk()"></td>
        <td><span class="pass-id-chip">${escHtml(reg.pass_id || '—')}</span></td>
        <td>
          <strong style="font-size:0.875rem;">${escHtml(team ? `Team "${team}"` : leader)}</strong><br>
          <span style="font-size:0.775rem;color:var(--text-muted);">${escHtml(leader)} · ${escHtml(reg.college || reg.department || '—')}</span>
        </td>
        <td><span style="font-size:0.85rem;">${escHtml(evName)}</span></td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${escHtml(reg.college || reg.department || '—')}</td>
        <td style="font-family:var(--font-mono);font-size:0.8rem;">${escHtml(reg.phone || '—')}</td>
        <td style="font-size:0.775rem;color:var(--text-muted);white-space:nowrap;">${fmtDate(reg.created_at)}</td>
        <td>${statusTag(reg.status)}</td>
        <td>
          <div class="action-btns">
            <button class="icon-btn view" title="View Details" onclick="openERDrawer('${reg.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            ${reg.status === 'Pending' ? `
              <button class="icon-btn approve" title="Approve" onclick="approveEventRequest('${reg.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="icon-btn reject" title="Reject" onclick="triggerReject('event','${reg.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  footer.textContent = `Showing ${list.length} of ${allEventRequests.length} requests`;
}

/* =========================================================================
   EVENT REQUEST ACTIONS
   ========================================================================= */
async function approveEventRequest(regId) {
  // Check seats before approving
  const reg = allEventRequests.find(r => r.id === regId);
  if (reg) {
    const ev = allEvents.find(e => e.id === reg.event_id);
    if (ev) {
      const approved = allEventRequests.filter(r => r.event_id === ev.id && r.status === 'Approved').length;
      if (approved >= ev.max_seats) {
        showToast(`Cannot approve: "${ev.title}" is already at full capacity (${ev.max_seats} seats).`, 'danger');
        return;
      }
    }
  }

  try {
    await ElectroreckAdmin.eventRequests.updateStatus(regId, 'Approved');
    ElectroreckAdmin.activity.log('approved', `Event request approved`, 'event_request', regId);
    showToast('Request approved! Student will see their pass.', 'success');
    await refreshAllData();
    // Update drawer if open
    const drawerBackdrop = document.getElementById('erDrawerBackdrop');
    if (drawerBackdrop.classList.contains('open')) openERDrawer(regId);
  } catch (err) {
    showToast(err.message || 'Failed to approve request', 'danger');
  }
}

function triggerReject(type, id, isBulk = false, ids = []) {
  pendingRejectTarget = { type, id, isBulk, ids };
  document.getElementById('rejectReason').value = '';
  document.getElementById('rejectModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function confirmReject() {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) {
    showToast('Please provide a rejection reason.', 'warning');
    return;
  }

  const { type, id, isBulk, ids } = pendingRejectTarget;
  closeRejectModal();

  const targetIds = isBulk ? ids : [id];

  try {
    for (const rid of targetIds) {
      if (type === 'event') {
        await ElectroreckAdmin.eventRequests.updateStatus(rid, 'Rejected', reason);
      } else {
        await ElectroreckAdmin.societyApps.updateStatus(rid, 'Rejected', reason);
      }
      ElectroreckAdmin.activity.log('rejected', `${type === 'event' ? 'Event request' : 'Society application'} rejected: "${reason}"`, type, rid);
    }
    showToast(`${targetIds.length} request(s) rejected successfully.`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message || 'Rejection failed', 'danger');
  }
}

function closeRejectModal() {
  document.getElementById('rejectModal').classList.remove('open');
  document.body.style.overflow = '';
  pendingRejectTarget = null;
}

/* Bulk actions */
function toggleSelectAll(prefix) {
  const masterCb = document.getElementById(`${prefix}SelectAll`);
  document.querySelectorAll(`.${prefix}-checkbox`).forEach(cb => {
    cb.checked = masterCb.checked;
  });
  updateBulkUI(prefix);
}

function updateERBulk()   { updateBulkUI('er'); }
function updateSRBulk()   { updateBulkUI('sr'); }

function updateBulkUI(prefix) {
  const checkboxes = [...document.querySelectorAll(`.${prefix}-checkbox:checked`)];
  const bulkEl     = document.getElementById(`${prefix}BulkActions`);
  const countEl    = document.getElementById(`${prefix}BulkCount`);
  bulkEl.style.display = checkboxes.length > 0 ? 'flex' : 'none';
  countEl.textContent  = `${checkboxes.length} selected`;
}

function getSelectedIds(prefix) {
  return [...document.querySelectorAll(`.${prefix}-checkbox:checked`)].map(cb => cb.value);
}

async function bulkApproveEventRequests() {
  const ids = getSelectedIds('er');
  if (!ids.length) return;

  // Pre-check capacity
  for (const id of ids) {
    const reg = allEventRequests.find(r => r.id === id);
    if (reg) {
      const ev      = allEvents.find(e => e.id === reg.event_id);
      const already = allEventRequests.filter(r => r.event_id === reg.event_id && r.status === 'Approved').length;
      if (ev && already >= ev.max_seats) {
        showToast(`Cannot bulk approve: "${ev.title}" is full.`, 'danger');
        return;
      }
    }
  }

  showConfirm('Bulk Approve', `Approve ${ids.length} selected request(s)?`, async () => {
    try {
      for (const id of ids) {
        await ElectroreckAdmin.eventRequests.updateStatus(id, 'Approved');
        ElectroreckAdmin.activity.log('approved', 'Event request bulk approved', 'event_request', id);
      }
      showToast(`${ids.length} requests approved.`, 'success');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Bulk approve failed', 'danger');
    }
  });
}

function bulkRejectEventRequests() {
  const ids = getSelectedIds('er');
  if (!ids.length) return;
  triggerReject('event', null, true, ids);
}

async function bulkApproveSociety() {
  const ids = getSelectedIds('sr');
  if (!ids.length) return;

  showConfirm('Bulk Approve', `Approve ${ids.length} selected application(s)? This will set their role to "member".`, async () => {
    try {
      for (const id of ids) {
        await ElectroreckAdmin.societyApps.updateStatus(id, 'Approved');
        ElectroreckAdmin.activity.log('approved', 'Society application bulk approved', 'society', id);
      }
      showToast(`${ids.length} applications approved.`, 'success');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Bulk approve failed', 'danger');
    }
  });
}

function bulkRejectSociety() {
  const ids = getSelectedIds('sr');
  if (!ids.length) return;
  triggerReject('society', null, true, ids);
}

/* =========================================================================
   EVENT REQUEST DRAWER
   ========================================================================= */
function openERDrawer(regId) {
  const reg = allEventRequests.find(r => r.id === regId);
  if (!reg) return;

  const ev      = allEvents.find(e => e.id === reg.event_id) || reg.event || {};
  const members = reg.members || reg.team_members || [];

  const approvedSeats = allEventRequests.filter(r => r.event_id === reg.event_id && r.status === 'Approved').length;
  const totalSeats    = ev.max_seats || '—';
  const seatsPct      = ev.max_seats ? Math.round((approvedSeats / ev.max_seats) * 100) : 0;

  document.getElementById('erDrawerBody').innerHTML = `
    <div class="drawer-section">
      <div class="drawer-section-title">Pass & Status</div>
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
        <span class="pass-id-chip" style="font-size:0.9rem;padding:0.3rem 0.8rem;">${escHtml(reg.pass_id || '—')}</span>
        ${statusTag(reg.status)}
      </div>
      ${reg.rejection_reason ? `<div class="rejection-reason-box" style="margin-top:0.75rem;">
        <strong>Rejection Reason:</strong> ${escHtml(reg.rejection_reason)}
      </div>` : ''}
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Event</div>
      <div class="drawer-field-grid">
        <div class="drawer-field">
          <div class="drawer-field-label">Event Name</div>
          <div class="drawer-field-value">${escHtml(ev.title || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Category</div>
          <div class="drawer-field-value">${escHtml(ev.category || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Venue</div>
          <div class="drawer-field-value">${escHtml(ev.venue || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Seat Capacity</div>
          <div class="drawer-field-value">${approvedSeats} / ${totalSeats} (${seatsPct}% filled)</div>
        </div>
      </div>
      <div style="margin-top:0.75rem;">
        <div style="height:6px;background:var(--bg-muted);border-radius:9999px;overflow:hidden;">
          <div style="height:100%;width:${seatsPct}%;background:var(--primary);border-radius:9999px;"></div>
        </div>
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Team Leader / Registrant</div>
      <div class="drawer-field-grid">
        <div class="drawer-field">
          <div class="drawer-field-label">Name</div>
          <div class="drawer-field-value">${escHtml(reg.leader_name || reg.full_name || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Email</div>
          <div class="drawer-field-value" style="word-break:break-all;">${escHtml(reg.leader_email || reg.email || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">College</div>
          <div class="drawer-field-value">${escHtml(reg.college || reg.department || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Phone</div>
          <div class="drawer-field-value" style="font-family:var(--font-mono);">${escHtml(reg.phone || '—')}</div>
        </div>
        ${reg.team_name ? `
          <div class="drawer-field" style="grid-column:1/-1;">
            <div class="drawer-field-label">Team Name</div>
            <div class="drawer-field-value">${escHtml(reg.team_name)}</div>
          </div>
        ` : ''}
      </div>
    </div>

    ${members.length > 0 ? `
      <div class="drawer-section">
        <div class="drawer-section-title">Team Members (${members.length})</div>
        ${members.map((m, i) => `
          <div class="drawer-team-member">
            <div style="width:26px;height:26px;border-radius:50%;background:rgba(234,169,67,0.1);border:1px solid rgba(234,169,67,0.25);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--primary);">${i + 2}</div>
            <div>
              <div style="font-size:0.85rem;color:var(--text-main);font-weight:500;">${escHtml(m.name || '—')}</div>
              <div style="font-size:0.775rem;color:var(--text-muted);font-family:var(--font-mono);">${escHtml(m.roll_number || m.rollNo || '—')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="drawer-section">
      <div class="drawer-section-title">Submission Details</div>
      <div class="drawer-field-grid">
        <div class="drawer-field">
          <div class="drawer-field-label">Submitted At</div>
          <div class="drawer-field-value">${fmtDateTime(reg.created_at)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Reviewed At</div>
          <div class="drawer-field-value">${reg.reviewed_at ? fmtDateTime(reg.reviewed_at) : '—'}</div>
        </div>
      </div>
    </div>
  `;

  const footer = document.getElementById('erDrawerFooter');
  if (reg.status === 'Pending') {
    footer.innerHTML = `
      <button class="btn btn-success" style="flex:1;" onclick="approveEventRequest('${reg.id}');closeERDrawer();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Approve
      </button>
      <button class="btn btn-danger" style="flex:1;" onclick="closeERDrawer();triggerReject('event','${reg.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Reject
      </button>
    `;
  } else {
    footer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);flex:1;">This request has been <strong>${reg.status}</strong>.</p>`;
  }

  document.getElementById('erDrawerBackdrop').classList.add('open');
  document.getElementById('erDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeERDrawer() {
  document.getElementById('erDrawerBackdrop').classList.remove('open');
  document.getElementById('erDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* =========================================================================
   SOCIETY REQUESTS PAGE
   ========================================================================= */
function renderSocietyRequests() {
  if (currentAdminProfile.role !== 'admin') return;

  // Populate wing filter
  const select = document.getElementById('srWingFilter');
  const current = select.value;
  select.innerHTML = '<option value="all">All Wings</option>';
  allWings.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.name;
    if (opt.value === current) opt.selected = true;
    select.appendChild(opt);
  });

  filterSocietyRequests();
}

function filterSocietyRequests() {
  const search = (document.getElementById('srSearch').value || '').toLowerCase().trim();
  const wing   = document.getElementById('srWingFilter').value;
  const status = document.getElementById('srStatusFilter').value;

  let filtered = allSocietyApps;

  if (wing   !== 'all') filtered = filtered.filter(a => a.preferred_wing_id === wing);
  if (status !== 'all') filtered = filtered.filter(a => a.status === status);
  if (search) {
    filtered = filtered.filter(a =>
      searchIn(a.full_name, search) ||
      searchIn(a.roll_number, search) ||
      searchIn(a.email, search)
    );
  }

  renderSRTable(filtered);
}

function renderSRTable(list) {
  const tbody  = document.getElementById('srTableBody');
  const footer = document.getElementById('srTableFooter');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No applications match the current filters.</td></tr>`;
    footer.textContent = '';
    return;
  }

  tbody.innerHTML = list.map(app => {
    const wingName = app.wing ? app.wing.name : (allWings.find(w => w.id === app.preferred_wing_id) || {}).name || '—';

    return `
      <tr data-id="${app.id}">
        <td class="th-check"><input type="checkbox" class="sr-checkbox" value="${app.id}" onchange="updateSRBulk()"></td>
        <td>
          <strong style="font-size:0.875rem;">${escHtml(app.full_name)}</strong><br>
          <span style="font-size:0.775rem;color:var(--text-muted);">${escHtml(app.email)}</span>
        </td>
        <td style="font-family:var(--font-mono);font-size:0.8rem;">${escHtml(app.roll_number)}</td>
        <td style="font-size:0.8rem;">
          ${escHtml(app.department || '—')}<br>
          <span style="color:var(--text-muted);font-size:0.775rem;">${escHtml(app.year_of_study || '—')}</span>
        </td>
        <td style="font-size:0.8rem;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escHtml(wingName)}">${escHtml(wingName)}</td>
        <td style="font-size:0.775rem;color:var(--text-muted);white-space:nowrap;">${fmtDate(app.created_at)}</td>
        <td>${statusTag(app.status)}</td>
        <td>
          <div class="action-btns">
            <button class="icon-btn view" title="View Details" onclick="openSRDrawer('${app.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            ${app.status === 'Pending' || app.status === 'Shortlisted' ? `
              <button class="icon-btn approve" title="Approve" onclick="approveSocietyApp('${app.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            ` : ''}
            ${app.status === 'Pending' ? `
              <button class="icon-btn" title="Shortlist" onclick="shortlistSocietyApp('${app.id}')" style="color:#a78bfa;" title="Shortlist">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
              <button class="icon-btn reject" title="Reject" onclick="triggerReject('society','${app.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  footer.textContent = `Showing ${list.length} of ${allSocietyApps.length} applications`;
}

async function approveSocietyApp(appId) {
  try {
    await ElectroreckAdmin.societyApps.updateStatus(appId, 'Approved');
    ElectroreckAdmin.activity.log('approved', 'Society application approved (role → member)', 'society', appId);
    showToast('Application approved! User role set to member.', 'success');
    await refreshAllData();
    // Refresh drawer if open
    const backdrop = document.getElementById('srDrawerBackdrop');
    if (backdrop.classList.contains('open')) openSRDrawer(appId);
  } catch (err) {
    showToast(err.message || 'Failed to approve application', 'danger');
  }
}

async function shortlistSocietyApp(appId) {
  try {
    await ElectroreckAdmin.societyApps.updateStatus(appId, 'Shortlisted');
    ElectroreckAdmin.activity.log('pending', 'Society application shortlisted', 'society', appId);
    showToast('Application shortlisted.', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message || 'Failed to shortlist', 'danger');
  }
}

/* =========================================================================
   SOCIETY DRAWER
   ========================================================================= */
function openSRDrawer(appId) {
  const app  = allSocietyApps.find(a => a.id === appId);
  if (!app) return;

  const wingName = app.wing ? app.wing.name : (allWings.find(w => w.id === app.preferred_wing_id) || {}).name || '—';

  document.getElementById('srDrawerBody').innerHTML = `
    <div class="drawer-section">
      <div class="drawer-section-title">Application Status</div>
      <div>${statusTag(app.status)}</div>
      ${app.rejection_reason ? `<div class="rejection-reason-box" style="margin-top:0.75rem;">
        <strong>Rejection Reason:</strong> ${escHtml(app.rejection_reason)}
      </div>` : ''}
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Applicant Details</div>
      <div class="drawer-field-grid">
        <div class="drawer-field">
          <div class="drawer-field-label">Full Name</div>
          <div class="drawer-field-value">${escHtml(app.full_name)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Roll Number</div>
          <div class="drawer-field-value" style="font-family:var(--font-mono);">${escHtml(app.roll_number)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Email</div>
          <div class="drawer-field-value" style="word-break:break-all;">${escHtml(app.email)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">WhatsApp / Phone</div>
          <div class="drawer-field-value" style="font-family:var(--font-mono);">${escHtml(app.phone || app.whatsapp || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Department</div>
          <div class="drawer-field-value">${escHtml(app.department || app.branch || '—')}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Year of Study</div>
          <div class="drawer-field-value">${escHtml(app.year_of_study || app.year || '—')}</div>
        </div>
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Preferred Wing / Domain</div>
      <div class="drawer-field" style="margin-bottom:0.75rem;">
        <div class="drawer-field-value" style="color:var(--primary);font-size:1rem;font-weight:600;">${escHtml(wingName)}</div>
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Why They Want to Join</div>
      <div style="background:var(--bg-muted);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1rem;font-size:0.875rem;color:var(--text-muted);line-height:1.6;">
        "${escHtml(app.reason_for_joining || app.reason || '—')}"
      </div>
    </div>

    <div class="drawer-section">
      <div class="drawer-section-title">Submission Details</div>
      <div class="drawer-field-grid">
        <div class="drawer-field">
          <div class="drawer-field-label">Applied At</div>
          <div class="drawer-field-value">${fmtDateTime(app.created_at)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Last Updated</div>
          <div class="drawer-field-value">${app.reviewed_at ? fmtDateTime(app.reviewed_at) : '—'}</div>
        </div>
      </div>
    </div>
  `;

  const footer = document.getElementById('srDrawerFooter');
  if (app.status === 'Pending' || app.status === 'Shortlisted') {
    footer.innerHTML = `
      <button class="btn btn-success" style="flex:1;" onclick="approveSocietyApp('${app.id}');closeSRDrawer();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Approve
      </button>
      ${app.status === 'Pending' ? `
        <button class="btn btn-warning" style="flex:1;" onclick="shortlistSocietyApp('${app.id}');closeSRDrawer();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Shortlist
        </button>
        <button class="btn btn-danger" style="flex:1;" onclick="closeSRDrawer();triggerReject('society','${app.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Reject
        </button>
      ` : `
        <button class="btn btn-danger" style="flex:1;" onclick="closeSRDrawer();triggerReject('society','${app.id}')">Reject</button>
      `}
    `;
  } else {
    footer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);flex:1;">This application is <strong>${app.status}</strong>.</p>`;
  }

  document.getElementById('srDrawerBackdrop').classList.add('open');
  document.getElementById('srDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSRDrawer() {
  document.getElementById('srDrawerBackdrop').classList.remove('open');
  document.getElementById('srDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* =========================================================================
   EVENTS ADMIN PAGE
   ========================================================================= */
function renderEventsAdmin() {
  const container = document.getElementById('eventsAdminGrid');

  if (!allEvents.length) {
    container.innerHTML = `<div class="empty-state-block full-width">No events found. Add one using "+ Add New Event".</div>`;
    return;
  }

  let events = allEvents;
  if (currentAdminProfile.role === 'coordinator') {
    events = allEvents.filter(e => e.id === currentAdminProfile.coordinator_event_id);
  }

  container.innerHTML = events.map(ev => {
    const approvedCount = allEventRequests.filter(r => r.event_id === ev.id && r.status === 'Approved').length;
    const seatsFilled   = ev.seats_filled !== undefined ? ev.seats_filled : approvedCount;
    const pct           = ev.max_seats ? Math.min(100, Math.round((seatsFilled / ev.max_seats) * 100)) : 0;
    const fillColor     = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

    const catColor = {
      'Cultural':  'var(--electrica)',
      'Technical': 'var(--advanza)',
      'Research':  'var(--vidhwaan)',
      'Workshop':  'var(--digispark)'
    }[ev.category] || 'var(--primary)';

    return `
      <div class="event-admin-card">
        <div style="height:4px;background:${catColor};"></div>
        <div class="event-admin-card-header">
          <div>
            <div class="event-admin-card-title">${escHtml(ev.title)}</div>
            <div class="event-admin-card-meta">
              <span style="color:${catColor};font-weight:600;font-size:0.775rem;text-transform:uppercase;">${escHtml(ev.category)}</span>
              ${ev.tagline ? ` · ${escHtml(ev.tagline)}` : ''}
            </div>
          </div>
          <div style="flex-shrink:0;">
            ${ev.is_registration_open
              ? '<span class="status-tag status-approved">Open</span>'
              : '<span class="status-tag status-rejected">Closed</span>'}
          </div>
        </div>

        <div class="event-admin-card-body">
          <div class="event-seats-bar-wrap">
            <div class="event-seats-label">
              <span>Seats: <strong>${seatsFilled} / ${ev.max_seats}</strong></span>
              <span class="${pct >= 90 ? 'seats-pct-full' : pct >= 70 ? 'seats-pct-high' : pct >= 40 ? 'seats-pct-mid' : 'seats-pct-low'}">${pct}%</span>
            </div>
            <div class="event-seats-bar">
              <div class="event-seats-fill ${fillColor}" style="width:${pct}%;"></div>
            </div>
          </div>

          <div class="event-admin-info-grid">
            <div class="event-admin-info-item">
              <div class="event-admin-info-label">Venue</div>
              <div class="event-admin-info-value">${escHtml(ev.venue || '—')}</div>
            </div>
            <div class="event-admin-info-item">
              <div class="event-admin-info-label">Team Size</div>
              <div class="event-admin-info-value">${ev.min_team_size} – ${ev.max_team_size} members</div>
            </div>
            <div class="event-admin-info-item">
              <div class="event-admin-info-label">Deadline</div>
              <div class="event-admin-info-value">${ev.registration_deadline ? fmtDate(ev.registration_deadline) : '—'}</div>
            </div>
            <div class="event-admin-info-item">
              <div class="event-admin-info-label">Event Date</div>
              <div class="event-admin-info-value">${ev.event_date ? fmtDate(ev.event_date) : '—'}</div>
            </div>
          </div>

          <div class="event-admin-card-actions">
            <button class="btn btn-outline btn-sm" onclick="openEditEventModal('${ev.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn ${ev.is_registration_open ? 'btn-warning' : 'btn-success'} btn-sm" onclick="toggleEventOpen('${ev.id}', ${!ev.is_registration_open})">
              ${ev.is_registration_open ? 'Close Registrations' : 'Open Registrations'}
            </button>
            ${currentAdminProfile.role === 'admin' ? `
              <button class="btn btn-danger btn-sm" onclick="confirmDeleteEvent('${ev.id}', '${escHtml(ev.title)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleEventOpen(eventId, openState) {
  try {
    await Electroreck.events.update(eventId, { is_registration_open: openState });
    ElectroreckAdmin.activity.log('created', `Event registrations ${openState ? 'opened' : 'closed'}`, 'event', eventId);
    showToast(`Registration ${openState ? 'opened' : 'closed'} successfully.`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message || 'Failed to update event', 'danger');
  }
}

function confirmDeleteEvent(eventId, title) {
  showConfirm(`Delete "${title}"?`, `This will permanently delete the event and all its registrations. This action cannot be undone.`, async () => {
    try {
      await ElectroreckAdmin.events.delete(eventId);
      ElectroreckAdmin.activity.log('rejected', `Event deleted: "${title}"`, 'event', eventId);
      showToast(`Event "${title}" deleted.`, 'success');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'danger');
    }
  }, true);
}

/* =========================================================================
   CREATE / EDIT EVENT MODAL
   ========================================================================= */
function openCreateEventModal() {
  document.getElementById('ef_event_id').value  = '';
  document.getElementById('eventModalTitle').textContent = 'Add New Event';
  document.getElementById('eventFormSubmitBtn').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create Event`;
  document.getElementById('eventForm').reset();

  // Set defaults
  const now = new Date();
  const plus20 = new Date(now.getTime() + 20 * 86400000);
  const plus18 = new Date(now.getTime() + 18 * 86400000);
  document.getElementById('ef_event_date').value = toLocalDateTimeString(plus20);
  document.getElementById('ef_deadline').value   = toLocalDateTimeString(plus18);

  openEventModal();
}

function openEditEventModal(eventId) {
  const ev = allEvents.find(e => e.id === eventId);
  if (!ev) return;

  document.getElementById('ef_event_id').value   = ev.id;
  document.getElementById('eventModalTitle').textContent = `Edit: ${ev.title}`;
  document.getElementById('eventFormSubmitBtn').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Save Changes`;

  document.getElementById('ef_title').value       = ev.title || '';
  document.getElementById('ef_category').value    = ev.category || '';
  document.getElementById('ef_tagline').value     = ev.tagline || '';
  document.getElementById('ef_description').value = ev.description || '';
  document.getElementById('ef_venue').value       = ev.venue || '';
  document.getElementById('ef_event_date').value  = ev.event_date ? toLocalDateTimeString(new Date(ev.event_date)) : '';
  document.getElementById('ef_deadline').value    = ev.registration_deadline ? toLocalDateTimeString(new Date(ev.registration_deadline)) : '';
  document.getElementById('ef_min_team').value    = ev.min_team_size || 1;
  document.getElementById('ef_max_team').value    = ev.max_team_size || 1;
  document.getElementById('ef_seats').value       = ev.max_seats || 50;
  document.getElementById('ef_status').value      = ev.is_registration_open ? 'true' : 'false';

  openEventModal();
}

function openEventModal() {
  document.getElementById('eventFormModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEventModal() {
  document.getElementById('eventFormModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function handleSaveEvent(e) {
  e.preventDefault();
  const btn       = document.getElementById('eventFormSubmitBtn');
  const eventId   = document.getElementById('ef_event_id').value;
  const isEdit    = Boolean(eventId);

  const title     = document.getElementById('ef_title').value.trim();
  const category  = document.getElementById('ef_category').value;
  const tagline   = document.getElementById('ef_tagline').value.trim();
  const desc      = document.getElementById('ef_description').value.trim();
  const venue     = document.getElementById('ef_venue').value.trim();
  const evDate    = new Date(document.getElementById('ef_event_date').value).toISOString();
  const deadline  = new Date(document.getElementById('ef_deadline').value).toISOString();
  const minTeam   = parseInt(document.getElementById('ef_min_team').value, 10);
  const maxTeam   = parseInt(document.getElementById('ef_max_team').value, 10);
  const seats     = parseInt(document.getElementById('ef_seats').value, 10);
  const isOpen    = document.getElementById('ef_status').value === 'true';

  if (minTeam > maxTeam) {
    showToast('Min team size cannot exceed max team size.', 'warning');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Saving...';

  const payload = {
    title, category, tagline, description: desc, venue,
    event_date:            evDate,
    registration_deadline: deadline,
    min_team_size:         minTeam,
    max_team_size:         maxTeam,
    max_seats:             seats,
    is_registration_open:  isOpen
  };

  try {
    if (isEdit) {
      await Electroreck.events.update(eventId, payload);
      ElectroreckAdmin.activity.log('created', `Event updated: "${title}"`, 'event', eventId);
      showToast(`Event "${title}" updated and live on public site.`, 'success');
    } else {
      await ElectroreckAdmin.events.create(payload);
      ElectroreckAdmin.activity.log('created', `New event created: "${title}"`, 'event', 'new');
      showToast(`Event "${title}" created! Now visible on the public site.`, 'success');
    }

    closeEventModal();
    await refreshAllData();
    navigateTo('events');

  } catch (err) {
    showToast(err.message || 'Failed to save event', 'danger');
  } finally {
    btn.disabled    = false;
    btn.innerHTML   = isEdit
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Save Changes`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create Event`;
  }
}

/* =========================================================================
   ACTIVITY LOG
   ========================================================================= */
function renderActivityLog() {
  if (currentAdminProfile.role !== 'admin') return;
  const tbody = document.getElementById('activityLogBody');
  const log   = ElectroreckAdmin.activity.getAll();

  if (!log.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No activity recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = log.map(entry => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:0.775rem;color:var(--text-muted);white-space:nowrap;">${fmtDateTime(entry.timestamp)}</td>
      <td style="font-size:0.85rem;">${escHtml(currentAdminProfile.full_name || 'Admin')}</td>
      <td><span class="status-tag ${entry.action === 'approved' ? 'status-approved' : entry.action === 'rejected' ? 'status-rejected' : 'status-pending'}">${escHtml(entry.action)}</span></td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${escHtml(entry.targetType || '—')}</td>
      <td style="font-size:0.85rem;color:var(--text-muted);">${escHtml(entry.description)}</td>
    </tr>
  `).join('');
}

/* =========================================================================
   CSV EXPORTS
   ========================================================================= */
function exportEventRequestsCSV() {
  const eventId = document.getElementById('erEventFilter').value;
  let data = allEventRequests;
  if (eventId !== 'all') data = data.filter(r => r.event_id === eventId);

  Electroreck.exportCSV({
    filename: `electroreck_event_requests_${isoDate()}`,
    headers: [
      { label: 'Pass ID',       key: 'pass_id' },
      { label: 'Event',         format: r => (r.event && r.event.title) || '—' },
      { label: 'Team Name',     format: r => r.team_name || 'Solo' },
      { label: 'Leader Name',   format: r => r.leader_name || r.full_name || '—' },
      { label: 'Leader Email',  format: r => r.leader_email || r.email || '—' },
      { label: 'College',       format: r => r.college || r.department || '—' },
      { label: 'Phone',         key: 'phone' },
      { label: 'Members',       format: r => (r.members || r.team_members || []).map(m => `${m.name} (${m.roll_number || m.rollNo || ''})`).join('; ') },
      { label: 'Status',        key: 'status' },
      { label: 'Rejection Reason', format: r => r.rejection_reason || '' },
      { label: 'Submitted At',  format: r => new Date(r.created_at).toISOString() }
    ],
    rows: data
  });
  showToast('CSV exported successfully.', 'success');
}

function exportSocietyCSV() {
  Electroreck.exportCSV({
    filename: `electroreck_society_applications_${isoDate()}`,
    headers: [
      { label: 'Full Name',     key: 'full_name' },
      { label: 'Roll Number',   key: 'roll_number' },
      { label: 'Email',         key: 'email' },
      { label: 'Department',    format: a => a.department || a.branch || '—' },
      { label: 'Year',          format: a => a.year_of_study || a.year || '—' },
      { label: 'Phone',         format: a => a.phone || a.whatsapp || '—' },
      { label: 'Wing Applied',  format: a => (a.wing && a.wing.name) || '—' },
      { label: 'Reason',        format: a => a.reason_for_joining || a.reason || '—' },
      { label: 'Status',        key: 'status' },
      { label: 'Rejection',     format: a => a.rejection_reason || '' },
      { label: 'Applied At',    format: a => new Date(a.created_at).toISOString() }
    ],
    rows: allSocietyApps
  });
  showToast('CSV exported successfully.', 'success');
}

/* =========================================================================
   GENERIC CONFIRM DIALOG
   ========================================================================= */
function showConfirm(title, message, onConfirm, isDanger = true) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;

  const btn = document.getElementById('confirmActionBtn');
  btn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
  btn.textContent = 'Confirm';

  pendingConfirmCb = onConfirm;
  document.getElementById('confirmModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  btn.onclick = async () => {
    closeConfirmModal();
    if (pendingConfirmCb) await pendingConfirmCb();
  };
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('open');
  document.body.style.overflow = '';
  pendingConfirmCb = null;
}

/* =========================================================================
   TOAST
   ========================================================================= */
function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');

  const iconSvg = {
    success: `<polyline points="20 6 9 17 4 12"/>`,
    danger:  `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    warning: `<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
  }[type] || `<circle cx="12" cy="12" r="10"/>`;

  toast.className = `toast${type === 'success' ? ' toast-success' : type === 'danger' ? ' toast-danger' : type === 'warning' ? ' toast-warning' : ''}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
    <span>${escHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* =========================================================================
   HELPER UTILITIES
   ========================================================================= */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function searchIn(val, q) {
  return val && String(val).toLowerCase().includes(q);
}

function statusTag(status) {
  const cls = {
    'Pending':     'status-pending',
    'Approved':    'status-approved',
    'Rejected':    'status-rejected',
    'Shortlisted': 'status-shortlisted',
    'Confirmed':   'status-confirmed',
    'Cancelled':   'status-cancelled'
  }[status] || 'status-pending';

  const dots = {
    'Pending':     '⏳',
    'Approved':    '✓',
    'Rejected':    '✕',
    'Shortlisted': '★',
    'Confirmed':   '✓',
    'Cancelled':   '—'
  }[status] || '';

  return `<span class="status-tag ${cls}">${dots} ${escHtml(status)}</span>`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function toLocalDateTimeString(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* =========================================================================
   ELECTRORECK ADMIN EXTENSION
   Extends the Electroreck backend with admin-specific operations.
   Mirrors Supabase calls with a local simulator for offline mode.
   ========================================================================= */
const ElectroreckAdmin = {

  /* --- EVENT REQUESTS (extended status: Pending/Approved/Rejected) --- */
  eventRequests: {
    async getAll(eventId = null) {
      const profile = await Electroreck.auth.getCurrentProfile();
      if (!profile || (profile.role !== 'admin' && profile.role !== 'coordinator')) {
        throw new Error('Access denied.');
      }

      // Use existing Electroreck.registrations.getAllForAdmin as base
      const rawRegs = await Electroreck.registrations.getAllForAdmin(eventId);

      // Normalize field names to match new schema while keeping backward compat
      return rawRegs.map(r => ({
        ...r,
        // Map old 'Confirmed' → 'Approved', 'Accepted' → 'Approved' for UI
        status: normalizeRegStatus(r.status),
        leader_name:  r.full_name,
        leader_email: r.email,
        college:      r.department,
      }));
    },

    async updateStatus(id, newStatus, rejectionReason = null) {
      const backendStatus = newStatus;

      const db = loadAdminDb();
      const idx = db.event_registrations.findIndex(r => r.id === id);
      if (idx !== -1) {
        db.event_registrations[idx].status           = backendStatus;
        db.event_registrations[idx].reviewed_at      = new Date().toISOString();
        db.event_registrations[idx].rejection_reason = rejectionReason || null;
        if (newStatus === 'Approved' && !db.event_registrations[idx].pass_id) {
          db.passSequence = (db.passSequence || 100) + 1;
          db.event_registrations[idx].pass_id = `ER-2026-${String(db.passSequence).padStart(5, '0')}`;
        }
        saveAdminDb(db);
        return db.event_registrations[idx];
      }

      // Fallback to real Electroreck backend
      return await Electroreck.registrations.updateStatus(id, backendStatus, rejectionReason);
    }
  },

  /* --- SOCIETY APPLICATIONS --- */
  societyApps: {
    async getAll() {
      const profile = await Electroreck.auth.getCurrentProfile();
      if (!profile || profile.role !== 'admin') throw new Error('Access denied.');

      const rawApps = await Electroreck.induction.getAllForAdmin();
      return rawApps.map(a => ({
        ...a,
        status: normalizeSocietyStatus(a.status),
        phone:  a.phone || a.whatsapp,
      }));
    },

    async updateStatus(id, newStatus, rejectionReason = null) {
      // Map Approved → set user role to member
      const db  = loadAdminDb();
      const idx = db.induction_applications.findIndex(a => a.id === id);

      if (idx !== -1) {
        db.induction_applications[idx].status           = newStatus;
        db.induction_applications[idx].reviewed_at      = new Date().toISOString();
        db.induction_applications[idx].rejection_reason = rejectionReason || null;

        if (newStatus === 'Approved') {
          // Promote user to member
          const userId = db.induction_applications[idx].user_id;
          const pIdx   = db.profiles.findIndex(p => p.id === userId);
          if (pIdx !== -1) db.profiles[pIdx].role = 'member';
        }

        saveAdminDb(db);
        return db.induction_applications[idx];
      }

      // Fallback: directly patch rejection_reason in shared db since
      // Electroreck.induction.updateStatus doesn't support rejectionReason param
      const sharedDb = loadAdminDb();
      const fallbackIdx = sharedDb.induction_applications.findIndex(a => a.id === id);
      if (fallbackIdx !== -1) {
        sharedDb.induction_applications[fallbackIdx].status           = newStatus;
        sharedDb.induction_applications[fallbackIdx].reviewed_at      = new Date().toISOString();
        sharedDb.induction_applications[fallbackIdx].rejection_reason = rejectionReason || null;
        if (newStatus === 'Approved') {
          const userId = sharedDb.induction_applications[fallbackIdx].user_id;
          const pIdx   = sharedDb.profiles.findIndex(p => p.id === userId);
          if (pIdx !== -1) sharedDb.profiles[pIdx].role = 'member';
        }
        saveAdminDb(sharedDb);
        return sharedDb.induction_applications[fallbackIdx];
      }
      return await Electroreck.induction.updateStatus(id,
        newStatus === 'Approved' ? 'Accepted' : newStatus);
    }
  },

  /* --- EVENT CREATION (admin only) --- */
  events: {
    async create(payload) {
      const profile = await Electroreck.auth.getCurrentProfile();
      if (!profile || profile.role !== 'admin') throw new Error('Access denied: Only Super Admins can create events.');

      const db = loadAdminDb();
      const slug = payload.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newEvent = {
        id:                    'event-' + Math.random().toString(36).substring(2, 9),
        slug,
        ...payload,
        created_at:            new Date().toISOString(),
        updated_at:            new Date().toISOString()
      };

      db.events.push(newEvent);
      saveAdminDb(db);

      // Sync to live Supabase if configured
      if (Electroreck.isRealMode) {
        // Real client path: handled by existing Electroreck backend if we add create method
        // For now, already saved to shared localStorage
      }

      return newEvent;
    },

    async delete(eventId) {
      const profile = await Electroreck.auth.getCurrentProfile();
      if (!profile || profile.role !== 'admin') throw new Error('Only Super Admins can delete events.');

      const db  = loadAdminDb();
      const idx = db.events.findIndex(e => e.id === eventId);
      if (idx === -1) throw new Error('Event not found.');

      db.events.splice(idx, 1);
      // Remove associated registrations
      db.event_registrations = db.event_registrations.filter(r => r.event_id !== eventId);
      saveAdminDb(db);
    }
  },

  /* --- ACTIVITY LOG (local, session-persistent) --- */
  activity: {
    STORAGE_KEY: 'electroreck_activity_log_v1',

    log(action, description, targetType, targetId) {
      try {
        const log   = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        log.unshift({
          id:         Math.random().toString(36).substring(2),
          action,
          description,
          targetType,
          targetId,
          timestamp:  new Date().toISOString()
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(log.slice(0, 200)));
      } catch (e) {}
    },

    getAll() {
      try {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      } catch { return []; }
    }
  }
};

/* =========================================================================
   LOCAL DB HELPERS (reuse Electroreck's shared localStorage DB)
   ========================================================================= */
const LOCAL_STORAGE_KEY = 'electroreck_simulated_db_v1';

function loadAdminDb() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  // Return a safe empty structure (matches supabase-client's getInitialDbState shape)
  return {
    profiles: [],
    events: [],
    event_registrations: [],
    induction_applications: [],
    wings: [],
    currentSession: null,
    passSequence: 100
  };
}

function saveAdminDb(db) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch (e) {}
}

/* =========================================================================
   STATUS NORMALIZERS (bridge old → new naming)
   ========================================================================= */
function normalizeRegStatus(status) {
  if (!status) return 'Pending';
  if (status === 'Confirmed') return 'Approved';
  if (status === 'Accepted')  return 'Approved';
  return status; // Pending, Rejected, Cancelled passthrough
}

function normalizeSocietyStatus(status) {
  if (!status) return 'Pending';
  if (status === 'Accepted') return 'Approved';
  return status;
}
