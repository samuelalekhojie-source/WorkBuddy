function renderEmployeeDashboard() {
  const user    = getCurrentUser();
  const att     = getAttendanceByUser(user.id);
  const leaves  = getLeaveByUser(user.id);
  const payroll = getPayrollByUser(user.id);
  const reviews = getReviewsByUser(user.id);
  const today   = new Date().toISOString().split('T')[0];
  const todayRec= getUserTodayAttendance(user.id);
  const bal     = getLeaveBalance(user.id);
  const lastPay = payroll[payroll.length - 1];
  const lastRev = reviews[reviews.length - 1];
  const presentDays = att.filter(a => a.status === 'present' || a.status === 'late').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Good ${getGreeting()}, ${user.name.split(' ')[0]} 👋</h2>
        <p>${getTodayDateStr()}</p>
      </div>
    </div>

    <!-- Clock in/out card -->
    <div class="clock-card" style="margin-bottom:1.25rem">
      <div class="clock-info">
        <div class="clock-time" id="live-clock">--:--</div>
        <div class="clock-date">${new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'})}</div>
        <div class="clock-status">
          ${todayRec
            ? `<span class="badge ${todayRec.clockOut ? 'badge-gray' : 'badge-green'}">
                ${todayRec.clockOut ? 'Clocked Out' : 'Currently Clocked In'} · ${todayRec.clockIn}
               </span>`
            : `<span class="badge badge-yellow">Not yet clocked in</span>`
          }
        </div>
      </div>
      <div class="clock-actions">
        ${!todayRec ? `
          <button class="btn btn-primary btn-clock" onclick="empClockIn()">
            <i data-lucide="log-in"></i> Clock In
          </button>
        ` : !todayRec.clockOut ? `
          <button class="btn btn-danger btn-clock" onclick="empClockOut()">
            <i data-lucide="log-out"></i> Clock Out
          </button>
        ` : `
          <div style="text-align:center;color:var(--text-secondary)">
            <i data-lucide="check-circle" style="width:32px;height:32px;color:var(--success);margin:0 auto 0.5rem;display:block"></i>
            <div class="text-sm">Done for today!</div>
            <div class="text-xs text-muted">${todayRec.hoursWorked}h worked</div>
          </div>
        `}
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="calendar-check"></i></div>
        <div class="stat-info"><div class="stat-value">${presentDays}</div><div class="stat-label">Days Present</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="umbrella"></i></div>
        <div class="stat-info"><div class="stat-value">${bal.annual}</div><div class="stat-label">Annual Leave Left</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="banknote"></i></div>
        <div class="stat-info">
          <div class="stat-value">${lastPay ? formatCurrency(lastPay.netSalary) : '—'}</div>
          <div class="stat-label">Last Net Pay</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="star"></i></div>
        <div class="stat-info">
          <div class="stat-value">${lastRev ? lastRev.overallRating + '/5' : '—'}</div>
          <div class="stat-label">Last Review</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Recent attendance -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Recent Attendance</div>
          <button class="btn btn-ghost text-sm" onclick="navigate('emp-attendance')">View all <i data-lucide="arrow-right"></i></button>
        </div>
        <div class="activity-list">
          ${att.slice(-5).reverse().map(a => `
            <div class="activity-item">
              <span class="badge ${getAttBadge(a.status)}">${capitalize(a.status)}</span>
              <div class="activity-info">
                <div class="activity-name">${formatDate(a.date)}</div>
                <div class="activity-sub">${a.clockIn||'—'} → ${a.clockOut||'—'} · ${a.hoursWorked||0}h</div>
              </div>
            </div>
          `).join('') || '<div class="empty-state" style="padding:1rem"><p>No records yet</p></div>'}
        </div>
      </div>

      <!-- Leave balances + recent -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Leave Overview</div>
          <button class="btn btn-primary text-sm" onclick="navigate('emp-leave')"><i data-lucide="plus"></i> Apply</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:1rem">
          <div class="pstat" style="background:var(--blue-faint)">
            <span class="pstat-val">${bal.annual}</span><span class="pstat-lbl">Annual</span>
          </div>
          <div class="pstat" style="background:var(--success-bg)">
            <span class="pstat-val" style="color:var(--success)">${bal.sick}</span><span class="pstat-lbl">Sick</span>
          </div>
          <div class="pstat" style="background:var(--warning-bg)">
            <span class="pstat-val" style="color:var(--warning)">${bal.emergency}</span><span class="pstat-lbl">Emergency</span>
          </div>
        </div>
        ${leaves.slice(-2).reverse().map(l => `
          <div class="activity-item">
            <span class="badge ${getLeaveStatusBadge(l.status)}">${capitalize(l.status)}</span>
            <div class="activity-info">
              <div class="activity-name">${l.type} — ${l.days} day${l.days>1?'s':''}</div>
              <div class="activity-sub">${formatDate(l.startDate)} → ${formatDate(l.endDate)}</div>
            </div>
          </div>
        `).join('') || '<p class="text-sm text-muted" style="padding:0.5rem 0">No recent requests</p>'}
      </div>
    </div>
  `);

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-NG', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

function empClockIn() {
  const user = getCurrentUser();
  const existing = getUserTodayAttendance(user.id);
  if (existing) { showToast('Already clocked in today.', 'warning'); return; }
  clockIn(user.id);
  showToast('Clocked in successfully!', 'success');
  refreshPage();
}

function empClockOut() {
  const user = getCurrentUser();
  const rec = getUserTodayAttendance(user.id);
  if (!rec) { showToast('You have not clocked in today.', 'error'); return; }
  if (rec.clockOut) { showToast('Already clocked out.', 'warning'); return; }
  clockOut(user.id);
  showToast('Clocked out. Have a great evening!', 'success');
  refreshPage();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function getTodayDateStr() {
  return new Date().toLocaleDateString('en-NG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
