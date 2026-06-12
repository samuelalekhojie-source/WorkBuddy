function renderEmployeeLeave() {
  const user   = getCurrentUser();
  const leaves = getLeaveByUser(user.id);
  const bal    = getLeaveBalance(user.id);

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>Leave Management</h2><p>Apply for time off and track your requests</p></div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="openLeaveApplicationModal()"><i data-lucide="plus"></i> Apply for Leave</button>
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card"><div class="stat-icon blue"><i data-lucide="umbrella"></i></div><div class="stat-info"><div class="stat-value">${bal.annual}</div><div class="stat-label">Annual Days Left</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i data-lucide="heart-pulse"></i></div><div class="stat-info"><div class="stat-value">${bal.sick}</div><div class="stat-label">Sick Days Left</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow"><i data-lucide="zap"></i></div><div class="stat-info"><div class="stat-value">${bal.emergency}</div><div class="stat-label">Emergency Days</div></div></div>
      <div class="stat-card"><div class="stat-icon indigo"><i data-lucide="clock"></i></div><div class="stat-info"><div class="stat-value">${leaves.filter(l=>l.status==='pending').length}</div><div class="stat-label">Pending</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">My Leave Requests</div></div>
      ${leaves.length === 0
        ? `<div class="empty-state"><i data-lucide="calendar-x"></i><h3>No leave requests</h3><p>Click "Apply for Leave" to get started</p></div>`
        : `<div style="display:flex;flex-direction:column;gap:0.75rem;padding:0.5rem 0">
            ${leaves.slice().reverse().map(l => `
              <div class="leave-card">
                <div class="leave-card-header">
                  <div>
                    <span class="badge badge-blue">${l.type}</span>
                    <span class="text-sm text-muted" style="margin-left:0.5rem">${l.days} day${l.days>1?'s':''}</span>
                  </div>
                  <span class="badge ${getLeaveStatusBadge(l.status)}">${capitalize(l.status)}</span>
                </div>
                <div class="leave-details">
                  <div class="leave-detail-item"><span class="leave-detail-label">From</span><span>${formatDate(l.startDate)}</span></div>
                  <div class="leave-detail-item"><span class="leave-detail-label">To</span><span>${formatDate(l.endDate)}</span></div>
                  <div class="leave-detail-item"><span class="leave-detail-label">Applied</span><span>${formatDate(l.appliedDate)}</span></div>
                </div>
                <div class="leave-reason"><span class="leave-detail-label">Reason: </span>${l.reason}</div>
                ${l.comment ? `<div class="leave-comment"><i data-lucide="message-circle"></i><span>${l.comment}</span></div>` : ''}
              </div>
            `).join('')}
           </div>`
      }
    </div>
  `);
}

function openLeaveApplicationModal() {
  openModal(`
    <div class="modal-header">
      <h3>Apply for Leave</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Leave Type *</label>
        <select id="leave-type">
          <option value="Annual Leave">Annual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Emergency Leave">Emergency Leave</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date *</label><input type="date" id="leave-start" /></div>
        <div class="form-group"><label>End Date *</label><input type="date" id="leave-end" /></div>
      </div>
      <div class="form-group">
        <label>Reason *</label>
        <textarea id="leave-reason" rows="3" placeholder="Please provide a brief reason for your leave request..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitLeaveApplication()"><i data-lucide="send"></i> Submit Request</button>
    </div>
  `);
}

function submitLeaveApplication() {
  const type  = document.getElementById('leave-type').value;
  const start = document.getElementById('leave-start').value;
  const end   = document.getElementById('leave-end').value;
  const reason= document.getElementById('leave-reason').value.trim();

  if (!start || !end || !reason) { showToast('Please fill all fields.', 'error'); return; }
  if (end < start) { showToast('End date must be after start date.', 'error'); return; }

  const startD = new Date(start), endD = new Date(end);
  const days = Math.ceil((endD - startD) / (1000*60*60*24)) + 1;

  addLeaveRequest({ userId: getCurrentUser().id, type, startDate: start, endDate: end, days, reason });
  addNotification(`Leave request submitted by ${getCurrentUser().name}`, 'leave');
  closeModal();
  showToast('Leave request submitted successfully!', 'success');
  refreshPage();
}
