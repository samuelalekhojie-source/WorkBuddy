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
          ${record?.paystackRef ? `<div style="grid-column:1/-1"><span class="text-muted text-sm">Paystack Reference</span><div class="font-semibold" style="font-family:monospace;color:var(--success);font-size:0.85rem">${record.paystackRef}</div></div>` : ''}
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


/* ═══════════════════════════════════════════════
   SKELETON LOADERS
   Each page has a matching skeleton that shows
   while the real content is rendering.
   Feels like a native app.
════════════════════════════════════════════════ */

const SKELETONS = {

  // Dashboard skeleton — matches stat cards + chart + activity layout
  'admin-dashboard': () => `
    <div class="dashboard-wrap">
      <div class="page-header">
        <div><div class="skeleton sk-title" style="width:260px"></div><div class="skeleton sk-line w-40"></div></div>
        <div style="display:flex;gap:0.5rem">
          <div class="skeleton" style="width:120px;height:36px;border-radius:8px"></div>
          <div class="skeleton" style="width:140px;height:36px;border-radius:8px"></div>
        </div>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        ${[1,2,3,4].map(() => `
          <div class="sk-stat-card">
            <div class="skeleton sk-box" style="width:44px;height:44px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:28px;width:60%;margin-bottom:6px;border-radius:6px"></div>
              <div class="skeleton sk-line w-80"></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="dash-main-grid">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="sk-card">
            <div class="skeleton sk-title w-40"></div>
            <div style="display:flex;align-items:flex-end;gap:6px;height:130px;padding-top:1rem">
              ${[65,80,55,90,70,85,60].map(h => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end">
                    <div class="skeleton" style="width:100%;height:${h}%;border-radius:4px 4px 0 0"></div>
                  </div>
                  <div class="skeleton" style="height:10px;width:24px;border-radius:3px"></div>
                </div>`).join('')}
            </div>
          </div>
          <div class="sk-card">
            <div class="skeleton sk-title w-40"></div>
            <div style="display:flex;align-items:center;gap:1.5rem">
              <div class="skeleton sk-circle" style="width:130px;height:130px;flex-shrink:0"></div>
              <div style="flex:1">
                ${[1,2,3,4].map(() => `<div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:8px">
                  <div class="skeleton sk-circle" style="width:10px;height:10px;flex-shrink:0"></div>
                  <div class="skeleton sk-line" style="flex:1"></div>
                  <div class="skeleton" style="width:20px;height:14px;border-radius:4px"></div>
                </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="sk-card" style="height:120px">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <div class="skeleton sk-circle" style="width:36px;height:36px;flex-shrink:0"></div>
              <div style="flex:1"><div class="skeleton sk-line w-40"></div><div class="skeleton sk-line w-60"></div></div>
            </div>
            <div class="skeleton sk-line w-80"></div>
            <div class="skeleton sk-line w-60"></div>
          </div>
          <div class="sk-card">
            <div class="skeleton sk-title w-40"></div>
            ${[1,2,3].map(() => `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0;border-bottom:1px solid var(--border-light)">
              <div class="skeleton sk-circle" style="width:36px;height:36px;flex-shrink:0"></div>
              <div style="flex:1"><div class="skeleton sk-line w-60"></div><div class="skeleton sk-line w-40"></div></div>
              <div class="skeleton" style="width:60px;height:22px;border-radius:6px"></div>
            </div>`).join('')}
          </div>
          <div class="sk-card">
            <div class="skeleton sk-title w-40"></div>
            ${[1,2,3].map(() => `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0;border-bottom:1px solid var(--border-light)">
              <div class="skeleton sk-circle" style="width:36px;height:36px;flex-shrink:0"></div>
              <div style="flex:1"><div class="skeleton sk-line w-60"></div><div class="skeleton sk-line w-40"></div></div>
              <div class="skeleton" style="width:60px;height:28px;border-radius:8px"></div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`,

  // Table page skeleton — employees, attendance, payroll, tasks, interviews
  'table-page': () => `
    <div>
      <div class="page-header">
        <div><div class="skeleton sk-title" style="width:180px"></div><div class="skeleton sk-line w-40"></div></div>
        <div style="display:flex;gap:0.5rem">
          <div class="skeleton" style="width:110px;height:36px;border-radius:8px"></div>
          <div class="skeleton" style="width:130px;height:36px;border-radius:8px"></div>
        </div>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
        ${[1,2,3,4].map(() => `
          <div class="sk-stat-card">
            <div class="skeleton sk-box" style="width:44px;height:44px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:26px;width:50%;margin-bottom:6px;border-radius:6px"></div>
              <div class="skeleton sk-line w-70"></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="sk-card">
        <div class="skeleton sk-title w-40" style="margin-bottom:1rem"></div>
        <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
          <div class="skeleton" style="flex:1;height:38px;border-radius:8px"></div>
          <div class="skeleton" style="width:140px;height:38px;border-radius:8px"></div>
          <div class="skeleton" style="width:140px;height:38px;border-radius:8px"></div>
        </div>
        <div style="border:1px solid var(--border-light);border-radius:8px;overflow:hidden">
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:0;background:var(--surface-2);padding:0.75rem 1rem">
            ${[1,2,3,4,5].map(() => `<div class="skeleton" style="height:12px;width:70%;border-radius:4px"></div>`).join('')}
          </div>
          ${[1,2,3,4,5].map(() => `
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:0;padding:0.85rem 1rem;border-top:1px solid var(--border-light);align-items:center">
              <div style="display:flex;gap:0.75rem;align-items:center">
                <div class="skeleton sk-circle" style="width:36px;height:36px;flex-shrink:0"></div>
                <div style="flex:1"><div class="skeleton sk-line w-60"></div><div class="skeleton sk-line w-40" style="height:11px"></div></div>
              </div>
              <div class="skeleton" style="height:22px;width:80px;border-radius:6px"></div>
              <div class="skeleton sk-line w-60"></div>
              <div class="skeleton" style="height:22px;width:60px;border-radius:6px"></div>
              <div style="display:flex;gap:0.35rem">
                <div class="skeleton" style="width:28px;height:28px;border-radius:6px"></div>
                <div class="skeleton" style="width:28px;height:28px;border-radius:6px"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`,

  // Card grid skeleton — recruitment jobs
  'card-grid': () => `
    <div>
      <div class="page-header">
        <div><div class="skeleton sk-title" style="width:200px"></div><div class="skeleton sk-line w-40"></div></div>
        <div style="display:flex;gap:0.5rem">
          <div class="skeleton" style="width:140px;height:36px;border-radius:8px"></div>
          <div class="skeleton" style="width:120px;height:36px;border-radius:8px"></div>
        </div>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
        ${[1,2,3,4].map(() => `
          <div class="sk-stat-card">
            <div class="skeleton sk-box" style="width:44px;height:44px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:26px;width:50%;margin-bottom:6px;border-radius:6px"></div>
              <div class="skeleton sk-line w-70"></div>
            </div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem">
        ${[1,2,3].map(() => `
          <div class="sk-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
              <div style="flex:1"><div class="skeleton sk-title w-80"></div><div class="skeleton sk-line w-60"></div></div>
              <div class="skeleton" style="width:50px;height:22px;border-radius:6px"></div>
            </div>
            <div class="skeleton sk-line"></div>
            <div class="skeleton sk-line w-80" style="margin-bottom:0.75rem"></div>
            <div class="skeleton sk-line w-40" style="margin-bottom:1rem"></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;background:var(--surface-2);padding:0.75rem;border-radius:8px;margin-bottom:0.75rem">
              ${[1,2,3,4].map(() => `<div style="text-align:center"><div class="skeleton" style="height:20px;width:30px;margin:0 auto 4px;border-radius:4px"></div><div class="skeleton" style="height:10px;border-radius:3px"></div></div>`).join('')}
            </div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end">
              <div class="skeleton" style="width:90px;height:34px;border-radius:8px"></div>
              <div class="skeleton" style="width:110px;height:34px;border-radius:8px"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>`,

  // Profile skeleton
  'emp-profile': () => `
    <div>
      <div class="page-header"><div class="skeleton sk-title" style="width:140px"></div></div>
      <div class="profile-page-grid">
        <div class="sk-card" style="text-align:center;padding:2rem">
          <div class="skeleton sk-circle" style="width:80px;height:80px;margin:0 auto 1rem"></div>
          <div class="skeleton sk-line w-60" style="margin:0 auto 6px"></div>
          <div class="skeleton sk-line w-40" style="margin:0 auto 12px"></div>
          <div class="skeleton" style="height:22px;width:80px;border-radius:6px;margin:0 auto"></div>
        </div>
        <div class="sk-card">
          <div class="skeleton sk-title w-40"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            ${[1,2,3,4,5,6].map(() => `
              <div style="padding:0.6rem 0.75rem;background:var(--surface-2);border-radius:var(--radius-sm)">
                <div class="skeleton" style="height:10px;width:50%;margin-bottom:6px;border-radius:3px"></div>
                <div class="skeleton sk-line w-80"></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`,

  // Generic content skeleton for other pages
  'default': () => `
    <div>
      <div class="page-header">
        <div><div class="skeleton sk-title" style="width:200px"></div><div class="skeleton sk-line w-40"></div></div>
        <div class="skeleton" style="width:130px;height:36px;border-radius:8px"></div>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
        ${[1,2,3,4].map(() => `
          <div class="sk-stat-card">
            <div class="skeleton sk-box" style="width:44px;height:44px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:26px;width:50%;margin-bottom:6px;border-radius:6px"></div>
              <div class="skeleton sk-line w-70"></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="sk-card">
        <div class="skeleton sk-title w-40" style="margin-bottom:1rem"></div>
        ${[1,2,3,4].map(() => `
          <div style="display:flex;align-items:center;gap:1rem;padding:0.85rem 0;border-bottom:1px solid var(--border-light)">
            <div class="skeleton sk-circle" style="width:36px;height:36px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton sk-line w-60"></div>
              <div class="skeleton sk-line w-40" style="height:11px"></div>
            </div>
            <div class="skeleton" style="width:70px;height:22px;border-radius:6px"></div>
          </div>`).join('')}
      </div>
    </div>`
};

// Map routes to skeleton types
const SKELETON_MAP = {
  'admin-dashboard':   'admin-dashboard',
  'admin-employees':   'table-page',
  'admin-attendance':  'table-page',
  'admin-leave':       'table-page',
  'admin-payroll':     'table-page',
  'admin-tasks':       'table-page',
  'admin-interviews':  'table-page',
  'admin-performance': 'table-page',
  'admin-recruitment': 'card-grid',
  'emp-dashboard':     'admin-dashboard',
  'emp-profile':       'emp-profile',
  'emp-attendance':    'table-page',
  'emp-leave':         'table-page',
  'emp-payslips':      'table-page',
  'emp-tasks':         'table-page',
  'emp-performance':   'table-page',
};

function getSkeletonHTML(routeId) {
  const type = SKELETON_MAP[routeId] || 'default';
  const fn   = SKELETONS[type] || SKELETONS['default'];
  return fn();
}


/* ═══════════════════════════════════════════════
   GLOBAL SEARCH ENGINE
   Searches across:
   - Employees (name, email, department, position)
   - Job postings (title, department)
   - Applicants (name, email, skills)
   - Leave requests (employee name, type)
   - Tasks (title, description)
   - Pages / navigation items
════════════════════════════════════════════════ */

let searchTimeout = null;

function handleGlobalSearch(query) {
  const clearBtn   = document.getElementById('search-clear-btn');
  const dropdown   = document.getElementById('search-dropdown');

  if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

  // Debounce — wait 200ms after user stops typing
  clearTimeout(searchTimeout);

  if (!query.trim()) {
    closeSearchDropdown();
    return;
  }

  searchTimeout = setTimeout(() => {
    const results = runGlobalSearch(query.trim().toLowerCase());
    renderSearchResults(results, query.trim());
  }, 200);
}

function runGlobalSearch(q) {
  const user    = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const results = [];

  // ── PAGES ──
  const adminPages = [
    { label: 'Dashboard',          route: 'admin-dashboard',   icon: 'layout-dashboard', desc: 'Company overview and stats' },
    { label: 'Employees',          route: 'admin-employees',   icon: 'users',             desc: 'Manage all staff' },
    { label: 'Recruitment',        route: 'admin-recruitment', icon: 'briefcase',         desc: 'Jobs and applicants' },
    { label: 'Attendance',         route: 'admin-attendance',  icon: 'clock',             desc: 'Track daily attendance' },
    { label: 'Leave Management',   route: 'admin-leave',       icon: 'calendar-days',     desc: 'Approve leave requests' },
    { label: 'Payroll',            route: 'admin-payroll',     icon: 'banknote',          desc: 'Process salaries' },
    { label: 'Performance',        route: 'admin-performance', icon: 'bar-chart-2',       desc: 'Employee reviews' },
    { label: 'Task Management',    route: 'admin-tasks',       icon: 'clipboard-list',    desc: 'Assign and track tasks' },
    { label: 'Interviews',         route: 'admin-interviews',  icon: 'calendar-clock',    desc: 'Scheduled interviews' },
    { label: 'AI Assistant',       route: 'admin-ai',          icon: 'sparkles',          desc: 'HR AI and document generation' },
    { label: 'Settings',           route: 'admin-settings',    icon: 'settings',          desc: 'App settings and documentation' },
  ];

  const empPages = [
    { label: 'My Dashboard',   route: 'emp-dashboard',   icon: 'layout-dashboard', desc: 'Your personal overview' },
    { label: 'My Profile',     route: 'emp-profile',     icon: 'user-circle',      desc: 'View and edit your profile' },
    { label: 'My Attendance',  route: 'emp-attendance',  icon: 'clock',            desc: 'Your attendance history' },
    { label: 'Apply for Leave',route: 'emp-leave',       icon: 'calendar-days',    desc: 'Submit leave requests' },
    { label: 'My Payslips',    route: 'emp-payslips',    icon: 'receipt',          desc: 'View salary and payslips' },
    { label: 'My Performance', route: 'emp-performance', icon: 'star',             desc: 'Your reviews and ratings' },
    { label: 'My Tasks',       route: 'emp-tasks',       icon: 'clipboard-list',   desc: 'Tasks assigned to you' },
    { label: 'AI Assistant',   route: 'emp-ai',          icon: 'sparkles',         desc: 'Ask HR questions' },
  ];

  const pages = isAdmin ? adminPages : empPages;
  pages.forEach(p => {
    if (p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) {
      results.push({ type: 'page', icon: p.icon, title: p.label, subtitle: p.desc, action: () => navigate(p.route) });
    }
  });

  if (isAdmin) {
    // ── EMPLOYEES ──
    getUsers().forEach(emp => {
      if (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q)
      ) {
        results.push({
          type:     'employee',
          icon:     'user',
          title:    emp.name,
          subtitle: `${emp.position} · ${emp.department}`,
          avatar:   emp.avatarImg || null,
          initials: getInitials(emp.name),
          badge:    emp.status === 'active' ? 'Active' : 'Inactive',
          badgeColor: emp.status === 'active' ? 'var(--success)' : 'var(--danger)',
          action:   () => { navigate('admin-employees'); setTimeout(() => { const s = document.getElementById('emp-search'); if(s){ s.value = emp.name; filterEmployees(); } }, 400); }
        });
      }
    });

    // ── JOB POSTINGS ──
    getJobPostings().forEach(job => {
      if (job.title.toLowerCase().includes(q) || job.department?.toLowerCase().includes(q)) {
        results.push({
          type:     'job',
          icon:     'briefcase',
          title:    job.title,
          subtitle: `${job.department} · ${job.type} · ${job.status}`,
          badge:    capitalize(job.status),
          badgeColor: job.status === 'open' ? 'var(--success)' : 'var(--text-muted)',
          action:   () => navigate('admin-recruitment')
        });
      }
    });

    // ── APPLICANTS ──
    getApplicants().forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.skills?.toLowerCase().includes(q)) {
        const job = getJobPostings().find(j => j.id === a.jobId);
        results.push({
          type:     'applicant',
          icon:     'user-check',
          title:    a.name,
          subtitle: `Applicant · ${job?.title || 'Unknown role'} · ${a.experience}`,
          badge:    capitalize(a.status),
          badgeColor: a.status === 'shortlisted' ? 'var(--blue-primary)' : a.status === 'hired' ? 'var(--success)' : 'var(--text-muted)',
          action:   () => navigate('admin-recruitment')
        });
      }
    });

    // ── TASKS ──
    getTasks().forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        const emp = getUserById(t.assignedTo);
        results.push({
          type:     'task',
          icon:     'clipboard-list',
          title:    t.title,
          subtitle: `Task · Assigned to ${emp?.name || 'Unknown'} · Due ${formatDate(t.dueDate)}`,
          badge:    capitalize(t.status.replace('-', ' ')),
          badgeColor: t.status === 'completed' ? 'var(--success)' : t.status === 'in-progress' ? 'var(--blue-primary)' : 'var(--warning)',
          action:   () => navigate('admin-tasks')
        });
      }
    });

    // ── LEAVE REQUESTS ──
    getLeaveRequests().forEach(l => {
      const emp = getUserById(l.userId);
      if (emp?.name.toLowerCase().includes(q) || l.type.toLowerCase().includes(q)) {
        results.push({
          type:     'leave',
          icon:     'calendar-days',
          title:    `${emp?.name || 'Unknown'} — ${l.type}`,
          subtitle: `${l.days} days · ${formatDate(l.startDate)} to ${formatDate(l.endDate)}`,
          badge:    capitalize(l.status),
          badgeColor: l.status === 'approved' ? 'var(--success)' : l.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
          action:   () => navigate('admin-leave')
        });
      }
    });
  } else {
    // ── EMPLOYEE SELF SEARCH ──
    const myTasks = getTasksByUser(user.id);
    myTasks.forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({
          type:     'task',
          icon:     'clipboard-list',
          title:    t.title,
          subtitle: `Task · Due ${formatDate(t.dueDate)} · ${capitalize(t.status)}`,
          action:   () => navigate('emp-tasks')
        });
      }
    });

    getLeaveByUser(user.id).forEach(l => {
      if (l.type.toLowerCase().includes(q)) {
        results.push({
          type:     'leave',
          icon:     'calendar-days',
          title:    l.type,
          subtitle: `${l.days} days · ${formatDate(l.startDate)} · ${capitalize(l.status)}`,
          action:   () => navigate('emp-leave')
        });
      }
    });
  }

  return results.slice(0, 12); // cap at 12 results
}

