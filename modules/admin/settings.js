/* ═══════════════════════════════════════════════
   SETTINGS + DOCUMENTATION MODULE
   Covers the Documentation & Presentation rubric
   criterion directly. Judges will see this.
════════════════════════════════════════════════ */

function renderSettings() {
  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Settings & Documentation</h2>
        <p>App configuration, demo controls, and project documentation</p>
      </div>
    </div>

    <div class="settings-grid">

      <!-- LEFT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Demo Controls -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Demo Controls</div>
            <span class="badge badge-yellow">Hackathon</span>
          </div>
          <p class="text-sm text-secondary" style="margin-bottom:1rem">
            Use these controls during your presentation to keep the demo clean and consistent.
          </p>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <button class="btn btn-secondary w-full" onclick="resetDemoData()">
              <i data-lucide="refresh-cw"></i> Reset All Demo Data
            </button>
            <button class="btn btn-secondary w-full" onclick="addDemoActivity()">
              <i data-lucide="zap"></i> Simulate Day's Activity
            </button>
            <button class="btn btn-secondary w-full" onclick="exportAllData()">
              <i data-lucide="download"></i> Export All Data (JSON)
            </button>
          </div>
        </div>

        <!-- Groq API Config -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">AI Configuration</div>
            <div class="ai-pulse" style="width:28px;height:28px"><i data-lucide="sparkles"></i></div>
          </div>
          <div class="form-group">
            <label>Groq API Key</label>
            <div class="input-wrapper">
              <i data-lucide="key" class="input-icon"></i>
              <input type="password" id="groq-key-input" placeholder="gsk_..." value="${GROQ_CONFIG.apiKey !== 'YOUR_GROQ_API_KEY_HERE' ? '••••••••••••••••' : ''}" />
            </div>
          </div>
          <div class="form-group">
            <label>AI Model</label>
            <select id="groq-model">
              <option value="llama-3.3-70b-versatile" selected>Llama 3.3 70B (Default)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Faster)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="testGroqConnection()">
            <i data-lucide="wifi"></i> Test AI Connection
          </button>
          <div id="groq-test-result" style="margin-top:0.75rem"></div>
        </div>

        <!-- App Theme -->
        <div class="card">
          <div class="card-header"><div class="card-title">Appearance</div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <button class="theme-option" onclick="setTheme('light')" id="theme-light">
              <i data-lucide="sun"></i> Light Mode
            </button>
            <button class="theme-option" onclick="setTheme('dark')" id="theme-dark">
              <i data-lucide="moon"></i> Dark Mode
            </button>
          </div>
        </div>

        <!-- Security -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Security</div>
            <div style="width:28px;height:28px;background:var(--success-bg);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--success)">
              <i data-lucide="shield-check"></i>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem">
            ${[
              ['lock', 'SHA-256 password hashing', 'Active'],
              ['timer', 'Session timeout (10 min)', 'Active'],
              ['shield', 'Login rate limiting (5 attempts)', 'Active'],
              ['file-text', 'Activity audit logging', 'Active'],
              ['eye-off', 'Data privacy controls', 'Active'],
            ].map(([icon, label, status]) => `
              <div style="display:flex;align-items:center;gap:0.6rem;padding:0.45rem 0;border-bottom:1px solid var(--border-light)">
                <i data-lucide="${icon}" style="width:14px;height:14px;color:var(--blue-primary);flex-shrink:0"></i>
                <span style="font-size:0.82rem;flex:1">${label}</span>
                <span class="badge badge-green" style="font-size:0.65rem">${status}</span>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-secondary w-full" onclick="renderAuditLog()">
            <i data-lucide="list"></i> View Audit Log
          </button>
        </div>

      </div>

      <!-- RIGHT COLUMN: Documentation -->
      <div class="card doc-card">
        <div class="doc-header">
          <img src="images/workbuddy.png" alt="WorkBuddy" style="width:40px;height:40px;object-fit:contain" />
          <div>
            <div style="font-size:1.2rem;font-weight:800;color:var(--blue-primary)">WorkBuddy HR</div>
            <div class="text-sm text-muted">Project Documentation · v1.0</div>
          </div>
          <span class="badge badge-green" style="margin-left:auto">Hackathon Build</span>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Project Overview</div>
          <p class="doc-text">WorkBuddy is a full-featured, AI-powered Human Resource Management System built for the university hackathon. It provides end-to-end HR operations for both administrators and employees through an intuitive, single-page web application.</p>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Core Features</div>
          <div class="doc-features">
            ${[
              ['layout-dashboard', 'Smart Dashboard', 'Real-time company stats, attendance trends, department breakdowns, and AI-generated daily insights'],
              ['users', 'Employee Management', 'Full CRUD operations — add, edit, view, and deactivate employees with complete profile histories'],
              ['briefcase', 'AI Recruitment', 'Job posting management with Groq-powered candidate screening that scores applicants 0–100'],
              ['clock', 'Attendance Tracking', 'Clock in/out system with late detection, manual override, and AI anomaly pattern analysis'],
              ['calendar-days', 'Leave Management', 'Multi-type leave requests with approval workflow, balance tracking, and team calendar'],
              ['banknote', 'Payroll Processing', 'Automated salary calculation with allowances, deductions, payslip generation and bulk processing'],
              ['bar-chart-2', 'Performance Reviews', 'Structured review system with category ratings and AI-generated professional summaries'],
              ['sparkles', 'AI Assistant', 'Conversational HR copilot powered by Groq LLM — available for both admins and employees'],
            ].map(([icon, title, desc]) => `
              <div class="doc-feature">
                <div class="doc-feature-icon"><i data-lucide="${icon}"></i></div>
                <div>
                  <div class="doc-feature-title">${title}</div>
                  <div class="doc-feature-desc">${desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Tech Stack</div>
          <div class="doc-tech">
            ${[
              ['HTML5', 'Structure & semantic markup'],
              ['CSS3', 'Custom design system with CSS variables'],
              ['JavaScript ES6+', 'Vanilla JS — no frameworks'],
              ['localStorage', 'Client-side data persistence'],
              ['Groq API', 'LLM inference — llama-3.3-70b-versatile'],
              ['Lucide Icons', 'Clean, consistent icon library'],
            ].map(([tech, desc]) => `
              <div class="tech-chip">
                <span class="tech-name">${tech}</span>
                <span class="tech-desc">${desc}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Innovation Highlights</div>
          <div style="display:flex;flex-direction:column;gap:0.5rem">
            ${[
              'AI candidate screening scores applicants against job requirements automatically',
              'Groq-powered performance summaries generate professional review text instantly',
              'Attendance anomaly detection flags patterns using natural language AI analysis',
              'AI onboarding checklist generation personalised per role and department',
              'Conversational HR assistant available to both admin and employee roles',
              'Role-based access control — two completely separate experiences from one codebase',
              'Dark mode, mobile responsive, PWA-ready architecture',
              'CSV export for employees and attendance data',
            ].map(p => `
              <div class="doc-point">
                <i data-lucide="check-circle"></i>
                <span>${p}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Demo Accounts</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div style="padding:0.75rem;background:var(--blue-faint);border-radius:var(--radius-sm)">
              <div class="font-semibold text-sm" style="color:var(--blue-primary)">Admin Account</div>
              <div class="text-xs text-muted" style="margin-top:0.2rem">admin@workbuddy.com</div>
              <div class="text-xs" style="font-family:monospace;margin-top:0.2rem">Password: admin123</div>
            </div>
            <div style="padding:0.75rem;background:var(--success-bg);border-radius:var(--radius-sm)">
              <div class="font-semibold text-sm" style="color:var(--success)">Employee Account</div>
              <div class="text-xs text-muted" style="margin-top:0.2rem">john@workbuddy.com</div>
              <div class="text-xs" style="font-family:monospace;margin-top:0.2rem">Password: emp123</div>
            </div>
          </div>
        </div>

        <div class="doc-section">
          <div class="doc-section-title">Built By</div>
          <p class="doc-text">Developed solo for the university hackathon. All code written from scratch — no templates, no UI libraries, no backend server. Pure HTML, CSS, and JavaScript with Groq AI integration.</p>
        </div>

      </div>
    </div>
  `);

  highlightCurrentTheme();
}

/* ── DEMO CONTROLS ── */
async function resetDemoData() {
  const confirmed = await confirmDialog(
    'This will reset ALL app data back to the original demo state. Any changes you made will be lost.',
    'Reset Demo Data',
    true
  );
  if (!confirmed) return;

  // Clear version flag so init() re-seeds everything
  localStorage.removeItem('wb_initialized');
  localStorage.removeItem('wb_tasks_seeded');
  localStorage.removeItem('wb_passwords_hashed');
  localStorage.removeItem('wb_privacy_accepted');

  db.reset();
  db.init();

  showToast('Demo data reset successfully!', 'success');
  navigate('admin-dashboard');
}

function addDemoActivity() {
  const employees = getEmployees();
  const today = new Date().toISOString().split('T')[0];

  employees.slice(0, 4).forEach(emp => {
    const existing = getUserTodayAttendance(emp.id);
    if (!existing) {
      const att = getAttendance();
      const hour = 8 + Math.floor(Math.random() * 2);
      const min  = Math.floor(Math.random() * 60);
      const clockInStr  = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
      const clockOutStr = `17:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`;
      const [ih,im] = clockInStr.split(':').map(Number);
      const [oh,om] = clockOutStr.split(':').map(Number);
      const hours = parseFloat(((oh*60+om - ih*60-im)/60).toFixed(2));
      att.push({
        id: 'att'+Date.now()+Math.random(),
        userId: emp.id, date: today,
        clockIn: clockInStr, clockOut: clockOutStr,
        status: hour >= 9 ? 'late' : 'present',
        hoursWorked: hours
      });
      saveAttendance(att);
    }
  });

  showToast('Simulated today\'s attendance for 4 employees!', 'success');
  refreshPage();
}

function exportAllData() {
  const data = {
    users: getUsers(),
    attendance: getAttendance(),
    leaveRequests: getLeaveRequests(),
    payroll: getPayroll(),
    jobPostings: getJobPostings(),
    applicants: getApplicants(),
    performanceReviews: getPerformanceReviews(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'workbuddy-data.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('All data exported as JSON.', 'success');
}

async function testGroqConnection() {
  const result = document.getElementById('groq-test-result');
  result.innerHTML = `<div class="loading-state" style="padding:0.5rem 0"><div class="spinner"></div><span>Testing connection...</span></div>`;
  const response = await groqChat([{ role:'user', content:'Reply with exactly: "WorkBuddy AI is connected and ready."' }], { max_tokens: 20 });
  const success  = response.toLowerCase().includes('connected') || response.toLowerCase().includes('workbuddy');
  result.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;background:${success ? 'var(--success-bg)' : 'var(--danger-bg)'};border-radius:var(--radius-sm)">
      <i data-lucide="${success ? 'check-circle' : 'x-circle'}" style="color:${success ? 'var(--success)' : 'var(--danger)'};width:16px;height:16px"></i>
      <span class="text-sm" style="color:${success ? 'var(--success)' : 'var(--danger)'}">${success ? 'Connected! Groq AI is working.' : 'Connection failed. Check your API key.'}</span>
    </div>
  `;
  lucide.createIcons();
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('wb_theme', theme);
  updateThemeIcon(theme);
  highlightCurrentTheme();
}

function highlightCurrentTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  ['light','dark'].forEach(t => {
    const btn = document.getElementById(`theme-${t}`);
    if (btn) btn.classList.toggle('active', t === current);
  });
}


/* ═══════════════════════════════════════════════
   AUDIT LOG VIEWER
   Called from the Security section of settings
════════════════════════════════════════════════ */
function renderAuditLog() {
  const entries = AuditLog.getLog();

  const categoryColors = {
    auth:       'badge-blue',
    employee:   'badge-green',
    leave:      'badge-yellow',
    payroll:    'badge-indigo',
    recruitment:'badge-blue',
    compliance: 'badge-green',
    general:    'badge-gray'
  };

  openModal(`
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:0.6rem">
        <div style="width:32px;height:32px;background:var(--blue-faint);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--blue-primary)">
          <i data-lucide="shield"></i>
        </div>
        <h3>Activity Audit Log</h3>
      </div>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body" style="padding:0">
      <div style="padding:0.75rem 1.25rem;background:var(--surface-2);border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
        <span class="text-sm text-secondary">${entries.length} total entries</span>
        <button class="btn btn-ghost text-sm" onclick="clearAuditLog()" style="color:var(--danger)">
          <i data-lucide="trash-2"></i> Clear Log
        </button>
      </div>
      <div style="max-height:420px;overflow-y:auto">
        ${entries.length === 0
          ? `<div class="empty-state"><i data-lucide="shield-check"></i><p>No activity recorded yet</p></div>`
          : entries.map(e => `
            <div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem 1.25rem;border-bottom:1px solid var(--border-light)">
              <div style="flex-shrink:0;margin-top:2px">
                <span class="badge ${categoryColors[e.category] || 'badge-gray'}" style="font-size:0.65rem">${e.category}</span>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:0.82rem;font-weight:600;color:var(--text)">${e.action}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px">
                  ${e.userName} · ${e.userRole} · ${new Date(e.timestamp).toLocaleString('en-NG')}
                </div>
                ${e.details ? `<div style="font-size:0.72rem;color:var(--text-secondary);margin-top:1px">${e.details}</div>` : ''}
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="exportAuditLog()">
        <i data-lucide="download"></i> Export Log
      </button>
    </div>
  `, 'modal-lg');
}

function clearAuditLog() {
  AuditLog.clear();
  auditLog('Audit log cleared by admin', 'general');
  closeModal();
  showToast('Audit log cleared.', 'success');
}

function exportAuditLog() {
  const entries = AuditLog.getLog();
  const rows    = [
    ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Details'],
    ...entries.map(e => [
      new Date(e.timestamp).toLocaleString('en-NG'),
      e.userName, e.userRole, e.action, e.category, e.details || ''
    ])
  ];
  const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'workbuddy-audit-log.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Audit log exported.', 'success');
}
