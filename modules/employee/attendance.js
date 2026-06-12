function renderEmployeeAttendance() {
  const user = getCurrentUser();
  const att  = getAttendanceByUser(user.id);
  const todayRec = getUserTodayAttendance(user.id);
  const totalH = att.reduce((s,a) => s + (a.hoursWorked||0), 0);
  const present = att.filter(a=>a.status==='present'||a.status==='late').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>My Attendance</h2><p>${present} days present this period</p></div>
      <div class="page-header-actions">
        ${!todayRec ? `<button class="btn btn-primary" onclick="empClockIn()"><i data-lucide="log-in"></i> Clock In</button>`
        : !todayRec.clockOut ? `<button class="btn btn-danger" onclick="empClockOut()"><i data-lucide="log-out"></i> Clock Out</button>`
        : `<span class="badge badge-green">Done for today ✓</span>`}
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card"><div class="stat-icon green"><i data-lucide="calendar-check"></i></div><div class="stat-info"><div class="stat-value">${present}</div><div class="stat-label">Days Present</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow"><i data-lucide="clock"></i></div><div class="stat-info"><div class="stat-value">${att.filter(a=>a.status==='late').length}</div><div class="stat-label">Late Arrivals</div></div></div>
      <div class="stat-card"><div class="stat-icon blue"><i data-lucide="timer"></i></div><div class="stat-info"><div class="stat-value">${Math.round(totalH)}</div><div class="stat-label">Total Hours</div></div></div>
      <div class="stat-card"><div class="stat-icon indigo"><i data-lucide="trending-up"></i></div><div class="stat-info"><div class="stat-value">${present > 0 ? (totalH/present).toFixed(1) : 0}h</div><div class="stat-label">Avg Per Day</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Attendance History</div></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            ${att.length === 0
              ? `<tr><td colspan="5"><div class="empty-state"><i data-lucide="calendar"></i><p>No attendance records yet</p></div></td></tr>`
              : att.slice().reverse().map(a => `
                <tr>
                  <td>${formatDate(a.date)}</td>
                  <td>${a.clockIn||'—'}</td>
                  <td>${a.clockOut||'—'}</td>
                  <td>${a.hoursWorked||'—'}</td>
                  <td><span class="badge ${getAttBadge(a.status)}">${capitalize(a.status)}</span></td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}