function renderSearchResults(results, query) {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;

  if (!results.length) {
    dropdown.innerHTML = `
      <div class="search-empty">
        <i data-lucide="search-x"></i>
        <span>No results for "<strong>${query}</strong>"</span>
      </div>`;
    dropdown.classList.remove('hidden');
    lucide.createIcons();
    return;
  }

  // Group by type
  const groups = {};
  const typeLabels = {
    page: 'Pages', employee: 'Employees', job: 'Jobs',
    applicant: 'Applicants', task: 'Tasks', leave: 'Leave'
  };

  results.forEach(r => {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  });

  let html = '';
  Object.entries(groups).forEach(([type, items]) => {
    html += `<div class="search-group-label">${typeLabels[type] || type}</div>`;
    items.forEach((item, idx) => {
      html += `
        <div class="search-result-item" onclick="selectSearchResult(${results.indexOf(item)})" id="sr-${results.indexOf(item)}">
          <div class="search-result-icon">
            <i data-lucide="${item.icon}"></i>
          </div>
          <div class="search-result-info">
            <div class="search-result-title">${highlightMatch(item.title, query)}</div>
            <div class="search-result-sub">${item.subtitle || ''}</div>
          </div>
          ${item.badge ? `<span class="search-result-badge" style="color:${item.badgeColor || 'var(--text-muted)'}">${item.badge}</span>` : ''}
        </div>`;
    });
  });

  // Store results for keyboard nav
  window._searchResults = results;
  window._searchIndex   = -1;

  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
  lucide.createIcons();
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(15,138,219,0.2);color:var(--blue-primary);border-radius:2px;padding:0 1px">$1</mark>');
}

function selectSearchResult(idx) {
  const results = window._searchResults || [];
  if (results[idx]) {
    results[idx].action();
    clearSearch();
  }
}

function handleSearchKey(e) {
  const results  = window._searchResults || [];
  const dropdown = document.getElementById('search-dropdown');

  if (e.key === 'Escape') { clearSearch(); return; }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    window._searchIndex = Math.min((window._searchIndex || -1) + 1, results.length - 1);
    highlightSearchItem();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    window._searchIndex = Math.max((window._searchIndex || 0) - 1, 0);
    highlightSearchItem();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const idx = window._searchIndex ?? -1;
    if (idx >= 0 && results[idx]) {
      selectSearchResult(idx);
    }
  }
}

function highlightSearchItem() {
  const idx = window._searchIndex || 0;
  document.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.classList.toggle('search-result-focused', i === idx);
  });
  document.getElementById(`sr-${idx}`)?.scrollIntoView({ block: 'nearest' });
}

function clearSearch() {
  const input    = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  if (input)    input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  closeSearchDropdown();
  window._searchResults = [];
  window._searchIndex   = -1;
}

function closeSearchDropdown() {
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}
