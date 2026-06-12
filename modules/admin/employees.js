/* ═══════════════════════════════════════════════
   EMPLOYEES MODULE

   Full employee directory with:
   - Search and filter by department
   - Add new employee (with AI onboarding checklist)
   - View employee profile (detailed modal)
   - Edit employee details
   - Deactivate / reactivate employee
════════════════════════════════════════════════ */

function renderEmployees() {
  const employees = getUsers(); // all users including admin
  const departments = getDepartments();

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Employees</h2>
        <p>${employees.filter(e=>e.status==='active').length} active · ${employees.filter(e=>e.status==='inactive').length} inactive</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="exportEmployees()">
          <i data-lucide="download"></i> Export
        </button>
        <button class="btn btn-primary" onclick="openAddEmployeeModal()">
          <i data-lucide="user-plus"></i> Add Employee
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:1.25rem">
      <div class="filter-row">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="emp-search" placeholder="Search by name, email, or role..." oninput="filterEmployees()" />
        </div>
        <select id="dept-filter" onchange="filterEmployees()">
          <option value="">All Departments</option>
          ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
        <select id="status-filter" onchange="filterEmployees()">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select id="role-filter" onchange="filterEmployees()">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
        </select>
      </div>
    </div>

    <!-- Employee Table -->
    <div class="card">
      <div class="table-wrapper">
        <table id="employees-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="employees-tbody">
            ${buildEmployeeRows(employees)}
          </tbody>
        </table>
      </div>
      <div class="table-footer" id="emp-count">
        Showing <strong>${employees.length}</strong> employees
      </div>
    </div>
  `);
}

function buildEmployeeRows(employees) {
  if (!employees.length) {
    return `<tr><td colspan="7">
      <div class="empty-state">
        <i data-lucide="users"></i>
        <h3>No employees found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    </td></tr>`;
  }

  return employees.map(emp => `
    <tr>
      <td>
        <div class="emp-cell">
          <div class="emp-avatar">${getInitials(emp.name)}</div>
          <div>
            <div class="emp-name">${emp.name}</div>
            <div class="emp-email">${emp.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-blue">${emp.department}</span></td>
      <td>${emp.position}</td>
      <td><span class="badge ${emp.role === 'admin' ? 'badge-red' : 'badge-gray'}">${capitalize(emp.role)}</span></td>
      <td>${formatDate(emp.joinDate)}</td>
      <td>
        <span class="status-dot ${emp.status === 'active' ? 'active' : 'inactive'}">
          ${emp.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost" onclick="viewEmployee('${emp.id}')" title="View profile">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn btn-ghost" onclick="openEditEmployeeModal('${emp.id}')" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn-ghost" onclick="toggleEmployeeStatus('${emp.id}', '${emp.status}')" title="${emp.status === 'active' ? 'Deactivate' : 'Activate'}">
            <i data-lucide="${emp.status === 'active' ? 'user-x' : 'user-check'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── SEARCH & FILTER ── */
function filterEmployees() {
  const search = document.getElementById('emp-search').value.toLowerCase();
  const dept   = document.getElementById('dept-filter').value;
  const status = document.getElementById('status-filter').value;
  const role   = document.getElementById('role-filter').value;

  let employees = getUsers();

  if (search) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      e.position.toLowerCase().includes(search)
    );
  }
  if (dept)   employees = employees.filter(e => e.department === dept);
  if (status) employees = employees.filter(e => e.status === status);
  if (role)   employees = employees.filter(e => e.role === role);

  document.getElementById('employees-tbody').innerHTML = buildEmployeeRows(employees);
  document.getElementById('emp-count').innerHTML =
    `Showing <strong>${employees.length}</strong> of <strong>${getUsers().length}</strong> employees`;
  lucide.createIcons();
}


/* ── VIEW EMPLOYEE PROFILE ── */
function viewEmployee(id) {
  const emp = getUserById(id);
  if (!emp) return;

  const att = getAttendanceByUser(id);
  const leaves = getLeaveByUser(id);
  const payHistory = getPayrollByUser(id);
  const reviews = getReviewsByUser(id);

  const presentDays = att.filter(a => a.status === 'present' || a.status === 'late').length;
  const totalHours = att.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  const lastReview = reviews[reviews.length - 1];

  openModal(`
    <div class="modal-header">
      <h3>Employee Profile</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <!-- Profile header -->
      <div class="profile-header">
        <div class="profile-avatar-lg">${getInitials(emp.name)}</div>
        <div class="profile-meta">
          <h3>${emp.name}</h3>
          <p>${emp.position} · ${emp.department}</p>
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem">
            <span class="badge ${emp.status === 'active' ? 'badge-green' : 'badge-red'}">${capitalize(emp.status)}</span>
            <span class="badge ${emp.role === 'admin' ? 'badge-red' : 'badge-blue'}">${capitalize(emp.role)}</span>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="closeModal(); openEditEmployeeModal('${emp.id}')">
          <i data-lucide="pencil"></i> Edit
        </button>
      </div>

      <!-- Info grid -->
      <div class="profile-grid">
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="mail"></i> Email</span>
          <span>${emp.email}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="phone"></i> Phone</span>
          <span>${emp.phone || '—'}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="calendar"></i> Join Date</span>
          <span>${formatDate(emp.joinDate)}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="banknote"></i> Salary</span>
          <span>${formatCurrency(emp.salary)}/month</span>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="profile-stats">
        <div class="pstat">
          <span class="pstat-val">${presentDays}</span>
          <span class="pstat-lbl">Days Present</span>
        </div>
        <div class="pstat">
          <span class="pstat-val">${Math.round(totalHours)}</span>
          <span class="pstat-lbl">Hours Logged</span>
        </div>
        <div class="pstat">
          <span class="pstat-val">${approvedLeaves}</span>
          <span class="pstat-lbl">Leaves Taken</span>
        </div>
        <div class="pstat">
          <span class="pstat-val">${lastReview ? lastReview.overallRating + '/5' : 'N/A'}</span>
          <span class="pstat-lbl">Last Rating</span>
        </div>
      </div>

      ${lastReview ? `
        <div style="margin-top:1rem;padding:0.75rem;background:var(--surface-2);border-radius:var(--radius-sm)">
          <div class="text-sm font-semibold" style="margin-bottom:0.3rem">Latest Review — ${lastReview.period}</div>
          <p class="text-sm text-secondary">${lastReview.feedback}</p>
        </div>
      ` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal(); navigate('admin-payroll')">
        <i data-lucide="banknote"></i> View Payroll
      </button>
    </div>
  `, 'modal-lg');
}


/* ── ADD EMPLOYEE MODAL ── */
function openAddEmployeeModal() {
  const departments = getDepartments();

  openModal(`
    <div class="modal-header">
      <h3>Add New Employee</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="new-name" placeholder="e.g. Chuka Obi" />
        </div>
        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" id="new-email" placeholder="chuka@company.com" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Password *</label>
          <input type="password" id="new-password" placeholder="Minimum 6 characters" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="new-phone" placeholder="+234 800 000 0000" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Department *</label>
          <select id="new-department">
            <option value="">Select department</option>
            ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Position / Job Title *</label>
          <input type="text" id="new-position" placeholder="e.g. Frontend Developer" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Role</label>
          <select id="new-role">
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label>Monthly Salary (₦) *</label>
          <input type="number" id="new-salary" placeholder="e.g. 500000" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Join Date *</label>
          <input type="date" id="new-joindate" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="new-status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="ai-option-box">
        <label class="ai-option-label">
          <input type="checkbox" id="gen-onboarding" checked />
          <i data-lucide="sparkles"></i>
          Generate AI onboarding checklist for this employee after adding
        </label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewEmployee()">
        <i data-lucide="user-plus"></i> Add Employee
      </button>
    </div>
  `, 'modal-lg');
}

async function saveNewEmployee() {
  const name     = document.getElementById('new-name').value.trim();
  const email    = document.getElementById('new-email').value.trim();
  const password = document.getElementById('new-password').value.trim();
  const phone    = document.getElementById('new-phone').value.trim();
  const dept     = document.getElementById('new-department').value;
  const position = document.getElementById('new-position').value.trim();
  const role     = document.getElementById('new-role').value;
  const salary   = parseInt(document.getElementById('new-salary').value);
  const joinDate = document.getElementById('new-joindate').value;
  const status   = document.getElementById('new-status').value;
  const genOnboarding = document.getElementById('gen-onboarding').checked;

  // Validate required fields
  if (!name || !email || !password || !dept || !position || !salary || !joinDate) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  // Check email isn't already in use
  if (findUserByEmail(email)) {
    showToast('An account with this email already exists.', 'error');
    return;
  }

  const newEmployee = {
    name, email, password, phone,
    department: dept, position, role,
    salary, joinDate, status,
    avatar: getInitials(name)
  };

  const saved = addUser(newEmployee);
  addNotification(`New employee ${name} added to ${dept}`, 'info');
  closeModal();
  auditLog(`Employee added: ${name}`, 'employee', `Dept: ${dept}, Role: ${role}`);
  showToast(`${name} has been added successfully!`, 'success');

  // Generate AI onboarding checklist if checkbox was checked
  if (genOnboarding) {
    showOnboardingChecklist(saved);
  } else {
    refreshPage();
  }
}


/* ── AI ONBOARDING CHECKLIST MODAL ── */
async function showOnboardingChecklist(employee) {
  openModal(`
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:0.6rem">
        <div class="ai-pulse" style="width:32px;height:32px"><i data-lucide="sparkles"></i></div>
        <h3>AI Onboarding Checklist</h3>
      </div>
      <button class="modal-close" onclick="closeModal(); refreshPage()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <p class="text-secondary text-sm" style="margin-bottom:1rem">
        Generating a personalized onboarding plan for <strong>${employee.name}</strong> (${employee.position}, ${employee.department})...
      </p>
      <div id="checklist-content">
        <div class="loading-state"><div class="spinner"></div><span>AI is building the checklist...</span></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal(); refreshPage()">Close</button>
      <button class="btn btn-primary" onclick="printChecklist()">
        <i data-lucide="printer"></i> Print Checklist
      </button>
    </div>
  `);

  const checklist = await generateOnboardingChecklist(employee);
  const el = document.getElementById('checklist-content');
  if (!el) return;

  el.innerHTML = `
    <div class="checklist-grid">
      ${[['Week 1 — Orientation', checklist.week1], ['Week 2 — Role Setup', checklist.week2], ['Month 1 — Integration', checklist.month1]]
        .map(([title, items]) => `
          <div class="checklist-section">
            <div class="checklist-title">${title}</div>
            <ul class="checklist-items">
              ${items.map(item => `
                <li class="checklist-item">
                  <input type="checkbox" onchange="this.parentElement.classList.toggle('done', this.checked)" />
                  <span>${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
    </div>
  `;
  lucide.createIcons();
}

function printChecklist() {
  window.print();
}


/* ── EDIT EMPLOYEE MODAL ── */
function openEditEmployeeModal(id) {
  const emp = getUserById(id);
  if (!emp) return;
  const departments = getDepartments();

  openModal(`
    <div class="modal-header">
      <h3>Edit Employee — ${emp.name}</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="edit-name" value="${emp.name}" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="edit-phone" value="${emp.phone || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Department</label>
          <select id="edit-department">
            ${departments.map(d => `<option value="${d}" ${d === emp.department ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Position</label>
          <input type="text" id="edit-position" value="${emp.position}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Role</label>
          <select id="edit-role">
            <option value="employee" ${emp.role === 'employee' ? 'selected' : ''}>Employee</option>
            <option value="admin" ${emp.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label>Monthly Salary (₦)</label>
          <input type="number" id="edit-salary" value="${emp.salary}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select id="edit-status">
            <option value="active" ${emp.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${emp.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="form-group">
          <label>Join Date</label>
          <input type="date" id="edit-joindate" value="${emp.joinDate}" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditEmployee('${emp.id}')">
        <i data-lucide="save"></i> Save Changes
      </button>
    </div>
  `, 'modal-lg');
}

function saveEditEmployee(id) {
  const updates = {
    name:       document.getElementById('edit-name').value.trim(),
    phone:      document.getElementById('edit-phone').value.trim(),
    department: document.getElementById('edit-department').value,
    position:   document.getElementById('edit-position').value.trim(),
    role:       document.getElementById('edit-role').value,
    salary:     parseInt(document.getElementById('edit-salary').value),
    status:     document.getElementById('edit-status').value,
    joinDate:   document.getElementById('edit-joindate').value,
  };

  if (!updates.name || !updates.position) {
    showToast('Name and position are required.', 'error');
    return;
  }

  updateUser(id, updates);
  closeModal();
  auditLog(`Employee updated`, 'employee', `ID: ${id}`);
  showToast('Employee updated successfully!', 'success');
  refreshPage();
}


/* ── TOGGLE ACTIVE STATUS ── */
async function toggleEmployeeStatus(id, currentStatus) {
  const emp = getUserById(id);
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate';
  const confirmed = await confirmDialog(
    `Are you sure you want to ${action} ${emp.name}?`,
    capitalize(action),
    newStatus === 'inactive'
  );
  if (!confirmed) return;
  updateUser(id, { status: newStatus });
  auditLog(`Employee ${action}d: ${emp.name}`, 'employee');
  showToast(`${emp.name} has been ${action}d.`, newStatus === 'active' ? 'success' : 'warning');
  refreshPage();
}


/* ── EXPORT EMPLOYEES ── */
function exportEmployees() {
  const employees = getUsers();
  const rows = [
    ['Name', 'Email', 'Department', 'Position', 'Role', 'Salary', 'Join Date', 'Status'],
    ...employees.map(e => [e.name, e.email, e.department, e.position, e.role, e.salary, e.joinDate, e.status])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workbuddy-employees.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Employee data exported as CSV.', 'success');
}
