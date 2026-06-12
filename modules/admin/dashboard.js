/* ═══════════════════════════════════════════════
   ADMIN DASHBOARD MODULE

   This is the first page admins see after login.
   It gives a bird's-eye view of the entire company.

   What we render here:
   1. Stat cards — total employees, present today, pending leaves, payroll due
   2. Charts — attendance trend (bar chart), department breakdown (donut)
   3. Recent activity — latest leave requests, new applicants
   4. Quick actions — shortcuts to common tasks
   5. AI insight — Groq generates a daily HR tip
════════════════════════════════════════════════ */

function renderAdminDashboard() {
  const employees   = getEmployees();
  const todayAtt    = getTodayAttendance();
  const pendingLeave = getPendingLeaves();
  const payroll     = getPayroll();
  const applicants  = getApplicants();
  const reviews     = getPerformanceReviews();

  // ── Compute stats ──
  const totalEmp      = employees.length;
  const presentToday  = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentToday   = employees.filter(e => {
    const rec = todayAtt.find(a => a.userId === e.id);
    return !rec || rec.status === 'absent';
  }).length;
  const pendingCount  = pendingLeave.length;
  const pendingPayroll = payroll.filter(p => p.status === 'pending').length;
  const newApplicants = applicants.filter(a => a.status === 'pending').length;

  // ── Department breakdown ──
  const deptMap = {};
  employees.forEach(e => {
    deptMap[e.department] = (deptMap[e.department] || 0) + 1;
  });
  const depts = Object.entries(deptMap).sort((a,b) => b[1]-a[1]);

  // ── Attendance trend (last 7 days) ──
  const allAtt = getAttendance();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = allAtt.filter(a => a.date === dateStr);
    const present = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    last7.push({
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      present,
      total: totalEmp
    });
  }

  // ── Recent leave requests ──
  const recentLeaves = getLeaveRequests()
    .sort((a,b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, 4);

  // ── Recent applicants ──
  const recentApplicants = applicants.slice(-3).reverse();

  // ── Build the HTML ──
  setPageContent(`
    <div class="dashboard-wrap">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-header-text">
          <h2>Good ${getGreeting()}, ${getCurrentUser().name.split(' ')[0]} 👋</h2>
          <p>${getTodayDateStr()} · Here's what's happening at your company today</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="navigate('admin-attendance')">
            <i data-lucide="clock"></i> View Attendance
          </button>
          <button class="btn btn-primary" onclick="navigate('admin-employees')">
            <i data-lucide="user-plus"></i> Add Employee
          </button>
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="users"></i></div>
          <div class="stat-info">
            <div class="stat-value">${totalEmp}</div>
            <div class="stat-label">Total Employees</div>
            <div class="stat-change up">↑ Active workforce</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="user-check"></i></div>
          <div class="stat-info">
            <div class="stat-value">${presentToday}</div>
            <div class="stat-label">Present Today</div>
            <div class="stat-change ${absentToday > 0 ? 'down' : 'up'}">${absentToday} absent</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow"><i data-lucide="calendar-days"></i></div>
          <div class="stat-info">
            <div class="stat-value">${pendingCount}</div>
            <div class="stat-label">Pending Leave Requests</div>
            <div class="stat-change ${pendingCount > 0 ? 'down' : 'up'}">${pendingCount > 0 ? 'Needs review' : 'All clear'}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i data-lucide="banknote"></i></div>
          <div class="stat-info">
            <div class="stat-value">${pendingPayroll}</div>
            <div class="stat-label">Payroll Pending</div>
            <div class="stat-change down">${pendingPayroll > 0 ? 'Process this month' : 'All processed'}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon indigo"><i data-lucide="briefcase"></i></div>
          <div class="stat-info">
            <div class="stat-value">${newApplicants}</div>
            <div class="stat-label">New Applicants</div>
            <div class="stat-change up">Awaiting AI screening</div>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="dashboard-grid">

        <!-- Attendance Trend Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">Attendance This Week</div>
            <span class="badge badge-blue">Last 7 days</span>
          </div>
          <div class="chart-container">
            <div class="bar-chart" id="att-bar-chart">
              ${last7.map(day => `
                <div class="bar-col">
                  <div class="bar-label-top">${day.present}</div>
                  <div class="bar-wrap">
                    <div class="bar-fill" style="height:${day.total > 0 ? Math.round((day.present/day.total)*100) : 0}%"
                         data-tip="${day.present}/${day.total} present"></div>
                  </div>
                  <div class="bar-label">${day.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Department Donut Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">Employees by Department</div>
            <span class="badge badge-green">${totalEmp} total</span>
          </div>
          <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 120 120">
              ${buildDonutSegments(depts, totalEmp)}
            </svg>
            <div class="donut-center">
              <span class="donut-num">${totalEmp}</span>
              <span class="donut-lbl">Staff</span>
            </div>
          </div>
          <div class="donut-legend">
            ${depts.map((d, i) => `
              <div class="legend-item">
                <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
                <span class="legend-label">${d[0]}</span>
                <span class="legend-val">${d[1]}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- BOTTOM ROW: Recent Activity + Quick Actions -->
      <div class="dashboard-grid">

        <!-- Recent Leave Requests -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Recent Leave Requests</div>
            <button class="btn btn-ghost text-sm" onclick="navigate('admin-leave')">
              View all <i data-lucide="arrow-right"></i>
            </button>
          </div>
          ${recentLeaves.length === 0
            ? `<div class="empty-state"><i data-lucide="calendar-x"></i><p>No leave requests yet</p></div>`
            : `<div class="activity-list">
                ${recentLeaves.map(l => {
                  const emp = getUserById(l.userId);
                  return `
                    <div class="activity-item">
                      <div class="activity-avatar">${emp ? getInitials(emp.name) : '??'}</div>
                      <div class="activity-info">
                        <div class="activity-name">${emp ? emp.name : 'Unknown'}</div>
                        <div class="activity-sub">${l.type} · ${l.days} day${l.days > 1 ? 's' : ''} · ${formatDate(l.startDate)}</div>
                      </div>
                      <span class="badge ${getLeaveStatusBadge(l.status)}">${capitalize(l.status)}</span>
                    </div>
                  `;
                }).join('')}
              </div>`
          }
        </div>

        <!-- Recent Applicants -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">New Applicants</div>
            <button class="btn btn-ghost text-sm" onclick="navigate('admin-recruitment')">
              View all <i data-lucide="arrow-right"></i>
            </button>
          </div>
          ${recentApplicants.length === 0
            ? `<div class="empty-state"><i data-lucide="user-x"></i><p>No applicants yet</p></div>`
            : `<div class="activity-list">
                ${recentApplicants.map(a => {
                  const job = getJobPostings().find(j => j.id === a.jobId);
                  return `
                    <div class="activity-item">
                      <div class="activity-avatar">${getInitials(a.name)}</div>
                      <div class="activity-info">
                        <div class="activity-name">${a.name}</div>
                        <div class="activity-sub">${job ? job.title : 'Unknown role'} · ${a.experience}</div>
                      </div>
                      <button class="btn btn-secondary text-xs" onclick="navigate('admin-recruitment')">
                        Screen
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>`
          }
        </div>

      </div>

      <!-- AI INSIGHT CARD -->
      <div class="card ai-insight-card">
        <div class="ai-insight-header">
          <div class="ai-pulse">
            <i data-lucide="sparkles"></i>
          </div>
          <div>
            <div class="card-title">AI HR Insight</div>
            <div class="text-sm text-secondary">Powered by Groq · Updated daily</div>
          </div>
          <button class="btn btn-secondary" onclick="loadDashboardInsight()" id="insight-refresh-btn">
            <i data-lucide="refresh-cw"></i> Refresh
          </button>
        </div>
        <div class="ai-insight-body" id="ai-insight-body">
          <div class="loading-state" style="padding:1rem 0">
            <div class="spinner"></div>
            <span>Generating insight...</span>
          </div>
        </div>
      </div>

    </div>
  `);

  // Auto-load AI insight
  loadDashboardInsight();
}


/* ═══════════════════════════════════════════════
   AI INSIGHT LOADER
   Calls Groq to generate a contextual HR tip
   based on real data from the app.
════════════════════════════════════════════════ */
async function loadDashboardInsight() {
  const btn = document.getElementById('insight-refresh-btn');
  const body = document.getElementById('ai-insight-body');
  if (!body) return;

  if (btn) btn.disabled = true;
  body.innerHTML = `<div class="loading-state" style="padding:0.5rem 0"><div class="spinner"></div><span>Thinking...</span></div>`;

  const employees  = getEmployees();
  const pending    = getPendingLeaves().length;
  const todayAtt   = getTodayAttendance();
  const present    = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const applicants = getApplicants().filter(a => a.status === 'pending').length;

  const prompt = `You are an HR analytics AI. Based on this data, give ONE specific, actionable HR insight or tip (2-3 sentences max). Be direct and practical, not generic.

Company snapshot:
- Total employees: ${employees.length}
- Present today: ${present}/${employees.length}
- Pending leave requests: ${pending}
- Unscreened applicants: ${applicants}
- Today: ${getTodayDateStr()}

Give one focused insight or recommendation the HR manager should act on today.`;

  const response = await groqChat([{ role: 'user', content: prompt }], { temperature: 0.8, max_tokens: 200 });

  if (body) {
    body.innerHTML = `<p class="ai-insight-text">${response}</p>`;
  }
  if (btn) btn.disabled = false;
}


/* ═══════════════════════════════════════════════
   DONUT CHART BUILDER (pure SVG — no library needed)
   
   This is how real chart libraries work under the hood.
   We calculate the arc path for each segment manually.
════════════════════════════════════════════════ */
const CHART_COLORS = [
  '#0f8adb', '#2db5ec', '#135b99', '#16a34a',
  '#d97706', '#7c3aed', '#dc2626', '#0891b2'
];

function buildDonutSegments(depts, total) {
  if (!total || !depts.length) return '';

  const cx = 60, cy = 60, r = 45, innerR = 28;
  let startAngle = -90; // start from top
  let paths = '';

  depts.forEach((dept, i) => {
    const pct   = dept[1] / total;
    const angle = pct * 360;
    const endAngle = startAngle + angle;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    // If it's 100%, draw a full circle
    if (pct === 1) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${(r+innerR)/2}" fill="none" stroke="${color}" stroke-width="${r-innerR}"/>`;
      startAngle = endAngle;
      return;
    }

    const start = polarToCartesian(cx, cy, r, startAngle);
    const end   = polarToCartesian(cx, cy, r, endAngle);
    const iStart = polarToCartesian(cx, cy, innerR, startAngle);
    const iEnd   = polarToCartesian(cx, cy, innerR, endAngle);
    const largeArc = angle > 180 ? 1 : 0;

    paths += `<path d="
      M ${start.x} ${start.y}
      A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}
      L ${iEnd.x} ${iEnd.y}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}
      Z"
      fill="${color}" opacity="0.92">
      <title>${dept[0]}: ${dept[1]} employees</title>
    </path>`;

    startAngle = endAngle;
  });

  return paths;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}


/* ═══════════════════════════════════════════════
   SMALL HELPERS (only for dashboard)
════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getTodayDateStr() {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getLeaveStatusBadge(status) {
  const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
  return map[status] || 'badge-gray';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
