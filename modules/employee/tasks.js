function renderEmployeeTasks() {
  const user  = getCurrentUser();
  const tasks = getTasksByUser(user.id);
  const done  = tasks.filter(t => t.status === 'completed');
  const active= tasks.filter(t => t.status !== 'completed');
  const today = new Date().toISOString().split('T')[0];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>My Tasks</h2>
        <p>${active.length} active · ${done.length} completed</p>
      </div>
    </div>

    ${tasks.length === 0 ? `
      <div class="card"><div class="empty-state">
        <i data-lucide="clipboard-check"></i>
        <h3>No tasks assigned yet</h3>
        <p>Your manager will assign tasks here when ready</p>
      </div></div>
    ` : `
      <!-- ACTIVE TASKS -->
      ${active.length ? `
        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-header">
            <div class="card-title">Active Tasks</div>
            <span class="badge badge-blue">${active.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${active.map(task => buildEmpTaskRow(task, today, false)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- COMPLETED TASKS -->
      ${done.length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">Completed</div>
            <span class="badge badge-green">${done.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${done.map(task => buildEmpTaskRow(task, today, true)).join('')}
          </div>
        </div>
      ` : ''}
    `}
  `);
}

function buildEmpTaskRow(task, today, isDone) {
  const isOverdue  = !isDone && task.dueDate < today;
  const assigner   = getUserById(task.assignedBy);
  const priorityColor = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' }[task.priority] || 'var(--border)';

  return `
    <div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.85rem;background:var(--surface-2);border-radius:var(--radius-sm);border-left:3px solid ${isDone ? 'var(--success)' : priorityColor};opacity:${isDone ? '0.65' : '1'}">

      <!-- Checkbox -->
      <button onclick="${isDone ? '' : `markTaskDone('${task.id}')`}"
        style="width:22px;height:22px;border-radius:50%;border:2px solid ${isDone ? 'var(--success)' : 'var(--border)'};background:${isDone ? 'var(--success)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;cursor:${isDone ? 'default' : 'pointer'};transition:all 0.2s"
        ${isDone ? 'disabled' : ''} title="${isDone ? 'Completed' : 'Mark as done'}">
        ${isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>

      <!-- Content -->
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.875rem;${isDone ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${task.title}</div>
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.2rem;line-height:1.5">${task.description}</p>
        ${task.goal ? `<div style="font-size:0.75rem;color:var(--blue-primary);margin-top:0.3rem;font-weight:500">Target: ${task.goal}</div>` : ''}
        <div style="display:flex;gap:1rem;margin-top:0.4rem;flex-wrap:wrap">
          <span style="font-size:0.72rem;color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'}">
            ${isOverdue ? '&#9888; Overdue · ' : ''}Due ${formatDate(task.dueDate)}
          </span>
          <span style="font-size:0.72rem;color:var(--text-muted)">From ${assigner?.name || 'Manager'}</span>
          <span class="badge ${getTaskPriorityBadge(task.priority)}" style="font-size:0.65rem">${capitalize(task.priority)}</span>
        </div>
      </div>
    </div>
  `;
}

function markTaskDone(taskId) {
  updateTask(taskId, { status: 'completed', progress: 100 });
  showToast('Task marked as complete!', 'success');
  refreshPage();
}
