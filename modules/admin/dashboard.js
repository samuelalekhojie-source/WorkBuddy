function renderAdminDashboard() {
  const employees      = getEmployees();
  const todayAtt       = getTodayAttendance();
  const pendingLeave   = getPendingLeaves();
  const payroll        = getPayroll();
  const applicants     = getApplicants();
  const allAtt         = getAttendance();

  const totalEmp       = employees.length;
  const presentToday   = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentToday    = totalEmp - presentToday;
  const pendingCount   = pendingLeave.length;
  const newApplicants  = applicants.filter(a => a.status === 'pending').length;

  // Department breakdown
  const deptMap = {};
  employees.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
  const depts = Object.entries(deptMap).sort((a,b) => b[1]-a[1]);

  // Attendance last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const recs    = allAtt.filter(a => a.date === dateStr);
    const present = recs.filter(a => a.status === 'present' || a.status === 'late').length;
    last7.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), present, total: totalEmp });
  }

  // Alerts (birthday + overdue tasks)
  const birthdays   = getTodayBirthdays();
  const pendingTasks= getTasks().filter(t => t.status !== 'completed');
  const overdueTasks= pendingTasks.filter(t => t.dueDate < new Date().toISOString().split('T')[0]);

  // Recent leave + applicants
  const recentLeaves     = getLeaveRequests().sort((a,b) => new Date(b.appliedDate)-new Date(a.appliedDate)).slice(0,3);
  const recentApplicants = applicants.slice(-3).reverse();

  setPageContent(`
    <div class="dashboard-wrap">

      <!-- HEADER -->
      <div class="page-header">
        <div class="page-header-text">
          <h2>Good ${getGreeting()}, ${getCurrentUser().name.split(' ')[0]} &#128075;</h2>
          <p class="text-secondary">${getTodayDateStr()}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="navigate('admin-attendance')">
            <i data-lucide="clock"></i> Attendance
          </button>
          <button class="btn btn-primary" onclick="navigate('admin-employees')">
            <i data-lucide="user-plus"></i> Add Employee
          </button>
        </div>
      </div>

      <!-- ALERTS ROW — only shown when there's something to flag -->
      ${(birthdays.length || overdueTasks.length) ? `
        <div class="alerts-row">
          ${birthdays.map(p => `
            <div class="alert-chip birthday-chip">
              <span>&#127881;</span>
              <span>Today is <strong>${p.name.split(' ')[0]}'s</strong> birthday!</span>
              <button onclick="showToast('&#127881; Birthday wish sent to ${p.name.split(' ')[0]}!', 'success')" class="alert-action">Send Wish</button>
            </div>
          `).join('')}
          ${overdueTasks.length ? `
            <div class="alert-chip overdue-chip" onclick="navigate('admin-tasks')" style="cursor:pointer">
              <i data-lucide="alert-triangle"></i>
              <span><strong>${overdueTasks.length}</strong> overdue task${overdueTasks.length > 1 ? 's' : ''} need attention</span>
              <span class="alert-action">View &#8594;</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- STAT CARDS — 4 only, clean grid -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card" onclick="navigate('admin-employees')" style="cursor:pointer">
          <div class="stat-icon blue"><i data-lucide="users"></i></div>
          <div class="stat-info">
            <div class="stat-value">${totalEmp}</div>
            <div class="stat-label">Total Employees</div>
          </div>
        </div>
        <div class="stat-card" onclick="navigate('admin-attendance')" style="cursor:pointer">
          <div class="stat-icon green"><i data-lucide="user-check"></i></div>
          <div class="stat-info">
            <div class="stat-value">${presentToday}</div>
            <div class="stat-label">Present Today</div>
            <div class="stat-change ${absentToday > 0 ? 'down' : 'up'}">${absentToday} absent</div>
          </div>
        </div>
        <div class="stat-card" onclick="navigate('admin-leave')" style="cursor:pointer">
          <div class="stat-icon yellow"><i data-lucide="calendar-days"></i></div>
          <div class="stat-info">
            <div class="stat-value">${pendingCount}</div>
            <div class="stat-label">Pending Leave</div>
            <div class="stat-change ${pendingCount > 0 ? 'down' : 'up'}">${pendingCount > 0 ? 'Needs review' : 'All clear'}</div>
          </div>
        </div>
        <div class="stat-card" onclick="navigate('admin-recruitment')" style="cursor:pointer">
          <div class="stat-icon indigo"><i data-lucide="briefcase"></i></div>
          <div class="stat-info">
            <div class="stat-value">${newApplicants}</div>
            <div class="stat-label">New Applicants</div>
            <div class="stat-change up">Awaiting screening</div>
          </div>
        </div>
      </div>

      <!-- MAIN GRID: Charts + Activity -->
      <div class="dash-main-grid">

        <!-- LEFT: Charts stacked -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- Attendance bar chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Attendance This Week</div>
              <span class="badge badge-blue">Last 7 days</span>
            </div>
            <div class="chart-container">
              <div class="bar-chart">
                ${last7.map(day => `
                  <div class="bar-col">
                    <div class="bar-label-top">${day.present}</div>
                    <div class="bar-wrap">
                      <div class="bar-fill" style="height:${day.total > 0 ? Math.round((day.present/day.total)*100) : 0}%"></div>
                    </div>
                    <div class="bar-label">${day.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Department donut -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Staff by Department</div>
              <span class="badge badge-green">${totalEmp} total</span>
            </div>
            <div style="display:flex;align-items:center;gap:1.5rem">
              <div class="donut-wrap" style="flex-shrink:0">
                <svg class="donut-svg" viewBox="0 0 120 120">
                  ${buildDonutSegments(depts, totalEmp)}
                </svg>
                <div class="donut-center">
                  <span class="donut-num">${totalEmp}</span>
                  <span class="donut-lbl">Staff</span>
                </div>
              </div>
              <div class="donut-legend" style="flex:1">
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

        </div>

        <!-- RIGHT: Activity feed -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- AI Insight -->
          <div class="card ai-insight-card">
            <div class="ai-insight-header">
              <div class="ai-pulse"><i data-lucide="sparkles"></i></div>
              <div style="flex:1">
                <div class="card-title">AI Insight</div>
                <div class="text-xs text-muted">Groq · updated now</div>
              </div>
              <button class="btn btn-ghost" onclick="loadDashboardInsight()" id="insight-refresh-btn" title="Refresh">
                <i data-lucide="refresh-cw"></i>
              </button>
            </div>
            <div id="ai-insight-body">
              <div class="loading-state" style="padding:0.5rem 0"><div class="spinner"></div><span>Generating...</span></div>
            </div>
          </div>

          <!-- Recent leave requests -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Leave</div>
              <button class="btn btn-ghost text-sm" onclick="navigate('admin-leave')">
                View all <i data-lucide="arrow-right"></i>
              </button>
            </div>
            ${recentLeaves.length === 0
              ? `<div class="empty-state" style="padding:1.5rem"><i data-lucide="calendar-x"></i><p>No requests yet</p></div>`
              : `<div class="activity-list">
                  ${recentLeaves.map(l => {
                    const emp = getUserById(l.userId);
                    return `<div class="activity-item">
                      ${buildAvatar(emp)}
                      <div class="activity-info">
                        <div class="activity-name">${emp ? emp.name : 'Unknown'}</div>
                        <div class="activity-sub">${l.type} · ${l.days}d · ${formatDate(l.startDate)}</div>
                      </div>
                      <span class="badge ${getLeaveStatusBadge(l.status)}">${capitalize(l.status)}</span>
                    </div>`;
                  }).join('')}
                </div>`
            }
          </div>

          <!-- New applicants -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">New Applicants</div>
              <button class="btn btn-ghost text-sm" onclick="navigate('admin-recruitment')">
                View all <i data-lucide="arrow-right"></i>
              </button>
            </div>
            ${recentApplicants.length === 0
              ? `<div class="empty-state" style="padding:1.5rem"><i data-lucide="user-x"></i><p>No applicants yet</p></div>`
              : `<div class="activity-list">
                  ${recentApplicants.map(a => {
                    const job = getJobPostings().find(j => j.id === a.jobId);
                    return `<div class="activity-item">
                      ${buildAvatar({name: a.name}, '36px')}
                      <div class="activity-info">
                        <div class="activity-name">${a.name}</div>
                        <div class="activity-sub">${job ? job.title : 'Unknown role'} · ${a.experience}</div>
                      </div>
                      <button class="btn btn-secondary text-xs" onclick="navigate('admin-recruitment')">Screen</button>
                    </div>`;
                  }).join('')}
                </div>`
            }
          </div>

        </div>
      </div>

    </div>
  `);

  loadDashboardInsight();
}

async function loadDashboardInsight() {
  const btn  = document.getElementById('insight-refresh-btn');
  const body = document.getElementById('ai-insight-body');
  if (!body) return;
  if (btn) btn.disabled = true;
  body.innerHTML = `<div class="loading-state" style="padding:0.5rem 0"><div class="spinner"></div><span>Thinking...</span></div>`;

  const employees  = getEmployees();
  const pending    = getPendingLeaves().length;
  const present    = getTodayAttendance().filter(a => a.status === 'present' || a.status === 'late').length;
  const applicants = getApplicants().filter(a => a.status === 'pending').length;

  const response = await groqChat([{ role: 'user', content:
    `You are an HR analytics AI. Give ONE specific, actionable HR insight in 2 sentences max. Be direct.
    Data: ${employees.length} employees, ${present} present today, ${pending} pending leave, ${applicants} unscreened applicants.` }],
    { temperature: 0.8, max_tokens: 150 }
  );

  if (body) body.innerHTML = `<p class="ai-insight-text">${response}</p>`;
  if (btn)  btn.disabled = false;
}

const CHART_COLORS = ['#0f8adb','#2db5ec','#135b99','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2'];

function buildDonutSegments(depts, total) {
  if (!total || !depts.length) return '';
  const cx = 60, cy = 60, r = 45, innerR = 28;
  let startAngle = -90, paths = '';
  depts.forEach((dept, i) => {
    const pct = dept[1] / total, angle = pct * 360, endAngle = startAngle + angle;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    if (pct === 1) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${(r+innerR)/2}" fill="none" stroke="${color}" stroke-width="${r-innerR}"/>`;
      startAngle = endAngle; return;
    }
    const s = polarToCartesian(cx,cy,r,startAngle), e = polarToCartesian(cx,cy,r,endAngle);
    const is= polarToCartesian(cx,cy,innerR,startAngle), ie = polarToCartesian(cx,cy,innerR,endAngle);
    const la = angle > 180 ? 1 : 0;
    paths += `<path d="M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y} L ${ie.x} ${ie.y} A ${innerR} ${innerR} 0 ${la} 0 ${is.x} ${is.y} Z" fill="${color}" opacity="0.92"><title>${dept[0]}: ${dept[1]}</title></path>`;
    startAngle = endAngle;
  });
  return paths;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
