/* helpers.js — shared utility functions loaded before all modules */

/* ═══════════════════════════════════════════════
   SHARED HELPER FUNCTIONS
   These are used across both admin and employee
   modules so they live here in app.js where
   every module can access them globally.
════════════════════════════════════════════════ */

/* ── SMART AVATAR BUILDER ──
   Returns HTML for an avatar — photo if available, initials if not.
   size: CSS size string e.g. "36px" (default)
   extraStyle: additional inline styles
── */
function buildAvatar(user, size = '36px', fontSize = '0.75rem') {
  const fSize = `font-size:${fontSize};`;
  const dims  = `width:${size};height:${size};`;
  if (user?.avatarImg) {
    return `<div style="${dims}border-radius:50%;overflow:hidden;flex-shrink:0">
      <img src="${user.avatarImg}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover" />
    </div>`;
  }
  return `<div style="${dims}${fSize}border-radius:50%;background:linear-gradient(135deg,var(--blue-primary),var(--blue-light));color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">
    ${getInitials(user?.name || '??')}
  </div>`;
}


function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAttBadge(status) {
  const map = {
    present:    'badge-green',
    late:       'badge-yellow',
    absent:     'badge-red',
    'on-leave': 'badge-blue'
  };
  return map[status] || 'badge-gray';
}

function getLeaveStatusBadge(status) {
  const map = {
    pending:  'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red'
  };
  return map[status] || 'badge-gray';
}

function getRatingClass(rating) {
  if (rating >= 4.5) return 'rating-excellent';
  if (rating >= 3.5) return 'rating-good';
  if (rating >= 2.5) return 'rating-average';
  return 'rating-poor';
}

function getRatingColor(val) {
  if (val >= 4) return 'var(--success)';
  if (val >= 3) return 'var(--blue-primary)';
  if (val >= 2) return 'var(--warning)';
  return 'var(--danger)';
}

function getTodayDateStr() {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}


/* ── SHARED CHAT HELPERS (used by both AI assistants) ── */

function appendChatMessage(text, role) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;
  const isAI = role === 'assistant';
  const div  = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="chat-avatar ${isAI ? 'ai-avatar' : 'user-avatar'}">
      ${isAI ? '<i data-lucide="sparkles"></i>' : getInitials(getCurrentUser()?.name || 'U')}
    </div>
    <div class="chat-bubble"><p>${formatChatText(text)}</p></div>
  `;
  messages.appendChild(div);
  lucide.createIcons();
  messages.scrollTop = messages.scrollHeight;
}

function appendStreamingBubble(id) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.id = id;
  div.innerHTML = `
    <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
    <div class="chat-bubble" id="bubble-${id}"><span class="cursor-blink">|</span></div>
  `;
  messages.appendChild(div);
  lucide.createIcons();
  messages.scrollTop = messages.scrollHeight;
  return document.getElementById(`bubble-${id}`);
}

function appendTypingIndicator(id) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.id = id;
  div.innerHTML = `
    <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
    <div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>
  `;
  messages.appendChild(div);
  lucide.createIcons();
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function formatChatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    // Works for both admin and employee chat
    if (typeof sendChatMessage === 'function') sendChatMessage();
    else if (typeof sendEmpChatMessage === 'function') sendEmpChatMessage();
  }
}

/* ── SHARED PAYSLIP VIEWER (used by admin payroll + employee payslips) ── */

function viewPayslipModal(userId, payrollId) {
  const emp     = getUserById(userId);
  const payroll = getPayroll();
  const record  = payrollId ? payroll.find(p => p.id === payrollId) : null;
  if (!emp) return;

  const basic  = emp.salary;
  const allow  = record?.allowances  || Math.round(basic * 0.08);
  const deduct = record?.deductions  || Math.round(basic * 0.05);
  const net    = record?.netSalary   || (basic + allow - deduct);
  const month  = record?.month       || 'June 2025';
  const status = record?.status      || 'pending';
  const paid   = record?.paidDate    || null;

  openModal(`
    <div class="modal-header">
      <h3>Payslip — ${emp.name}</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="payslip">
        <div class="payslip-header">
          <img src="images/workbuddy.png" alt="WorkBuddy" style="width:36px;height:36px;object-fit:contain;filter:brightness(0) invert(1)" />
          <div>
            <div style="font-weight:800;font-size:1rem;color:#fff">WorkBuddy HR</div>
            <div style="font-size:0.75rem;opacity:0.7">Official Payslip</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:0.875rem;font-weight:600;color:#fff">${month}</div>
            <span class="badge ${status === 'paid' ? 'badge-green' : 'badge-yellow'}">${capitalize(status)}</span>
          </div>
        </div>
        <div class="payslip-emp">
          <div><span class="text-muted text-sm">Employee</span><div class="font-semibold">${emp.name}</div></div>
          <div><span class="text-muted text-sm">Position</span><div class="font-semibold">${emp.position}</div></div>
          <div><span class="text-muted text-sm">Department</span><div class="font-semibold">${emp.department}</div></div>
          <div><span class="text-muted text-sm">Payment Date</span><div class="font-semibold">${paid ? formatDate(paid) : 'Pending'}</div></div>
        </div>
        <div class="payslip-breakdown">
          <div class="payslip-row"><span>Basic Salary</span><span>${formatCurrency(basic)}</span></div>
          <div class="payslip-row"><span>Housing Allowance (5%)</span><span class="text-success">+${formatCurrency(Math.round(basic*0.05))}</span></div>
          <div class="payslip-row"><span>Transport Allowance (3%)</span><span class="text-success">+${formatCurrency(Math.round(basic*0.03))}</span></div>
          <div class="payslip-row deduction"><span>Income Tax (3%)</span><span class="text-danger">-${formatCurrency(Math.round(basic*0.03))}</span></div>
          <div class="payslip-row deduction"><span>Pension (2%)</span><span class="text-danger">-${formatCurrency(Math.round(basic*0.02))}</span></div>
        </div>
        <div class="payslip-total">
          <span>Net Pay</span>
          <span>${formatCurrency(net)}</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">
        <i data-lucide="printer"></i> Print Payslip
      </button>
    </div>
  `);
}


/* ═══════════════════════════════════════════════
   BIRTHDAY NOTIFICATIONS
════════════════════════════════════════════════ */
function checkBirthdays(currentUser) {
  const birthdays = getTodayBirthdays();
  if (!birthdays.length) return;

  birthdays.forEach(person => {
    const isCurrentUser = person.id === currentUser.id;

    if (isCurrentUser) {
      // Show a special birthday toast for the logged-in user
      setTimeout(() => {
        showBirthdayModal(person);
      }, 1000);
    } else if (currentUser.role === 'admin' || true) {
      // Notify everyone about their colleague's birthday
      addNotification(`&#127881; Today is ${person.name}'s birthday! Send them a wish.`, 'birthday');
      showToast(`&#127881; It's ${person.name.split(' ')[0]}'s birthday today!`, 'success');
    }
  });

  // Update notification badge
  updateNotifBadge();
  loadNotifications();
}

