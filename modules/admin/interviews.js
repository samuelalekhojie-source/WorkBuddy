/* ═══════════════════════════════════════════════
   INTERVIEW MANAGEMENT MODULE
════════════════════════════════════════════════ */

function renderInterviews() {
  const interviews = getInterviews();
  const jobs       = getJobPostings();
  const today      = new Date().toISOString().split('T')[0];
  const upcoming   = interviews.filter(i => i.date >= today && i.status === 'scheduled').length;
  const completed  = interviews.filter(i => i.status === 'completed').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Interview Management</h2>
        <p>${upcoming} upcoming · ${completed} completed</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="openScheduleInterviewModal()">
          <i data-lucide="calendar-plus"></i> Schedule Interview
        </button>
      </div>
    </div>

    <!-- Today's interviews reminder -->
    ${(() => {
      const todayInts = interviews.filter(i => i.date === today && i.status === 'scheduled');
      if (!todayInts.length) return '';
      return `<div style="background:var(--blue-faint);border:1px solid var(--blue-mid);border-radius:var(--radius);padding:1rem;margin-bottom:1.25rem;display:flex;gap:0.75rem;align-items:center">
        <div class="ai-pulse" style="width:32px;height:32px;flex-shrink:0"><i data-lucide="bell"></i></div>
        <div>
          <div style="font-weight:700;font-size:0.875rem;color:var(--blue-primary)">You have ${todayInts.length} interview${todayInts.length > 1 ? 's' : ''} today</div>
          <div style="font-size:0.78rem;color:var(--text-secondary)">${todayInts.map(i => `${i.applicantName} at ${i.time}`).join(' · ')}</div>
        </div>
      </div>`;
    })()}

    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="calendar-clock"></i></div>
        <div class="stat-info"><div class="stat-value">${upcoming}</div><div class="stat-label">Upcoming</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
        <div class="stat-info"><div class="stat-value">${completed}</div><div class="stat-label">Completed</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="users"></i></div>
        <div class="stat-info"><div class="stat-value">${interviews.length}</div><div class="stat-label">Total Scheduled</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="briefcase"></i></div>
        <div class="stat-info"><div class="stat-value">${jobs.filter(j=>j.status==='open').length}</div><div class="stat-label">Open Positions</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">All Interviews</div></div>
      ${interviews.length === 0
        ? `<div class="empty-state"><i data-lucide="calendar-x"></i><h3>No interviews scheduled</h3><p>Schedule your first interview to get started</p></div>`
        : `<div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Candidate</th><th>Position</th><th>Date & Time</th><th>Format</th><th>Interviewer</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${[...interviews].sort((a,b) => a.date.localeCompare(b.date)).map(i => {
                  const job      = jobs.find(j => j.id === i.jobId);
                  const isToday  = i.date === today;
                  const isPast   = i.date < today;
                  return `<tr>
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar" style="width:28px;height:28px;font-size:0.65rem">${getInitials(i.applicantName)}</div>
                        <div>
                          <div class="emp-name">${i.applicantName}</div>
                          ${isToday ? '<div class="emp-email" style="color:var(--blue-primary);font-weight:600">Today!</div>' : ''}
                        </div>
                      </div>
                    </td>
                    <td>${job ? job.title : '—'}</td>
                    <td>
                      <div style="font-weight:600;font-size:0.875rem">${formatDate(i.date)}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${i.time} · ${i.duration}</div>
                    </td>
                    <td><span class="badge badge-blue">${i.format}</span></td>
                    <td>${i.interviewer}</td>
                    <td><span class="badge ${i.status==='completed'?'badge-green':isPast?'badge-red':'badge-blue'}">${isPast && i.status!=='completed' ? 'Missed' : capitalize(i.status)}</span></td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-ghost" onclick="viewInterviewNotes('${i.id}')" title="View notes"><i data-lucide="file-text"></i></button>
                        ${i.status !== 'completed' ? `
                          <button class="btn btn-ghost" onclick="markInterviewComplete('${i.id}')" title="Mark complete" style="color:var(--success)"><i data-lucide="check"></i></button>
                        ` : ''}
                        <button class="btn btn-ghost" onclick="deleteInterview('${i.id}')" style="color:var(--danger)" title="Delete"><i data-lucide="trash-2"></i></button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `);
}

function openScheduleInterviewModal() {
  const jobs       = getJobPostings().filter(j => j.status === 'open');
  const applicants = getApplicants().filter(a => a.status !== 'rejected');
  const today      = new Date().toISOString().split('T')[0];

  openModal(`
    <div class="modal-header">
      <h3>Schedule Interview</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Job Position *</label>
          <select id="int-job" onchange="updateApplicantDropdown()">
            <option value="">Select position</option>
            ${jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Applicant *</label>
          <select id="int-applicant">
            <option value="">Select job first</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="int-date" min="${today}" />
        </div>
        <div class="form-group">
          <label>Time *</label>
          <input type="time" id="int-time" value="10:00" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Duration</label>
          <select id="int-duration">
            <option value="30 mins">30 minutes</option>
            <option value="45 mins" selected>45 minutes</option>
            <option value="60 mins">1 hour</option>
            <option value="90 mins">1.5 hours</option>
          </select>
        </div>
        <div class="form-group">
          <label>Format</label>
          <select id="int-format">
            <option value="Video Call">Video Call</option>
            <option value="In-person">In-person</option>
            <option value="Phone Call">Phone Call</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Interviewer</label>
        <input type="text" id="int-interviewer" value="${getCurrentUser().name}" />
      </div>
      <div class="form-group">
        <label>Notes / Preparation Points</label>
        <textarea id="int-notes" rows="3" placeholder="Topics to cover, things to assess..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveInterview()">
        <i data-lucide="calendar-plus"></i> Schedule
      </button>
    </div>
  `);
}

function updateApplicantDropdown() {
  const jobId = document.getElementById('int-job').value;
  const sel   = document.getElementById('int-applicant');
  if (!jobId) { sel.innerHTML = '<option value="">Select job first</option>'; return; }
  const apps  = getApplicants().filter(a => a.jobId === jobId && a.status !== 'rejected');
  sel.innerHTML = apps.length
    ? `<option value="">Select applicant</option>` + apps.map(a => `<option value="${a.id}" data-name="${a.name}">${a.name}</option>`).join('')
    : `<option value="">No applicants for this job</option>`;
}

function saveInterview() {
  const jobId       = document.getElementById('int-job').value;
  const appSel      = document.getElementById('int-applicant');
  const applicantId = appSel.value;
  const applicantName = appSel.options[appSel.selectedIndex]?.dataset?.name || '';
  const date        = document.getElementById('int-date').value;
  const time        = document.getElementById('int-time').value;

  if (!jobId || !applicantId || !date || !time) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  addInterview({
    jobId, applicantId, applicantName, date, time,
    duration:    document.getElementById('int-duration').value,
    format:      document.getElementById('int-format').value,
    interviewer: document.getElementById('int-interviewer').value,
    notes:       document.getElementById('int-notes').value.trim()
  });

  addNotification(`Interview scheduled: ${applicantName} on ${formatDate(date)} at ${time}`);
  closeModal();
  showToast('Interview scheduled!', 'success');
  refreshPage();
}

function viewInterviewNotes(id) {
  const i = getInterviews().find(x => x.id === id);
  if (!i) return;
  const job = getJobPostings().find(j => j.id === i.jobId);
  openModal(`
    <div class="modal-header">
      <h3>Interview Details</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="profile-grid">
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="user"></i> Candidate</span><span>${i.applicantName}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="briefcase"></i> Position</span><span>${job?.title || '—'}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="calendar"></i> Date & Time</span><span>${formatDate(i.date)} at ${i.time}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="clock"></i> Duration</span><span>${i.duration}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="video"></i> Format</span><span>${i.format}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="user-check"></i> Interviewer</span><span>${i.interviewer}</span></div>
      </div>
      ${i.notes ? `<div style="margin-top:1rem;padding:0.75rem;background:var(--surface-2);border-radius:var(--radius-sm)">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem">Preparation Notes</div>
        <p style="font-size:0.875rem;line-height:1.7">${i.notes}</p>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      ${i.status !== 'completed' ? `<button class="btn btn-primary" onclick="markInterviewComplete('${i.id}');closeModal()">Mark Complete</button>` : ''}
    </div>
  `, 'modal-lg');
}

function markInterviewComplete(id) {
  updateInterview(id, { status: 'completed' });
  showToast('Interview marked as completed.', 'success');
  refreshPage();
}

async function deleteInterview(id) {
  const confirmed = await confirmDialog('Delete this interview?', 'Delete', true);
  if (!confirmed) return;
  const interviews = getInterviews().filter(i => i.id !== id);
  saveInterviews(interviews);
  showToast('Interview deleted.', 'warning');
  refreshPage();
}
