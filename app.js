/* ═══════════════════════════════════════════════
   APP.JS — THE MAIN CONTROLLER

   This is the brain of WorkBuddy. It runs first
   after all the modules load and handles:

   1. Login / Logout
   2. Routing — which page to show when nav is clicked
   3. Sidebar — building the nav based on role
   4. Theme — dark/light mode toggle
   5. Notifications
   6. Toast messages
   7. Global UI helpers

   The key concept here is called a SINGLE PAGE APP (SPA).
   Instead of loading new HTML pages, we have ONE page
   and swap the content inside #page-content using JS.
════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════
   NAV CONFIGS
   
   Two separate navigation structures — one for
   admins, one for employees. The active user's
   role decides which one gets rendered.

   Each item has:
   - section: optional group label
   - id: the route name (used in navigate())
   - icon: Lucide icon name
   - label: what shows in the sidebar
   - badge: optional count badge
════════════════════════════════════════════════ */

const ADMIN_NAV = [
  { section: 'Overview' },
  { id: 'admin-dashboard',  icon: 'layout-dashboard', label: 'Dashboard' },

  { section: 'People' },
  { id: 'admin-employees',  icon: 'users',             label: 'Employees' },
  { id: 'admin-recruitment',icon: 'briefcase',         label: 'Recruitment' },

  { section: 'Time & Pay' },
  { id: 'admin-attendance', icon: 'clock',             label: 'Attendance' },
  { id: 'admin-leave',      icon: 'calendar-days',     label: 'Leave Management' },
  { id: 'admin-payroll',    icon: 'banknote',          label: 'Payroll' },

  { section: 'Growth' },
  { id: 'admin-performance',icon: 'bar-chart-2',       label: 'Performance' },

  { section: 'AI' },
  { id: 'admin-ai',         icon: 'sparkles',          label: 'AI Assistant' },

  { section: 'System' },
  { id: 'admin-settings',   icon: 'settings',          label: 'Settings & Docs' },
];

const EMPLOYEE_NAV = [
  { section: 'My Workspace' },
  { id: 'emp-dashboard',    icon: 'layout-dashboard',  label: 'My Dashboard' },
  { id: 'emp-profile',      icon: 'user-circle',       label: 'My Profile' },

  { section: 'Time Off' },
  { id: 'emp-attendance',   icon: 'clock',             label: 'My Attendance' },
  { id: 'emp-leave',        icon: 'calendar-days',     label: 'Apply for Leave' },

  { section: 'Finances & Growth' },
  { id: 'emp-payslips',     icon: 'receipt',           label: 'My Payslips' },
  { id: 'emp-performance',  icon: 'star',              label: 'My Performance' },

  { section: 'AI' },
  { id: 'emp-ai',           icon: 'sparkles',          label: 'AI Assistant' },
];


/* ═══════════════════════════════════════════════
   ROUTE MAP
   
   Maps each route id to the function that renders
   it. These functions live in the module files.
════════════════════════════════════════════════ */
const ROUTES = {
  'admin-dashboard':   () => renderAdminDashboard(),
  'admin-employees':   () => renderEmployees(),
  'admin-recruitment': () => renderRecruitment(),
  'admin-attendance':  () => renderAdminAttendance(),
  'admin-leave':       () => renderLeaveManagement(),
  'admin-payroll':     () => renderPayroll(),
  'admin-performance': () => renderPerformance(),
  'admin-ai':          () => renderAdminAI(),
  'admin-settings':    () => renderSettings(),

  'emp-dashboard':     () => renderEmployeeDashboard(),
  'emp-profile':       () => renderProfile(),
  'emp-attendance':    () => renderEmployeeAttendance(),
  'emp-leave':         () => renderEmployeeLeave(),
  'emp-payslips':      () => renderPayslips(),
  'emp-performance':   () => renderEmployeePerformance(),
  'emp-ai':            () => renderEmployeeAI(),
};

// Track current active route
let currentRoute = null;


/* ═══════════════════════════════════════════════
   INIT — runs when the page loads
════════════════════════════════════════════════ */
async function init() {
  // 1. Initialize the database
  db.init();

  // 2. Hash passwords on first run (SHA-256 security upgrade)
  await migratePasswordsToHashed();

  // 3. Initialize Lucide icons
  lucide.createIcons();

  // 4. Restore theme preference
  const savedTheme = localStorage.getItem('wb_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // 5. Create the toast container
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);

  // 6. Show privacy notice on first visit
  showPrivacyNoticeIfNeeded();

  // 7. Check if user is already logged in
  const user = getCurrentUser();
  if (user) {
    showApp(user);
    SessionTimeout.start();
  } else {
    showLogin();
  }

  // 8. Close dropdowns when clicking outside
  document.addEventListener('click', handleOutsideClick);
}


