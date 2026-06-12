/* ═══════════════════════════════════════════════
   PAYROLL MODULE
   - Monthly payroll overview with totals
   - Process individual or bulk payroll
   - View/print payslips
   - Salary breakdown with allowances & deductions
════════════════════════════════════════════════ */

function renderPayroll() {
  const employees  = getEmployees();
  const allPayroll = getPayroll();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthPayroll = allPayroll.filter(p => p.month === currentMonth || p.month.includes('June 2025'));
  const totalPaid    = monthPayroll.filter(p => p.status === 'paid').reduce((s, p) => s + p.netSalary, 0);
  const totalPending = monthPayroll.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);
  const pendingCount = monthPayroll.filter(p => p.status === 'pending').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Payroll</h2>
        <p>${currentMonth} · ${pendingCount} pending payment${pendingCount !== 1 ? 's' : ''}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="generateAllPayroll()">
          <i data-lucide="refresh-cw"></i> Generate This Month
        </button>
        <button class="btn btn-primary" onclick="processAllPayroll()">
          <i data-lucide="banknote"></i> Process All Pending
        </button>
      </div>
    </div>

    <!-- Payroll Stats -->
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-info">
          <div class="stat-value">${formatCurrency(totalPaid)}</div>
          <div class="stat-label">Paid This Month</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="clock"></i></div>
        <div class="stat-info">
          <div class="stat-value">${formatCurrency(totalPending)}</div>
          <div class="stat-label">Pending Payment</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="users"></i></div>
        <div class="stat-info">
          <div class="stat-value">${employees.length}</div>
          <div class="stat-label">Total Employees</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="trending-up"></i></div>
        <div class="stat-info">
          <div class="stat-value">${formatCurrency(totalPaid + totalPending)}</div>
          <div class="stat-label">Total Payroll</div>
        </div>
      </div>
    </div>

    <!-- Payroll Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Employee Payroll — June 2025</div>
        <select onchange="filterPayrollByStatus(this.value)" style="padding:0.4rem 0.6rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:0.82rem">
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div class="table-wrapper">
        <table id="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="payroll-tbody">
            ${buildPayrollRows(employees, allPayroll)}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function buildPayrollRows(employees, allPayroll) {
  return employees.map(emp => {
    const record = allPayroll.find(p => p.userId === emp.id && p.month === 'June 2025');
    const basic  = emp.salary;
    const allow  = Math.round(basic * 0.08);
    const deduct = Math.round(basic * 0.05);
    const net    = record ? record.netSalary : basic + allow - deduct;
    const status = record ? record.status : 'not generated';

    return `
      <tr>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar">${getInitials(emp.name)}</div>
            <div>
              <div class="emp-name">${emp.name}</div>
              <div class="emp-email">${emp.position}</div>
            </div>
          </div>
        </td>
        <td>${formatCurrency(basic)}</td>
        <td class="text-success">+${formatCurrency(allow)}</td>
        <td class="text-danger">-${formatCurrency(deduct)}</td>
        <td><strong>${formatCurrency(net)}</strong></td>
        <td>
          <span class="badge ${status === 'paid' ? 'badge-green' : status === 'pending' ? 'badge-yellow' : 'badge-gray'}">
            ${capitalize(status)}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" title="View payslip" onclick="viewPayslipModal('${emp.id}', '${record ? record.id : ''}')">
              <i data-lucide="eye"></i>
            </button>
            ${status === 'pending' ? `
              <button class="btn btn-ghost" title="Process payment" onclick="processOnePayroll('${emp.id}')">
                <i data-lucide="send"></i>
              </button>
            ` : ''}
            ${status === 'not generated' ? `
              <button class="btn btn-ghost" title="Generate payroll" onclick="generateOnePayroll('${emp.id}')">
                <i data-lucide="plus-circle"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterPayrollByStatus(status) {
  const employees = getEmployees();
  const allPayroll = getPayroll();
  let filtered = employees;
  if (status) {
    filtered = employees.filter(emp => {
      const rec = allPayroll.find(p => p.userId === emp.id && p.month === 'June 2025');
      const recStatus = rec ? rec.status : 'not generated';
      return recStatus === status;
    });
  }
  document.getElementById('payroll-tbody').innerHTML = buildPayrollRows(filtered, allPayroll);
  lucide.createIcons();
}

function generateOnePayroll(userId) {
  const emp = getUserById(userId);
  const month = 'June 2025';
  const existing = getPayroll().find(p => p.userId === userId && p.month === month);
  if (existing) { showToast('Payroll already generated.', 'warning'); return; }

  const record = calculatePayroll(userId, month);
  if (!record) return;
  record.id = 'p' + Date.now();
  const payroll = getPayroll();
  payroll.push(record);
  savePayroll(payroll);
  showToast(`Payroll generated for ${emp.name}.`, 'success');
  refreshPage();
}

function generateAllPayroll() {
  const employees = getEmployees();
  const month = 'June 2025';
  let generated = 0;
  employees.forEach(emp => {
    const existing = getPayroll().find(p => p.userId === emp.id && p.month === month);
    if (!existing) {
      const record = calculatePayroll(emp.id, month);
      if (record) {
        record.id = 'p' + Date.now() + Math.random();
        const payroll = getPayroll();
        payroll.push(record);
        savePayroll(payroll);
        generated++;
      }
    }
  });
  showToast(generated > 0 ? `Generated payroll for ${generated} employees.` : 'All payrolls already generated.', 'success');
  refreshPage();
}

function processOnePayroll(userId) {
  processPayroll(userId, 'June 2025');
  const emp = getUserById(userId);
  showToast(`Payroll processed for ${emp?.name}.`, 'success');
  refreshPage();
}

async function processAllPayroll() {
  const confirmed = await confirmDialog('Process all pending payroll payments for June 2025?', 'Process All', false);
  if (!confirmed) return;
  const pending = getPayroll().filter(p => p.status === 'pending' && p.month === 'June 2025');
  pending.forEach(p => processPayroll(p.userId, p.month));
  auditLog(`Bulk payroll processed: ${pending.length} payments`, 'payroll');
  showToast(`${pending.length} payroll payment${pending.length !== 1 ? 's' : ''} processed.`, 'success');
  refreshPage();
}

function viewPayslipModal(userId, payrollId) {
  const emp     = getUserById(userId);
  const payroll = getPayroll();
  const record  = payrollId ? payroll.find(p => p.id === payrollId) : null;
  if (!emp) return;

  const basic  = emp.salary;
  const allow  = record?.allowances  || Math.round(basic * 0.08);
  const deduct = record?.deductions  || Math.round(basic * 0.05);
  const net    = record?.netSalary   || (basic + allow - deduct);
  const month  = record?.month       || 'June 2025';
  const status = record?.status      || 'pending';
  const paid   = record?.paidDate    || '—';

  openModal(`
    <div class="modal-header">
      <h3>Payslip — ${emp.name}</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="payslip">
        <div class="payslip-header">
          <img src="images/workbuddy.png" alt="WorkBuddy" style="width:36px;height:36px;object-fit:contain" />
          <div>
            <div style="font-weight:800;font-size:1rem;color:var(--blue-primary)">WorkBuddy HR</div>
            <div class="text-sm text-muted">Official Payslip</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div class="text-sm font-semibold">${month}</div>
            <span class="badge ${status === 'paid' ? 'badge-green' : 'badge-yellow'}">${capitalize(status)}</span>
          </div>
        </div>
        <div class="payslip-emp">
          <div><span class="text-muted text-sm">Employee</span><div class="font-semibold">${emp.name}</div></div>
          <div><span class="text-muted text-sm">Position</span><div class="font-semibold">${emp.position}</div></div>
          <div><span class="text-muted text-sm">Department</span><div class="font-semibold">${emp.department}</div></div>
          <div><span class="text-muted text-sm">Payment Date</span><div class="font-semibold">${paid === '—' ? 'Pending' : formatDate(paid)}</div></div>
        </div>
        <div class="payslip-breakdown">
          <div class="payslip-row"><span>Basic Salary</span><span>${formatCurrency(basic)}</span></div>
          <div class="payslip-row"><span>Housing Allowance (5%)</span><span class="text-success">+${formatCurrency(Math.round(basic*0.05))}</span></div>
          <div class="payslip-row"><span>Transport Allowance (3%)</span><span class="text-success">+${formatCurrency(Math.round(basic*0.03))}</span></div>
          <div class="payslip-row deduction"><span>Income Tax (3%)</span><span class="text-danger">-${formatCurrency(Math.round(basic*0.03))}</span></div>
          <div class="payslip-row deduction"><span>Pension (2%)</span><span class="text-danger">-${formatCurrency(Math.round(basic*0.02))}</span></div>
        </div>
        <div class="payslip-total">
          <span>Net Pay</span>
          <span>${formatCurrency(net)}</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="printPayslip()">
        <i data-lucide="printer"></i> Print Payslip
      </button>
    </div>
  `);
}

function printPayslip() { window.print(); }
