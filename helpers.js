/* helpers.js — shared utility functions loaded before all modules */

/* ═══════════════════════════════════════════════
   SHARED HELPER FUNCTIONS
   These are used across both admin and employee
   modules so they live here in app.js where
   every module can access them globally.
════════════════════════════════════════════════ */

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