function showBirthdayModal(person) {
  openModal(`
    <div class="modal-body" style="text-align:center;padding:2.5rem">
      <div style="font-size:4rem;margin-bottom:1rem">&#127881;</div>
      <h2 style="font-family:var(--font-display);font-size:1.6rem;font-weight:800;margin-bottom:0.5rem">
        Happy Birthday, ${person.name.split(' ')[0]}!
      </h2>
      <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:1.5rem">
        WorkBuddy and your entire team wish you an amazing birthday.<br>
        May this year bring you great success and joy!
      </p>
      <div style="display:flex;justify-content:center;gap:0.5rem;font-size:1.5rem;margin-bottom:1.5rem">
        &#127880; &#10024; &#127882; &#10024; &#127880;
      </div>
      <button class="btn btn-primary" onclick="closeModal()" style="padding:0.75rem 2rem;font-size:1rem">
        Thank you! &#128515;
      </button>
    </div>
  `);
}


/* ═══════════════════════════════════════════════
   BIRTHDAY BANNER BUILDER
   Called from admin dashboard
════════════════════════════════════════════════ */
function buildBirthdayBanner() {
  const birthdays = getTodayBirthdays();
  if (!birthdays.length) return '';

  const names = birthdays.map(p => p.name.split(' ')[0]).join(', ');
  return `
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:var(--radius);padding:1rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:1rem;color:#fff">
      <span style="font-size:2rem">&#127881;</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:0.925rem">Birthday Alert!</div>
        <div style="font-size:0.82rem;opacity:0.85">
          Today is ${names}'s birthday. Send them a wish and make them feel special!
        </div>
      </div>
      <button class="btn" style="background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3)"
        onclick="showToast('&#127881; Wish sent to ${names}!', \'success\')">
        Send Wish &#127881;
      </button>
    </div>
  `;
}


/* ── TOPBAR AVATAR HELPER ── */
function updateTopbarAvatar(user) {
  const el = document.getElementById('topbar-avatar');
  if (!el) return;

  // Fetch full user to get avatarImg
  const full = getUserById(user.id);
  if (full?.avatarImg) {
    el.innerHTML = `<img src="${full.avatarImg}" alt="${full.name}"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
  } else {
    el.innerHTML = `<span id="avatar-initials">${getInitials(user.name)}</span>`;
  }
}


/* ── AVATAR HTML BUILDER ──
   Call this anywhere you need to show a user avatar.
   Automatically shows their photo if they have one,
   otherwise falls back to initials.
── */
function buildAvatar(user, size = 36) {
  if (!user) return `<div class="emp-avatar" style="width:${size}px;height:${size}px;font-size:${size*0.3}px">?</div>`;

  const full = getUserById(user.id || user) || user;
  const fontSize = Math.round(size * 0.3);

  if (full.avatarImg) {
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0">
      <img src="${full.avatarImg}" alt="${full.name}" style="width:100%;height:100%;object-fit:cover" />
    </div>`;
  }

  return `<div class="emp-avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;flex-shrink:0">
    ${getInitials(full.name || '?')}
  </div>`;
}
