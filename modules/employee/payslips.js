function renderPayslips() {
  const user    = getCurrentUser();
  const payroll = getPayrollByUser(user.id);

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>My Payslips</h2><p>${payroll.length} payslip${payroll.length!==1?'s':''} available</p></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Payslip History</div></div>
      ${payroll.length === 0
        ? `<div class="empty-state"><i data-lucide="receipt"></i><h3>No payslips yet</h3><p>Your payslips will appear here once processed</p></div>`
        : `<div class="table-wrapper">
            <table>
              <thead><tr><th>Month</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${payroll.slice().reverse().map(p => `
                  <tr>
                    <td><strong>${p.month}</strong></td>
                    <td>${formatCurrency(p.basicSalary)}</td>
                    <td class="text-success">+${formatCurrency(p.allowances)}</td>
                    <td class="text-danger">-${formatCurrency(p.deductions)}</td>
                    <td><strong>${formatCurrency(p.netSalary)}</strong></td>
                    <td><span class="badge ${p.status==='paid'?'badge-green':'badge-yellow'}">${capitalize(p.status)}</span></td>
                    <td>
                      <button class="btn btn-ghost" onclick="viewPayslipModal('${user.id}', '${p.id}')">
                        <i data-lucide="eye"></i>
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `);
}