/* ═══════════════════════════════════════════════
   AUTH — LOGIN & LOGOUT
════════════════════════════════════════════════ */
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorEl  = document.getElementById('login-error');

  // Basic validation
  if (!email || !password) {
    showLoginError('Please enter your email and password.');
    return;
  }

  // ── RATE LIMIT CHECK ──
  if (RateLimit.isLocked()) {
    const secs = RateLimit.getRemainingLockSeconds();
    showLoginError(`Too many failed attempts. Account locked for ${secs} seconds.`);
    startLockoutCountdown();
    return;
  }

  // ── SECURE AUTHENTICATION (SHA-256 hashed password) ──
  const user = await authenticateUserSecure(email, password);

  if (user) {
    RateLimit.recordSuccess();
    errorEl.classList.add('hidden');
    setCurrentUser(user);
    auditLog(`User logged in`, 'auth', `Email: ${email}`);
    SessionTimeout.start();
    showApp(user);
    showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  } else {
    const state = RateLimit.recordFailure();
    auditLog(`Failed login attempt`, 'auth', `Email: ${email}`);

    if (RateLimit.isLocked()) {
      showLoginError(`Too many failed attempts. Account locked for 30 seconds.`);
      startLockoutCountdown();
    } else {
      const remaining = RateLimit.getRemainingAttempts();
      showLoginError(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
  }
}

function startLockoutCountdown() {
  const btn = document.querySelector('.btn-login');
  if (!btn) return;
  btn.disabled = true;
  const interval = setInterval(() => {
    if (!RateLimit.isLocked()) {
      clearInterval(interval);
      if (btn) { btn.disabled = false; btn.innerHTML = 'Sign in <i data-lucide="arrow-right"></i>'; }
      lucide.createIcons();
      showLoginError('Account unlocked. You may try again.');
      return;
    }
    const secs = RateLimit.getRemainingLockSeconds();
    if (btn) btn.innerHTML = `<i data-lucide="lock"></i> Locked (${secs}s)`;
    lucide.createIcons();
  }, 1000);
}

function showLoginError(msg) {
  const errorEl = document.getElementById('login-error');
  errorEl.querySelector('span').textContent = msg;
  errorEl.classList.remove('hidden');
  lucide.createIcons();
}

function handleLogout() {
  auditLog('User logged out', 'auth');
  SessionTimeout.stop();
  clearSession();
  clearChatHistory();
  showLogin();
  showToast('You have been signed out.', 'info');
}

// Fill demo credentials on click
function fillDemo(role) {
  if (role === 'admin') {
    document.getElementById('login-email').value = 'admin@workbuddy.com';
    document.getElementById('login-password').value = 'admin123';
  } else {
    document.getElementById('login-email').value = 'john@workbuddy.com';
    document.getElementById('login-password').value = 'emp123';
  }
}

// Allow pressing Enter to login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginPage = document.getElementById('login-page');
    if (!loginPage.classList.contains('hidden')) handleLogin();
  }
});

function togglePassword() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}


/* ═══════════════════════════════════════════════
   SHOW LOGIN / SHOW APP
════════════════════════════════════════════════ */
function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  // Clear form
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.add('hidden');
  lucide.createIcons();
}

function showApp(user) {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  // Build the sidebar for this user's role
  buildSidebar(user);

  // Update the topbar avatar
  document.getElementById('avatar-initials').textContent = getInitials(user.name);

  // Update notification badge
  updateNotifBadge();

  // Load notifications
  loadNotifications();

  // Navigate to the default page based on role
  const defaultRoute = user.role === 'admin' ? 'admin-dashboard' : 'emp-dashboard';
  navigate(defaultRoute);

  lucide.createIcons();
}


/* ═══════════════════════════════════════════════
   SIDEBAR BUILDER
   
   This function reads the NAV config for the user's
   role and creates the sidebar nav HTML dynamically.
   This is called once after login.
════════════════════════════════════════════════ */
function buildSidebar(user) {
  const nav  = user.role === 'admin' ? ADMIN_NAV : EMPLOYEE_NAV;
  const navEl = document.getElementById('sidebar-nav');

  navEl.innerHTML = nav.map(item => {
    if (item.section) {
      return `<div class="nav-section-label">${item.section}</div>`;
    }

    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    return `
      <button class="nav-item" id="nav-${item.id}" onclick="navigate('${item.id}')">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
        ${badge}
      </button>
    `;
  }).join('');

  // Update the sidebar user info
  document.getElementById('sidebar-user').innerHTML = `
    <div class="sidebar-user-avatar">${getInitials(user.name)}</div>
    <div>
      <div class="sidebar-user-name">${user.name}</div>
      <div class="sidebar-user-role">${user.role === 'admin' ? 'HR Admin' : user.position}</div>
    </div>
  `;

  // Update user menu info
  document.getElementById('user-menu-info').innerHTML = `
    <strong>${user.name}</strong><br>
    ${user.email}
  `;

  lucide.createIcons();
}


