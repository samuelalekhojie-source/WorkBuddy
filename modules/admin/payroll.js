/* ═══════════════════════════════════════════════
   PAYROLL MODULE — with Paystack Integration

   Payment flow:
   1. Admin clicks "Pay" on a pending payroll record
   2. Paystack popup opens with the exact net salary
   3. Employee "pays" using test card (demo)
   4. On success, Paystack returns a reference
   5. Payslip is marked paid with the reference
════════════════════════════════════════════════ */

const PAYSTACK_PUBLIC_KEY = 'pk_test_2973a852eda5a9d0d3a44e8a5365481c380ceefa';

function renderPayroll() {
  const employees  = getEmployees();
  const allPayroll = getPayroll();
  const month      = 'June 2025';

  const monthPayroll  = allPayroll.filter(p => p.month === month);
  const totalPaid     = monthPayroll.filter(p => p.status === 'paid').reduce((s,p) => s + p.netSalary, 0);
  const totalPending  = monthPayroll.filter(p => p.status === 'pending').reduce((s,p) => s + p.netSalary, 0);
  const pendingCount  = monthPayroll.filter(p => p.status === 'pending').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Payroll</h2>
        <p>${month} &middot; ${pendingCount} pending payment${pendingCount !== 1 ? 's' : ''}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="generateAllPayroll()">
          <i data-lucide="refresh-cw"></i> Generate This Month
        </button>
        <button class="btn btn-primary" onclick="processAllPayrollPaystack()">
          <i data-lucide="banknote"></i> Pay All Pending
        </button>
      </div>
    </div>

    <!-- Stats -->
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
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="users"></i></div>
        <div class="stat-info">
          <div class="stat-value">${employees.length}</div>
          <div class="stat-label">Employees</div>
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

    <!-- Paystack demo hint -->
    <div style="background:var(--blue-faint);border:1px solid var(--blue-mid);border-radius:var(--radius);padding:0.85rem 1.1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:0.75rem">
      <img src="https://website.paystack.com/assets/img/favicon-32.png" style="width:20px;height:20px;border-radius:4px" onerror="this.style.display='none'" />
      <div style="flex:1">
        <span style="font-size:0.82rem;font-weight:600;color:var(--blue-primary)">Paystack Integration Active</span>
        <span style="font-size:0.78rem;color:var(--text-secondary);margin-left:0.5rem">Test mode &middot; Use card <code style="background:var(--surface);padding:0.1rem 0.3rem;border-radius:3px;font-size:0.75rem">4084 0840 8408 4081</code> &middot; Any future date &middot; Any CVV</span>
      </div>
      <span class="badge badge-green">Live</span>
    </div>

    <!-- Payroll Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Employee Payroll — ${month}</div>
        <select onchange="filterPayrollByStatus(this.value)"
          style="padding:0.4rem 0.6rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:0.82rem">
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
              <th>Reference</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="payroll-tbody">
            ${buildPayrollRows(employees, allPayroll, month)}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function buildPayrollRows(employees, allPayroll, month) {
  return employees.map(emp => {
    const record = allPayroll.find(p => p.userId === emp.id && p.month === month);
    const basic  = emp.salary;
    const allow  = record?.allowances || Math.round(basic * 0.08);
    const deduct = record?.deductions  || Math.round(basic * 0.05);
    const net    = record?.netSalary   || (basic + allow - deduct);
    const status = record ? record.status : 'not generated';
    const ref    = record?.paystackRef || null;

    return `
      <tr>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar" style="overflow:hidden">
              ${emp.avatarImg
                ? `<img src="${emp.avatarImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
                : getInitials(emp.name)}
            </div>
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
            ${capitalize(status.replace('-', ' '))}
          </span>
        </td>
        <td>
          ${ref
            ? `<span style="font-size:0.72rem;font-family:monospace;color:var(--success)">${ref}</span>`
            : `<span style="color:var(--text-muted);font-size:0.78rem">—</span>`}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" title="View payslip"
              onclick="viewPayslipModal('${emp.id}', '${record?.id || ''}')">
              <i data-lucide="eye"></i>
            </button>
            ${status === 'pending' ? `
              <button class="btn btn-ghost" title="Pay via Paystack" style="color:var(--blue-primary)"
                onclick="paySingleViaPaystack('${emp.id}', '${record?.id || ''}')">
                <i data-lucide="credit-card"></i>
              </button>
            ` : ''}
            ${status === 'not generated' ? `
              <button class="btn btn-ghost" title="Generate payroll"
                onclick="generateOnePayroll('${emp.id}')">
                <i data-lucide="plus-circle"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}


/* ═══════════════════════════════════════════════
   PAYSTACK PAYMENT HANDLERS
════════════════════════════════════════════════ */

// Pay a single employee via Paystack popup
function paySingleViaPaystack(userId, payrollId) {
  const emp     = getUserById(userId);
  const payroll = getPayroll();
  const record  = payrollId ? payroll.find(p => p.id === payrollId) : null;
  if (!emp) return;

  const net     = record?.netSalary || (emp.salary + Math.round(emp.salary * 0.08) - Math.round(emp.salary * 0.05));
  const month   = record?.month || 'June 2025';

  // Paystack expects amount in KOBO (multiply naira by 100)
  const amountInKobo = net * 100;

  openPaystackPopup({
    email:    emp.email,
    amount:   amountInKobo,
    name:     emp.name,
    metadata: {
      employee_id:   emp.id,
      employee_name: emp.name,
      payroll_month: month,
      payroll_id:    payrollId,
      department:    emp.department
    },
    onSuccess: (reference) => {
      // Mark as paid with Paystack reference
      markPayrollPaid(userId, payrollId, month, reference);
    },
    onClose: () => {
      showToast('Payment cancelled.', 'warning');
    }
  });
}

// Pay all pending employees one by one
async function processAllPayrollPaystack() {
  const employees  = getEmployees();
  const allPayroll = getPayroll();
  const month      = 'June 2025';
  const pending    = allPayroll.filter(p => p.status === 'pending' && p.month === month);

  if (!pending.length) {
    showToast('No pending payroll to process.', 'info');
    return;
  }

  const confirmed = await confirmDialog(
    `Process ${pending.length} pending payment${pending.length > 1 ? 's' : ''} via Paystack? Each employee will be paid individually.`,
    'Pay All',
    false
  );
  if (!confirmed) return;

  // Pay first pending employee — user can repeat for each
  const first = pending[0];
  paySingleViaPaystack(first.userId, first.id);
  if (pending.length > 1) {
    showToast(`Processing payment 1 of ${pending.length}. Continue for remaining after this completes.`, 'info');
  }
}

// Core Paystack popup opener
function openPaystackPopup({ email, amount, name, metadata, onSuccess, onClose }) {
  // Check SDK loaded
  if (typeof PaystackPop === 'undefined') {
    showToast('Paystack is loading... please try again in a moment.', 'warning');
    return;
  }

  const handler = PaystackPop.setup({
    key:       PAYSTACK_PUBLIC_KEY,
    email:     email,
    amount:    amount,
    currency:  'NGN',
    ref:       'WB-' + Date.now(),
    metadata:  {
      custom_fields: [
        { display_name: 'Employee',   variable_name: 'employee',   value: name },
        { display_name: 'Department', variable_name: 'department', value: metadata.department },
        { display_name: 'Month',      variable_name: 'month',      value: metadata.payroll_month }
      ],
      ...metadata
    },
    callback: function(response) {
      onSuccess(response.reference);
    },
    onClose: function() {
      onClose();
    }
  });

  handler.openIframe();
}

// Mark a payroll record as paid after Paystack success
function markPayrollPaid(userId, payrollId, month, paystackRef) {
  const payroll = getPayroll();
  const today   = new Date().toISOString().split('T')[0];

  if (payrollId) {
    const idx = payroll.findIndex(p => p.id === payrollId);
    if (idx !== -1) {
      payroll[idx].status      = 'paid';
      payroll[idx].paidDate    = today;
      payroll[idx].paystackRef = paystackRef;
      savePayroll(payroll);
    }
  } else {
    // Generate and mark paid in one step
    const emp    = getUserById(userId);
    const basic  = emp.salary;
    const allow  = Math.round(basic * 0.08);
    const deduct = Math.round(basic * 0.05);
    const newRec = {
      id:          'p' + Date.now(),
      userId,
      month,
      basicSalary: basic,
      allowances:  allow,
      deductions:  deduct,
      netSalary:   basic + allow - deduct,
      status:      'paid',
      paidDate:    today,
      paystackRef: paystackRef
    };
    payroll.push(newRec);
    savePayroll(payroll);
  }

  const emp = getUserById(userId);
  auditLog(`Payroll paid via Paystack: ${emp?.name}`, 'payroll', `Ref: ${paystackRef}`);
  addNotification(`Salary paid to ${emp?.name} via Paystack`, 'payroll');

  showToast(`Payment successful! Ref: ${paystackRef}`, 'success');
  refreshPage();
}


/* ═══════════════════════════════════════════════
   GENERATE / FILTER HELPERS
════════════════════════════════════════════════ */

function filterPayrollByStatus(status) {
  const employees  = getEmployees();
  const allPayroll = getPayroll();
  const month      = 'June 2025';
  let filtered     = employees;

  if (status) {
    filtered = employees.filter(emp => {
      const rec = allPayroll.find(p => p.userId === emp.id && p.month === month);
      const st  = rec ? rec.status : 'not generated';
      return st === status;
    });
  }

  document.getElementById('payroll-tbody').innerHTML = buildPayrollRows(filtered, allPayroll, month);
  lucide.createIcons();
}

function generateOnePayroll(userId) {
  const month    = 'June 2025';
  const existing = getPayroll().find(p => p.userId === userId && p.month === month);
  if (existing) { showToast('Payroll already generated.', 'warning'); return; }

  const record = calculatePayroll(userId, month);
  if (!record) return;
  record.id = 'p' + Date.now();
  const payroll = getPayroll();
  payroll.push(record);
  savePayroll(payroll);
  showToast('Payroll generated.', 'success');
  refreshPage();
}

function generateAllPayroll() {
  const employees = getEmployees();
  const month     = 'June 2025';
  let generated   = 0;

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

  showToast(
    generated > 0 ? `Generated payroll for ${generated} employees.` : 'All payrolls already generated.',
    'success'
  );
  refreshPage();
}
