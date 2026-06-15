/* ═══════════════════════════════════════════════
   TASK MANAGEMENT MODULE (Admin)
   Assign tasks to employees, track progress,
   set priorities and due dates
════════════════════════════════════════════════ */

function renderTasks() {
  const tasks     = getTasks();
  const employees = getEmployees();
  const pending   = tasks.filter(t => t.status === 'pending').length;
  const inProg    = tasks.filter(t => t.status === 'in-progress').length;
  const done      = tasks.filter(t => t.status === 'completed').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Task Management</h2>
        <p>${tasks.length} total tasks · ${pending} pending · ${inProg} in progress</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="openAssignTaskModal()">
          <i data-lucide="plus"></i> Assign Task
        </button>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="circle-dot"></i></div>
        <div class="stat-info"><div class="stat-value">${pending}</div><div class="stat-label">Pending</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="loader"></i></div>
        <div class="stat-info"><div class="stat-value">${inProg}</div><div class="stat-label">In Progress</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-info"><div class="stat-value">${done}</div><div class="stat-label">Completed</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="users"></i></div>
        <div class="stat-info"><div class="stat-value">${employees.length}</div><div class="stat-label">Employees</div></div>
      </div>
    </div>

    <!-- Filter row -->
    <div class="card" style="margin-bottom:1rem">
      <div class="filter-row">
        <select id="task-status-filter" onchange="filterTasks()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select id="task-priority-filter" onchange="filterTasks()">
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select id="task-emp-filter" onchange="filterTasks()">
          <option value="">All Employees</option>
          ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div id="tasks-list">
      ${buildTaskCards(tasks)}
    </div>
  `);
}

function buildTaskCards(tasks) {
  if (!tasks.length) return `<div class="card"><div class="empty-state">
    <i data-lucide="clipboard-list"></i>
    <h3>No tasks yet</h3>
    <p>Assign a task to get started</p>
  </div></div>`;

  const sorted = [...tasks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] || 1) - (order[b.priority] || 1);
  });

  return `<div style="display:flex;flex-direction:column;gap:0.75rem">
    ${sorted.map(task => {
      const emp      = getUserById(task.assignedTo);
      const assigner = getUserById(task.assignedBy);
      const isOverdue = task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'completed';
      const priorityColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

      return `
        <div class="card task-card" style="border-left:3px solid ${priorityColors[task.priority] || 'var(--border)'}">
          <div style="display:flex;align-items:flex-start;gap:1rem">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;flex-wrap:wrap">
                <span style="font-weight:700;font-size:0.925rem">${task.title}</span>
                <span class="badge ${getTaskPriorityBadge(task.priority)}">${capitalize(task.priority)}</span>
                <span class="badge ${getTaskStatusBadge(task.status)}">${capitalize(task.status.replace('-', ' '))}</span>
                ${isOverdue ? `<span class="badge badge-red">Overdue</span>` : ''}
              </div>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.5rem;line-height:1.5">${task.description}</p>
              <div style="display:flex;gap:1.25rem;flex-wrap:wrap">
                <span style="font-size:0.75rem;color:var(--text-muted)">
                  <i data-lucide="user" style="width:12px;height:12px;display:inline"></i>
                  ${emp ? emp.name : 'Unknown'}
                </span>
                <span style="font-size:0.75rem;color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'}">
                  <i data-lucide="calendar" style="width:12px;height:12px;display:inline"></i>
                  Due ${formatDate(task.dueDate)}
                </span>
                <span style="font-size:0.75rem;color:var(--text-muted)">
                  Assigned by ${assigner ? assigner.name : 'Admin'}
                </span>
              </div>


            </div>

            <div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0">
              <button class="btn btn-ghost" onclick="openEditTaskModal('${task.id}')" title="Edit task">
                <i data-lucide="pencil"></i>
              </button>
              <button class="btn btn-ghost" onclick="deleteTask('${task.id}')" title="Delete" style="color:var(--danger)">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  </div>`;
}

function filterTasks() {
  const status   = document.getElementById('task-status-filter').value;
  const priority = document.getElementById('task-priority-filter').value;
  const empId    = document.getElementById('task-emp-filter').value;

  let tasks = getTasks();
  if (status)   tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (empId)    tasks = tasks.filter(t => t.assignedTo === empId);

  document.getElementById('tasks-list').innerHTML = buildTaskCards(tasks);
  lucide.createIcons();
}

function openAssignTaskModal() {
  const employees = getEmployees();
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <div class="modal-header">
      <h3>Assign New Task</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Task Title *</label>
        <input type="text" id="task-title" placeholder="e.g. Prepare Q3 Report" />
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea id="task-desc" rows="3" placeholder="Describe what needs to be done..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Assign To *</label>
          <select id="task-emp">
            <option value="">Select employee</option>
            ${employees.map(e => `<option value="${e.id}">${e.name} — ${e.department}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="task-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Due Date *</label>
          <input type="date" id="task-due" min="${today}" />
        </div>
        <div class="form-group">
          <label>Goal / Target</label>
          <input type="text" id="task-goal" placeholder="e.g. Deliver 5 designs" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewTask()">
        <i data-lucide="send"></i> Assign Task
      </button>
    </div>
  `);
}

function saveNewTask() {
  const title    = document.getElementById('task-title').value.trim();
  const desc     = document.getElementById('task-desc').value.trim();
  const empId    = document.getElementById('task-emp').value;
  const priority = document.getElementById('task-priority').value;
  const dueDate  = document.getElementById('task-due').value;
  const goal     = document.getElementById('task-goal').value.trim();

  if (!title || !desc || !empId || !dueDate) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const task = addTask({ title, description: desc, assignedTo: empId, assignedBy: getCurrentUser().id, priority, dueDate, goal });
  const emp  = getUserById(empId);
  addNotification(`Task assigned to ${emp?.name}: "${title}"`, 'task');
  auditLog(`Task assigned: ${title}`, 'general', `To: ${emp?.name}`);
  closeModal();
  showToast(`Task assigned to ${emp?.name}!`, 'success');
  refreshPage();
}

function openEditTaskModal(taskId) {
  const task = getTasks().find(t => t.id === taskId);
  if (!task) return;

  openModal(`
    <div class="modal-header">
      <h3>Edit Task</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Task Title</label>
        <input type="text" id="edit-task-title" value="${task.title}" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="edit-task-desc" rows="3">${task.description}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select id="edit-task-status">
            <option value="pending"     ${task.status==='pending'?'selected':''}>Pending</option>
            <option value="in-progress" ${task.status==='in-progress'?'selected':''}>In Progress</option>
            <option value="completed"   ${task.status==='completed'?'selected':''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="edit-task-priority">
            <option value="high"   ${task.priority==='high'?'selected':''}>High</option>
            <option value="medium" ${task.priority==='medium'?'selected':''}>Medium</option>
            <option value="low"    ${task.priority==='low'?'selected':''}>Low</option>
          </select>
        </div>
      </div>
      <div class="form-group">
          <label>Due Date</label>
          <input type="date" id="edit-task-due" value="${task.dueDate}" />
        </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditTask('${taskId}')">
        <i data-lucide="save"></i> Save Changes
      </button>
    </div>
  `);
}

function saveEditTask(taskId) {
  const status = document.getElementById('edit-task-status').value;

  updateTask(taskId, {
    title:       document.getElementById('edit-task-title').value.trim(),
    description: document.getElementById('edit-task-desc').value.trim(),
    status,
    priority:    document.getElementById('edit-task-priority').value,
    dueDate:     document.getElementById('edit-task-due').value,
    progress:    status === 'completed' ? 100 : 0
  });

  closeModal();
  showToast('Task updated!', 'success');
  refreshPage();
}

async function deleteTask(taskId) {
  const confirmed = await confirmDialog('Delete this task? This cannot be undone.', 'Delete', true);
  if (!confirmed) return;
  const tasks = getTasks().filter(t => t.id !== taskId);
  saveTasks(tasks);
  showToast('Task deleted.', 'warning');
  refreshPage();
}

function getTaskPriorityBadge(p) {
  return { high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' }[p] || 'badge-gray';
}
function getTaskStatusBadge(s) {
  return { pending: 'badge-yellow', 'in-progress': 'badge-blue', completed: 'badge-green' }[s] || 'badge-gray';
}