/* ═══════════════════════════════════════════════
   NAVIGATE — THE ROUTER
   
   This is how the single-page app works.
   When you click a nav item, navigate() is called.
   It:
   1. Updates the active nav item visually
   2. Updates the topbar title
   3. Calls the correct render function
   4. Closes the sidebar on mobile
════════════════════════════════════════════════ */
function navigate(routeId) {
  // Find the render function for this route
  const renderFn = ROUTES[routeId];
  if (!renderFn) {
    console.warn(`No route found for: ${routeId}`);
    return;
  }

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${routeId}`);
  if (activeNav) activeNav.classList.add('active');

  // Update topbar title
  const allNav = [...ADMIN_NAV, ...EMPLOYEE_NAV];
  const navItem = allNav.find(n => n.id === routeId);
  if (navItem) {
    document.getElementById('topbar-title').textContent = navItem.label;
  }

  // Clear and render the page content
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>
  `;

  // Small delay so the loading spinner shows (feels more real)
  setTimeout(() => {
    renderFn();
    lucide.createIcons();
    currentRoute = routeId;
  }, 150);

  // Close mobile sidebar
  closeSidebar();
}

// Refresh current page (used after save/delete actions)
function refreshPage() {
  if (currentRoute) navigate(currentRoute);
}


/* ═══════════════════════════════════════════════
   SIDEBAR TOGGLE (mobile)
════════════════════════════════════════════════ */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}


/* ═══════════════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('wb_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
  lucide.createIcons();
}


/* ═══════════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════════════ */
function toggleNotifications() {
  const dropdown = document.getElementById('notif-dropdown');
  const userMenu = document.getElementById('user-menu');
  userMenu.classList.add('hidden');
  dropdown.classList.toggle('hidden');
}

function loadNotifications() {
  const notifs = getNotifications();
  const list = document.getElementById('notif-list');

  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = `<div class="empty-state" style="padding:1.5rem">
      <p>No notifications</p>
    </div>`;
    return;
  }

  const icons = {
    leave: 'calendar-days',
    recruitment: 'briefcase',
    payroll: 'banknote',
    attendance: 'clock',
    info: 'info'
  };

  list.innerHTML = notifs.slice(0, 8).map(n => `
    <div class="notif-item">
      <div class="notif-dot" style="${n.read ? 'background:var(--border)' : ''}"></div>
      <div>
        <div class="notif-text">${n.message}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function updateNotifBadge() {
  const count = getUnreadCount();
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function clearNotifications() {
  markAllRead();
  loadNotifications();
  updateNotifBadge();
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  const notifDropdown = document.getElementById('notif-dropdown');
  notifDropdown.classList.add('hidden');
  menu.classList.toggle('hidden');
}

function handleOutsideClick(e) {
  // Close notification dropdown
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn?.contains(e.target)) {
    notifDropdown.classList.add('hidden');
  }

  // Close user menu
  const avatar = document.getElementById('topbar-avatar');
  const userMenu = document.getElementById('user-menu');
  if (userMenu && !userMenu.contains(e.target) && !avatar?.contains(e.target)) {
    userMenu.classList.add('hidden');
  }
}


/* ═══════════════════════════════════════════════
   TOAST NOTIFICATIONS
   
   Small pop-up messages that appear bottom-right
   and disappear after 3 seconds. Used throughout
   the app after save/delete/error actions.

   Usage: showToast('Employee added!', 'success')
   Types: 'success', 'error', 'warning', 'info'
════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'check-circle',
    error:   'x-circle',
    warning: 'alert-triangle',
    info:    'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


/* ═══════════════════════════════════════════════
   MODAL HELPERS
   
   Reusable functions to open and close modals.
   Modules call openModal(html) to show content.
════════════════════════════════════════════════ */
function openModal(contentHTML, size = '') {
  // Remove any existing modal
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size}" id="active-modal">
      ${contentHTML}
    </div>
  `;

  // Close when clicking the overlay background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.body.appendChild(overlay);
  lucide.createIcons();
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}


/* ═══════════════════════════════════════════════
   CONFIRM DIALOG
   
   A nicer alternative to window.confirm().
   Returns a Promise so you can await it.

   Usage:
   const confirmed = await confirmDialog('Delete this employee?');
   if (confirmed) { ... }
════════════════════════════════════════════════ */
function confirmDialog(message, confirmLabel = 'Confirm', danger = false) {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal-header">
        <h3>Confirm Action</h3>
        <button class="modal-close" onclick="closeModal(); resolve(false)">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary)">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay')._resolve(false)">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="document.getElementById('modal-overlay')._resolve(true)">
          ${confirmLabel}
        </button>
      </div>
    `);

    // Attach resolver to overlay so buttons can call it
    document.getElementById('modal-overlay')._resolve = (val) => {
      closeModal();
      resolve(val);
    };
  });
}


/* ═══════════════════════════════════════════════
   PAGE CONTENT HELPER
   
   Shortcut to set the page content area's HTML.
   All module render functions use this.
════════════════════════════════════════════════ */
function setPageContent(html) {
  document.getElementById('page-content').innerHTML = html;
  lucide.createIcons();
}


/* ═══════════════════════════════════════════════
   START THE APP
════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', init);

