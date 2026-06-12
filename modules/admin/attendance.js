/* ═══════════════════════════════════════════════
   ADMIN ATTENDANCE MODULE
   - Today's attendance overview with status per employee
   - Weekly summary table
   - Manual mark attendance
   - AI anomaly detection per employee
════════════════════════════════════════════════ */

function renderAdminAttendance() {
  const employees = getEmployees();
  const todayAtt  = getTodayAttendance();
  const allAtt    = getAttendance();
  const today     = new Date().toISOString().split('T')[0];

  // Map today's records by userId for fast lookup
  const todayMap = {};
  todayAtt.forEach(a => { todayMap[a.userId] = a; });

  const present = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const late    = todayAtt.filter(a => a.status === 'late').length;
  const absent  = employees.filter(e => !todayMap[e.id]).length;
  const onLeave = employees.filter(e => {
    const leaves = getLeaveByUser(e.id);
    return leaves.some(l => l.status === 'approved' && l.startDate <= today && l.endDate >= today);
  }).length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Attendance</h2>
        <p>${getTodayDateStr()}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="openMarkAttendanceModal()">
          <i data-lucide="clipboard-check"></i> Mark Attendance
        </button>
        <button class="btn btn-primary" onclick="exportAttendance()">
          <i data-lucide="download"></i> Export
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="user-check"></i></div>
        <div class="stat-info"><div class="stat-value">${present}</div><div class="stat-label">Present</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="clock"></i></div>
        <div class="stat-info"><div class="stat-value">${late}</div><div class="stat-label">Late</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i data-lucide="user-x"></i></div>
        <div class="stat-info"><div class="stat-value">${absent}</div><div class="stat-label">Absent</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="calendar-days"></i></div>
        <div class="stat-info"><div class="stat-value">${onLeave}</div><div class="stat-label">On Leave</div></div>
      </div>
    </div>

    <!-- Today's Attendance Table -->
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-header">
        <div class="card-title">Today's Attendance</div>
        <div style="display:flex;gap:0.5rem">
          <select onchange="filterAttByDept(this.value)" style="padding:0.4rem 0.6rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:0.82rem">
            <option value="">All Departments</option>
            ${getDepartments().map(d=>`<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="table-wrapper">
        <table id="att-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="att-tbody">
            ${buildAttendanceRows(employees, todayMap, today)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Weekly History -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent Attendance History</div>
        <span class="badge badge-blue">Last 10 records</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${allAtt.slice(-10).reverse().map(a => {
              const emp = getUserById(a.userId);
              return `<tr>
                <td>
                  <div class="emp-cell">
                    <div class="emp-avatar" style="width:28px;height:28px;font-size:0.65rem">${emp ? getInitials(emp.name) : '??'}</div>
                    <span class="emp-name">${emp ? emp.name : 'Unknown'}</span>
                  </div>
                </td>
                <td>${formatDate(a.date)}</td>
                <td>${a.clockIn || '—'}</td>
                <td>${a.clockOut || '—'}</td>
                <td>${a.hoursWorked ? a.hoursWorked + 'h' : '—'}</td>
                <td><span class="badge ${getAttBadge(a.status)}">${capitalize(a.status)}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function buildAttendanceRows(employees, todayMap, today) {
  return employees.map(emp => {
    const rec = todayMap[emp.id];
    const leaves = getLeaveByUser(emp.id);
    const onLeave = leaves.some(l => l.status === 'approved' && l.startDate <= today && l.endDate >= today);
    const status = onLeave ? 'on-leave' : rec ? rec.status : 'absent';

    return `
      <tr>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar">${getInitials(emp.name)}</div>
            <div><div class="emp-name">${emp.name}</div><div class="emp-email">${emp.department}</div></div>
          </div>
        </td>
        <td>${emp.department}</td>
        <td>${rec?.clockIn || '—'}</td>
        <td>${rec?.clockOut || '—'}</td>
        <td>${rec?.hoursWorked ? rec.hoursWorked + 'h' : '—'}</td>
        <td><span class="badge ${getAttBadge(status)}">${capitalize(status.replace('-', ' '))}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" title="AI Analysis" onclick="showAttendanceInsight('${emp.id}')">
              <i data-lucide="sparkles"></i>
            </button>
            ${!rec && !onLeave ? `
              <button class="btn btn-ghost" title="Mark Present" onclick="adminMarkPresent('${emp.id}')">
                <i data-lucide="check"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAttByDept(dept) {
  const employees = dept ? getEmployees().filter(e => e.department === dept) : getEmployees();
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = getTodayAttendance();
  const todayMap = {};
  todayAtt.forEach(a => { todayMap[a.userId] = a; });
  document.getElementById('att-tbody').innerHTML = buildAttendanceRows(employees, todayMap, today);
  lucide.createIcons();
}

function adminMarkPresent(userId) {
  const existing = getUserTodayAttendance(userId);
  if (existing) { showToast('Attendance already recorded for today.', 'warning'); return; }
  clockIn(userId);
  const rec = getUserTodayAttendance(userId);
  if (rec) { clockOut(userId); }
  showToast('Attendance marked as present.', 'success');
  refreshPage();
}

function openMarkAttendanceModal() {
  const employees = getEmployees();
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <div class="modal-header">
      <h3>Mark Attendance Manually</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Employee *</label>
          <select id="mark-emp">
            <option value="">Select employee</option>
            ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="mark-date" value="${today}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Clock In</label>
          <input type="time" id="mark-in" value="09:00" />
        </div>
        <div class="form-group">
          <label>Clock Out</label>
          <input type="time" id="mark-out" value="17:00" />
        </div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="mark-status">
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveManualAttendance()">
        <i data-lucide="save"></i> Save Record
      </button>
    </div>
  `);
}

function saveManualAttendance() {
  const userId  = document.getElementById('mark-emp').value;
  const date    = document.getElementById('mark-date').value;
  const clockIn = document.getElementById('mark-in').value;
  const clockOut= document.getElementById('mark-out').value;
  const status  = document.getElementById('mark-status').value;

  if (!userId || !date) { showToast('Please select employee and date.', 'error'); return; }

  const [inH,inM]   = clockIn.split(':').map(Number);
  const [outH,outM] = clockOut.split(':').map(Number);
  const hours = parseFloat(((outH*60+outM - inH*60-inM)/60).toFixed(2));

  const att = getAttendance();
  att.push({ id:'att'+Date.now(), userId, date, clockIn, clockOut, status, hoursWorked: hours > 0 ? hours : 0 });
  saveAttendance(att);

  closeModal();
  showToast('Attendance record saved.', 'success');
  refreshPage();
}

async function showAttendanceInsight(userId) {
  const emp = getUserById(userId);
  const records = getAttendanceByUser(userId);
  if (!emp) return;

  openModal(`
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:0.6rem">
        <div class="ai-pulse" style="width:32px;height:32px"><i data-lucide="sparkles"></i></div>
        <h3>AI Attendance Insight — ${emp.name}</h3>
      </div>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div id="insight-result">
        <div class="loading-state"><div class="spinner"></div><span>Analyzing attendance pattern...</span></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);

  const insight = await analyzeAttendancePattern(emp, records);
  const el = document.getElementById('insight-result');
  if (el) el.innerHTML = `<p style="line-height:1.8;color:var(--text)">${insight}</p>`;
}

function exportAttendance() {
  const att = getAttendance();
  const rows = [
    ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Status'],
    ...att.map(a => {
      const emp = getUserById(a.userId);
      return [emp?.name || 'Unknown', a.date, a.clockIn||'', a.clockOut||'', a.hoursWorked||0, a.status];
    })
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'attendance.csv'; anchor.click();
  URL.revokeObjectURL(url);
  showToast('Attendance exported.', 'success');
}

function getAttBadge(status) {
  return { present:'badge-green', late:'badge-yellow', absent:'badge-red', 'on-leave':'badge-blue' }[status] || 'badge-gray';
}
