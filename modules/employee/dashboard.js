function renderEmployeeDashboard() {
  const user     = getCurrentUser();
  const att      = getAttendanceByUser(user.id);
  const leaves   = getLeaveByUser(user.id);
  const payroll  = getPayrollByUser(user.id);
  const reviews  = getReviewsByUser(user.id);
  const today    = new Date().toISOString().split('T')[0];
  const todayRec = getUserTodayAttendance(user.id);
  const bal      = getLeaveBalance(user.id);
  const lastPay  = payroll[payroll.length - 1];
  const lastRev  = reviews[reviews.length - 1];
  const myTasks  = getPendingTasksByUser(user.id);
  const overdue  = myTasks.filter(t => t.dueDate < today);
  const isBirthday = getTodayBirthdays().some(p => p.id === user.id);

  setPageContent(`
    <div class="dashboard-wrap">

      <!-- HEADER -->
      <div class="page-header">
        <div class="page-header-text">
          <h2>Good ${getGreeting()}, ${user.name.split(' ')[0]} ${isBirthday ? '&#127881;' : '&#128075;'}</h2>
          <p class="text-secondary">${getTodayDateStr()}</p>
        </div>
      </div>

      <!-- BIRTHDAY CARD -->
      ${isBirthday ? `
        <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:var(--radius);padding:1.25rem 1.5rem;margin-bottom:1.25rem;color:#fff;display:flex;align-items:center;gap:1rem">
          <span style="font-size:2.5rem">&#127881;</span>
          <div>
            <div style="font-family:var(--font-display);font-weight:800;font-size:1.1rem">Happy Birthday!</div>
            <div style="opacity:0.85;font-size:0.875rem;margin-top:0.2rem">Your whole team is celebrating you today. Have an amazing day!</div>
          </div>
        </div>
      ` : ''}

      <!-- TASK ALERT -->
      ${myTasks.length ? `
        <div class="alert-chip ${overdue.length ? 'overdue-chip' : 'task-chip'}" onclick="navigate('emp-tasks')" style="cursor:pointer;margin-bottom:1.25rem;display:flex">
          <i data-lucide="${overdue.length ? 'alert-triangle' : 'clipboard-list'}"></i>
          <span>
            ${overdue.length
              ? `<strong>${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue</strong> — tap to review`
              : `<strong>${myTasks.length} task${myTasks.length > 1 ? 's' : ''}</strong> assigned to you`}
          </span>
          <span class="alert-action" style="margin-left:auto">View &#8594;</span>
        </div>
      ` : ''}

      <!-- CLOCK IN / OUT CARD -->
      <div class="clock-card" style="margin-bottom:1.25rem">
        <div class="clock-info">
          <div class="clock-time" id="live-clock">--:--</div>
          <div class="clock-date">${new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'})}</div>
          <div class="clock-status" style="margin-top:0.5rem">
            ${todayRec
              ? `<span class="badge ${todayRec.clockOut ? 'badge-gray' : 'badge-green'}">
                  ${todayRec.clockOut ? 'Clocked out at ' + todayRec.clockOut : 'Clocked in at ' + todayRec.clockIn}
                </span>`
              : `<span class="badge badge-yellow">Not yet clocked in</span>`}
          </div>
        </div>
        <div class="clock-actions">
          ${!todayRec
            ? `<button class="btn btn-primary btn-clock" onclick="empClockIn()"><i data-lucide="log-in"></i> Clock In</button>`
            : !todayRec.clockOut
            ? `<button class="btn btn-danger btn-clock" onclick="empClockOut()"><i data-lucide="log-out"></i> Clock Out</button>`
            : `<div style="text-align:center">
                <i data-lucide="check-circle" style="width:32px;height:32px;color:var(--success);display:block;margin:0 auto 0.4rem"></i>
                <div class="text-sm text-secondary">Done for today</div>
                <div class="text-xs text-muted">${todayRec.hoursWorked}h logged</div>
              </div>`}
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="calendar-check"></i></div>
          <div class="stat-info">
            <div class="stat-value">${att.filter(a=>a.status==='present'||a.status==='late').length}</div>
            <div class="stat-label">Days Present</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="umbrella"></i></div>
          <div class="stat-info">
            <div class="stat-value">${bal.annual}</div>
            <div class="stat-label">Leave Days Left</div>
          </div>
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
            <div class="stat-label">Last Rating</div>
          </div>
        </div>
      </div>

      <!-- BOTTOM GRID -->
      <div class="dashboard-grid">

        <!-- Recent attendance -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Recent Attendance</div>
            <button class="btn btn-ghost text-sm" onclick="navigate('emp-attendance')">View all <i data-lucide="arrow-right"></i></button>
          </div>
          ${att.length === 0
            ? `<div class="empty-state" style="padding:1.5rem"><i data-lucide="clock"></i><p>No records yet</p></div>`
            : `<div class="activity-list">
                ${att.slice(-5).reverse().map(a => `
                  <div class="activity-item">
                    <span class="badge ${getAttBadge(a.status)}">${capitalize(a.status)}</span>
                    <div class="activity-info">
                      <div class="activity-name">${formatDate(a.date)}</div>
                      <div class="activity-sub">${a.clockIn||'—'} &#8594; ${a.clockOut||'—'} · ${a.hoursWorked||0}h</div>
                    </div>
                  </div>`).join('')}
              </div>`}
        </div>

        <!-- Leave summary -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Leave Overview</div>
            <button class="btn btn-primary text-sm" onclick="navigate('emp-leave')"><i data-lucide="plus"></i> Apply</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem">
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
          ${leaves.length === 0
            ? `<p class="text-sm text-muted">No recent requests</p>`
            : leaves.slice(-2).reverse().map(l => `
              <div class="activity-item">
                <span class="badge ${getLeaveStatusBadge(l.status)}">${capitalize(l.status)}</span>
                <div class="activity-info">
                  <div class="activity-name">${l.type} · ${l.days}d</div>
                  <div class="activity-sub">${formatDate(l.startDate)} &#8594; ${formatDate(l.endDate)}</div>
                </div>
              </div>`).join('')}
        </div>

      </div>
    </div>
  `);

  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const el = document.getElementById('live-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function empClockIn() {
  const user = getCurrentUser();
  if (getUserTodayAttendance(user.id)) { showToast('Already clocked in today.', 'warning'); return; }
  clockIn(user.id);
  showToast('Clocked in! Have a great day.', 'success');
  refreshPage();
}

function empClockOut() {
  const user = getCurrentUser();
  const rec  = getUserTodayAttendance(user.id);
  if (!rec)          { showToast('You have not clocked in today.', 'error'); return; }
  if (rec.clockOut)  { showToast('Already clocked out.', 'warning'); return; }
  clockOut(user.id);
  showToast('Clocked out. Have a great evening!', 'success');
  refreshPage();
}
