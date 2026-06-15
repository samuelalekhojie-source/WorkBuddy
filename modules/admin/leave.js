/* ═══════════════════════════════════════════════
   LEAVE MANAGEMENT MODULE
   - All leave requests with approve/reject
   - Leave balance overview per employee
   - Filter by status and type
════════════════════════════════════════════════ */

function renderLeaveManagement() {
  const leaves    = getLeaveRequests();
  const pending   = leaves.filter(l => l.status === 'pending').length;
  const approved  = leaves.filter(l => l.status === 'approved').length;
  const rejected  = leaves.filter(l => l.status === 'rejected').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Leave Management</h2>
        <p>${pending} pending requests requiring action</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="showLeaveBalances()">
          <i data-lucide="bar-chart-2"></i> Leave Balances
        </button>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="clock"></i></div>
        <div class="stat-info"><div class="stat-value">${pending}</div><div class="stat-label">Pending</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-info"><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i data-lucide="x-circle"></i></div>
        <div class="stat-info"><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="calendar-days"></i></div>
        <div class="stat-info"><div class="stat-value">${leaves.length}</div><div class="stat-label">Total Requests</div></div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:1rem">
      <div class="filter-row">
        <select id="leave-status-filter" onchange="filterLeaveRequests()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select id="leave-type-filter" onchange="filterLeaveRequests()">
          <option value="">All Types</option>
          <option value="Annual Leave">Annual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Emergency Leave">Emergency Leave</option>
          <option value="Maternity Leave">Maternity Leave</option>
          <option value="Paternity Leave">Paternity Leave</option>
        </select>
      </div>
    </div>

    <!-- Leave Requests -->
    <div id="leave-list">
      ${buildLeaveCards(leaves)}
    </div>
  `);
}

function buildLeaveCards(leaves) {
  if (!leaves.length) {
    return `<div class="card"><div class="empty-state">
      <i data-lucide="calendar-x"></i>
      <h3>No leave requests</h3>
      <p>All leave requests will appear here</p>
    </div></div>`;
  }

  const sorted = [...leaves].sort((a,b) => {
    // Pending first, then by date
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.appliedDate) - new Date(a.appliedDate);
  });

  return sorted.map(leave => {
    const emp = getUserById(leave.userId);
    const reviewer = leave.reviewedBy ? getUserById(leave.reviewedBy) : null;
    const isPending = leave.status === 'pending';

    return `
      <div class="leave-card ${isPending ? 'leave-pending' : ''}">
        <div class="leave-card-header">
          <div class="emp-cell">
            <div class="emp-avatar">${emp ? getInitials(emp.name) : '??'}</div>
            <div>
              <div class="emp-name">${emp?.name || 'Unknown'}</div>
              <div class="emp-email">${emp?.department || ''} · ${emp?.position || ''}</div>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <span class="badge badge-blue">${leave.type}</span>
            <span class="badge ${getLeaveStatusBadge(leave.status)}">${capitalize(leave.status)}</span>
          </div>
        </div>

        <div class="leave-details">
          <div class="leave-detail-item">
            <span class="leave-detail-label">Duration</span>
            <span class="leave-detail-val">${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}</span>
          </div>
          <div class="leave-detail-item">
            <span class="leave-detail-label">Days</span>
            <span class="leave-detail-val font-bold" style="color:var(--blue-primary)">${leave.days} day${leave.days>1?'s':''}</span>
          </div>
          <div class="leave-detail-item">
            <span class="leave-detail-label">Applied</span>
            <span class="leave-detail-val">${formatDate(leave.appliedDate)}</span>
          </div>
          ${reviewer ? `
            <div class="leave-detail-item">
              <span class="leave-detail-label">Reviewed by</span>
              <span class="leave-detail-val">${reviewer.name}</span>
            </div>
          ` : ''}
        </div>

        <div class="leave-reason">
          <span class="leave-detail-label">Reason: </span>
          <span>${leave.reason}</span>
        </div>

        ${leave.comment ? `
          <div class="leave-comment">
            <i data-lucide="message-circle"></i>
            <span>${leave.comment}</span>
          </div>
        ` : ''}

        ${isPending ? `
          <div class="leave-actions">
            <button class="btn btn-secondary" onclick="openReviewModal('${leave.id}', 'rejected')">
              <i data-lucide="x"></i> Reject
            </button>
            <button class="btn btn-primary" onclick="openReviewModal('${leave.id}', 'approved')">
              <i data-lucide="check"></i> Approve
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function filterLeaveRequests() {
  const status = document.getElementById('leave-status-filter').value;
  const type   = document.getElementById('leave-type-filter').value;
  let leaves   = getLeaveRequests();
  if (status) leaves = leaves.filter(l => l.status === status);
  if (type)   leaves = leaves.filter(l => l.type === type);
  document.getElementById('leave-list').innerHTML = buildLeaveCards(leaves);
  lucide.createIcons();
}

function openReviewModal(leaveId, action) {
  const leave = getLeaveRequests().find(l => l.id === leaveId);
  const emp   = getUserById(leave.userId);

  openModal(`
    <div class="modal-header">
      <h3>${capitalize(action)} Leave Request</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div style="background:var(--surface-2);padding:0.75rem;border-radius:var(--radius-sm);margin-bottom:1rem">
        <strong>${emp?.name}</strong> — ${leave.type} (${leave.days} days)<br>
        <span class="text-sm text-secondary">${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}</span><br>
        <span class="text-sm">${leave.reason}</span>
      </div>
      <div class="form-group">
        <label>Comment (optional)</label>
        <textarea id="review-comment" rows="2" placeholder="${action === 'approved' ? 'e.g. Enjoy your break!' : 'e.g. Please reschedule to next month.'}"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn ${action === 'approved' ? 'btn-primary' : 'btn-danger'}" onclick="submitLeaveReview('${leaveId}', '${action}')">
        <i data-lucide="${action === 'approved' ? 'check' : 'x'}"></i> ${capitalize(action)}
      </button>
    </div>
  `);
}

function submitLeaveReview(leaveId, action) {
  const comment  = document.getElementById('review-comment').value.trim();
  const reviewer = getCurrentUser();
  updateLeaveStatus(leaveId, action, reviewer.id, comment);
  addNotification(`Leave request ${action} by ${reviewer.name}`, 'leave');
  auditLog(`Leave request ${action}`, 'leave', `Leave ID: ${leaveId}`);
  closeModal();
  showToast(`Leave request ${action}.`, action === 'approved' ? 'success' : 'warning');
  refreshPage();
}

function showLeaveBalances() {
  const employees = getEmployees();

  openModal(`
    <div class="modal-header">
      <h3>Leave Balances</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Employee</th><th>Annual</th><th>Sick</th><th>Emergency</th></tr>
          </thead>
          <tbody>
            ${employees.map(e => {
              const bal = getLeaveBalance(e.id);
              return `<tr>
                <td>
                  <div class="emp-cell">
                    <div class="emp-avatar" style="width:28px;height:28px;font-size:0.65rem">${getInitials(e.name)}</div>
                    <span>${e.name}</span>
                  </div>
                </td>
                <td><span class="badge badge-blue">${bal.annual} days</span></td>
                <td><span class="badge badge-green">${bal.sick} days</span></td>
                <td><span class="badge badge-yellow">${bal.emergency} days</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `, 'modal-lg');
}
