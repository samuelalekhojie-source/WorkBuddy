/* ═══════════════════════════════════════════════
   RECRUITMENT MODULE

   Handles the full hiring pipeline:
   1. Job postings — create, view, close positions
   2. Applicant tracking — all candidates per job
   3. AI screening — Groq scores each candidate
      against the job requirements automatically
   4. Status management — shortlist, reject, hire
════════════════════════════════════════════════ */

function renderRecruitment() {
  const jobs = getJobPostings();
  const applicants = getApplicants();

  const openJobs    = jobs.filter(j => j.status === 'open').length;
  const totalApps   = applicants.length;
  const screened    = applicants.filter(a => a.aiScore !== null).length;
  const shortlisted = applicants.filter(a => a.status === 'shortlisted').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Recruitment</h2>
        <p>${openJobs} open positions · ${totalApps} total applicants</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="showApplicantsView()">
          <i data-lucide="users"></i> All Applicants
        </button>
        <button class="btn btn-primary" onclick="openAddJobModal()">
          <i data-lucide="plus"></i> Post a Job
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="briefcase"></i></div>
        <div class="stat-info">
          <div class="stat-value">${openJobs}</div>
          <div class="stat-label">Open Positions</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="users"></i></div>
        <div class="stat-info">
          <div class="stat-value">${totalApps}</div>
          <div class="stat-label">Total Applicants</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="sparkles"></i></div>
        <div class="stat-info">
          <div class="stat-value">${screened}</div>
          <div class="stat-label">AI Screened</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="star"></i></div>
        <div class="stat-info">
          <div class="stat-value">${shortlisted}</div>
          <div class="stat-label">Shortlisted</div>
        </div>
      </div>
    </div>

    <!-- Job Listings -->
    <div id="recruitment-main">
      ${jobs.length === 0
        ? `<div class="card"><div class="empty-state">
            <i data-lucide="briefcase"></i>
            <h3>No job postings yet</h3>
            <p>Click "Post a Job" to create your first listing</p>
           </div></div>`
        : `<div class="jobs-grid" id="jobs-grid">
            ${jobs.map(job => buildJobCard(job, applicants)).join('')}
           </div>`
      }
    </div>
  `);
}

function buildJobCard(job, allApplicants) {
  const jobApps  = allApplicants.filter(a => a.jobId === job.id);
  const pending  = jobApps.filter(a => a.status === 'pending').length;
  const screened = jobApps.filter(a => a.aiScore !== null).length;
  const shortlisted = jobApps.filter(a => a.status === 'shortlisted').length;

  return `
    <div class="job-card ${job.status === 'closed' ? 'job-closed' : ''}">
      <div class="job-card-header">
        <div>
          <div class="job-title">${job.title}</div>
          <div class="job-meta">
            <span><i data-lucide="building-2"></i>${job.department}</span>
            <span><i data-lucide="map-pin"></i>${job.location}</span>
            <span><i data-lucide="clock"></i>${job.type}</span>
          </div>
        </div>
        <span class="badge ${job.status === 'open' ? 'badge-green' : 'badge-gray'}">
          ${capitalize(job.status)}
        </span>
      </div>

      <p class="job-desc">${job.description}</p>

      <div class="job-salary">
        <i data-lucide="banknote"></i> ${job.salary}
      </div>

      <div class="job-stats">
        <div class="jstat">
          <span class="jstat-num">${jobApps.length}</span>
          <span class="jstat-lbl">Applied</span>
        </div>
        <div class="jstat">
          <span class="jstat-num">${screened}</span>
          <span class="jstat-lbl">AI Screened</span>
        </div>
        <div class="jstat">
          <span class="jstat-num">${shortlisted}</span>
          <span class="jstat-lbl">Shortlisted</span>
        </div>
        <div class="jstat">
          <span class="jstat-num">${pending}</span>
          <span class="jstat-lbl">Pending</span>
        </div>
      </div>

      <div class="job-card-footer">
        <span class="text-xs text-muted">Posted ${formatDate(job.postedDate)}</span>
        <div style="display:flex;gap:0.5rem">
          ${job.status === 'open' ? `
            <button class="btn btn-secondary" onclick="screenAllApplicants('${job.id}')">
              <i data-lucide="sparkles"></i> Screen All
            </button>
          ` : ''}
          <button class="btn btn-primary" onclick="viewJobApplicants('${job.id}')">
            <i data-lucide="users"></i> View Applicants
          </button>
        </div>
      </div>
    </div>
  `;
}


/* ── VIEW APPLICANTS FOR A JOB ── */
function viewJobApplicants(jobId) {
  const job = getJobPostings().find(j => j.id === jobId);
  if (!job) return;
  const applicants = getApplicantsByJob(jobId);

  const content = document.getElementById('recruitment-main');
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom:1rem">
      <button class="btn btn-secondary" onclick="renderRecruitment()">
        <i data-lucide="arrow-left"></i> Back to Jobs
      </button>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-header">
        <div>
          <div class="card-title">${job.title}</div>
          <div class="text-sm text-secondary">${job.department} · ${job.location} · ${job.salary}</div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <span class="badge ${job.status === 'open' ? 'badge-green' : 'badge-gray'}">${capitalize(job.status)}</span>
          ${job.status === 'open' ? `
            <button class="btn btn-secondary text-sm" onclick="toggleJobStatus('${job.id}')">
              <i data-lucide="x-circle"></i> Close Position
            </button>
          ` : `
            <button class="btn btn-secondary text-sm" onclick="toggleJobStatus('${job.id}')">
              <i data-lucide="refresh-cw"></i> Reopen
            </button>
          `}
          <button class="btn btn-primary" onclick="screenAllApplicants('${job.id}')">
            <i data-lucide="sparkles"></i> AI Screen All
          </button>
        </div>
      </div>
      <p class="text-sm text-secondary">${job.requirements}</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Applicants (${applicants.length})</div>
        <div style="display:flex;gap:0.5rem">
          <select onchange="filterApplicantsByStatus(this.value, '${jobId}')" style="padding:0.4rem 0.6rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:0.82rem">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>
      </div>

      ${applicants.length === 0
        ? `<div class="empty-state">
            <i data-lucide="user-x"></i>
            <h3>No applicants yet</h3>
            <p>Share the job link to start receiving applications</p>
           </div>`
        : `<div class="applicants-list" id="applicants-list-${jobId}">
            ${applicants.map(a => buildApplicantCard(a, job)).join('')}
           </div>`
      }
    </div>
  `;
  lucide.createIcons();
}

function buildApplicantCard(applicant, job) {
  const scoreColor = applicant.aiScore >= 80 ? 'var(--success)'
    : applicant.aiScore >= 60 ? 'var(--warning)'
    : applicant.aiScore !== null ? 'var(--danger)' : 'var(--text-muted)';

  const recBadge = {
    'Strong Yes': 'badge-green',
    'Yes': 'badge-blue',
    'Maybe': 'badge-yellow',
    'No': 'badge-red'
  };

  return `
    <div class="applicant-card" id="app-${applicant.id}">
      <div class="applicant-header">
        <div class="activity-avatar">${getInitials(applicant.name)}</div>
        <div class="applicant-info">
          <div class="applicant-name">${applicant.name}</div>
          <div class="applicant-sub">
            <span><i data-lucide="briefcase"></i>${applicant.experience} experience</span>
            <span><i data-lucide="mail"></i>${applicant.email}</span>
            <span><i data-lucide="calendar"></i>Applied ${formatDate(applicant.appliedDate)}</span>
          </div>
        </div>
        <div class="applicant-score-wrap">
          ${applicant.aiScore !== null
            ? `<div class="ai-score" style="color:${scoreColor};border-color:${scoreColor}">
                <span class="score-num">${applicant.aiScore}</span>
                <span class="score-lbl">AI Score</span>
               </div>`
            : `<div class="ai-score unscreened">
                <i data-lucide="sparkles"></i>
                <span>Not screened</span>
               </div>`
          }
        </div>
      </div>

      <div class="applicant-skills">
        ${applicant.skills.split(',').map(s => `<span class="skill-chip">${s.trim()}</span>`).join('')}
      </div>

      ${applicant.aiAnalysis ? `
        <div class="ai-analysis-box">
          <div class="ai-analysis-header">
            <i data-lucide="sparkles"></i>
            <span>AI Analysis</span>
            ${applicant.aiAnalysis.recommendation ? `<span class="badge ${recBadge[applicant.aiAnalysis.recommendation] || 'badge-gray'} ml-auto">${applicant.aiAnalysis.recommendation}</span>` : ''}
          </div>
          <p class="ai-analysis-summary">${applicant.aiAnalysis.summary}</p>
          <div class="ai-analysis-lists">
            <div>
              <div class="analysis-label">✅ Strengths</div>
              ${(applicant.aiAnalysis.strengths || []).map(s => `<div class="analysis-item">${s}</div>`).join('')}
            </div>
            <div>
              <div class="analysis-label">⚠️ Concerns</div>
              ${(applicant.aiAnalysis.concerns || []).map(c => `<div class="analysis-item concern">${c}</div>`).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <div class="applicant-footer">
        <span class="badge ${getApplicantStatusBadge(applicant.status)}">${capitalize(applicant.status)}</span>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn btn-secondary text-sm" onclick="viewCoverLetter('${applicant.id}')">
            <i data-lucide="file-text"></i> Cover Letter
          </button>
          ${applicant.aiScore === null ? `
            <button class="btn btn-secondary text-sm" onclick="screenSingleApplicant('${applicant.id}', '${job.id}')">
              <i data-lucide="sparkles"></i> AI Screen
            </button>
          ` : ''}
          <button class="btn btn-secondary text-sm" onclick="updateApplicantStatus('${applicant.id}', 'shortlisted', '${job.id}')">
            <i data-lucide="star"></i> Shortlist
          </button>
          <button class="btn btn-primary text-sm" onclick="updateApplicantStatus('${applicant.id}', 'hired', '${job.id}')">
            <i data-lucide="check"></i> Hire
          </button>
          <button class="btn btn-ghost text-sm" onclick="updateApplicantStatus('${applicant.id}', 'rejected', '${job.id}')" style="color:var(--danger)">
            <i data-lucide="x"></i> Reject
          </button>
        </div>
      </div>
    </div>
  `;
}


/* ── AI SCREEN SINGLE APPLICANT ── */
async function screenSingleApplicant(applicantId, jobId) {
  const applicant = getApplicants().find(a => a.id === applicantId);
  const job = getJobPostings().find(j => j.id === jobId);
  if (!applicant || !job) return;

  // Show loading state on the card
  const card = document.getElementById(`app-${applicantId}`);
  if (card) {
    const btn = card.querySelector('button[onclick*="screenSingle"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Screening...'; }
  }

  const result = await screenCandidate(job, applicant);

  // Save to data
  updateApplicant(applicantId, {
    aiScore: result.score,
    aiAnalysis: result,
    status: result.recommendation === 'Strong Yes' ? 'shortlisted' : applicant.status
  });

  showToast(`${applicant.name} screened — Score: ${result.score}/100`, 'success');
  viewJobApplicants(jobId); // refresh the view
}


/* ── AI SCREEN ALL APPLICANTS FOR A JOB ── */
async function screenAllApplicants(jobId) {
  const job = getJobPostings().find(j => j.id === jobId);
  if (!job) return;

  const unscreened = getApplicantsByJob(jobId).filter(a => a.aiScore === null);
  if (unscreened.length === 0) {
    showToast('All applicants for this job are already screened.', 'info');
    return;
  }

  showToast(`Screening ${unscreened.length} applicant${unscreened.length > 1 ? 's' : ''}... This may take a moment.`, 'info');

  // Screen one at a time to avoid rate limits
  for (const applicant of unscreened) {
    const result = await screenCandidate(job, applicant);
    updateApplicant(applicant.id, {
      aiScore: result.score,
      aiAnalysis: result,
      status: result.recommendation === 'Strong Yes' ? 'shortlisted' : applicant.status
    });
  }

  showToast(`All ${unscreened.length} applicants screened successfully!`, 'success');
  viewJobApplicants(jobId);
}


/* ── FILTER APPLICANTS BY STATUS ── */
function filterApplicantsByStatus(status, jobId) {
  const job = getJobPostings().find(j => j.id === jobId);
  let applicants = getApplicantsByJob(jobId);
  if (status) applicants = applicants.filter(a => a.status === status);

  const list = document.getElementById(`applicants-list-${jobId}`);
  if (!list) return;

  list.innerHTML = applicants.length
    ? applicants.map(a => buildApplicantCard(a, job)).join('')
    : `<div class="empty-state"><i data-lucide="filter-x"></i><p>No applicants with this status</p></div>`;
  lucide.createIcons();
}


/* ── VIEW COVER LETTER ── */
function viewCoverLetter(applicantId) {
  const applicant = getApplicants().find(a => a.id === applicantId);
  if (!applicant) return;

  openModal(`
    <div class="modal-header">
      <h3>${applicant.name} — Cover Letter</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:1.25rem;line-height:1.8;color:var(--text)">
        ${applicant.coverLetter || 'No cover letter provided.'}
      </div>
      <div class="profile-grid" style="margin-top:1rem">
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="mail"></i> Email</span>
          <span>${applicant.email}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="phone"></i> Phone</span>
          <span>${applicant.phone}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="briefcase"></i> Experience</span>
          <span>${applicant.experience}</span>
        </div>
        <div class="profile-field">
          <span class="profile-field-label"><i data-lucide="code"></i> Skills</span>
          <span>${applicant.skills}</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}


/* ── UPDATE APPLICANT STATUS ── */
function updateApplicantStatus(applicantId, newStatus, jobId) {
  updateApplicant(applicantId, { status: newStatus });
  const statusLabels = { shortlisted: 'Shortlisted', rejected: 'Rejected', hired: 'Hired ✓' };
  showToast(`Applicant ${statusLabels[newStatus] || newStatus}`, newStatus === 'rejected' ? 'warning' : 'success');
  viewJobApplicants(jobId);
}


/* ── ALL APPLICANTS VIEW ── */
function showApplicantsView() {
  const jobs = getJobPostings();
  const applicants = getApplicants();
  const content = document.getElementById('recruitment-main');
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom:1rem">
      <button class="btn btn-secondary" onclick="renderRecruitment()">
        <i data-lucide="arrow-left"></i> Back to Jobs
      </button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">All Applicants (${applicants.length})</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Applied For</th>
              <th>Experience</th>
              <th>AI Score</th>
              <th>Status</th>
              <th>Applied Date</th>
            </tr>
          </thead>
          <tbody>
            ${applicants.length === 0
              ? `<tr><td colspan="6"><div class="empty-state"><i data-lucide="users"></i><p>No applicants yet</p></div></td></tr>`
              : applicants.map(a => {
                  const job = jobs.find(j => j.id === a.jobId);
                  const scoreColor = a.aiScore >= 80 ? 'var(--success)' : a.aiScore >= 60 ? 'var(--warning)' : a.aiScore !== null ? 'var(--danger)' : 'var(--text-muted)';
                  return `
                    <tr>
                      <td>
                        <div class="emp-cell">
                          <div class="emp-avatar">${getInitials(a.name)}</div>
                          <div>
                            <div class="emp-name">${a.name}</div>
                            <div class="emp-email">${a.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>${job ? job.title : '—'}</td>
                      <td>${a.experience}</td>
                      <td>
                        ${a.aiScore !== null
                          ? `<span style="font-weight:700;color:${scoreColor}">${a.aiScore}/100</span>`
                          : `<span class="text-muted text-sm">—</span>`}
                      </td>
                      <td><span class="badge ${getApplicantStatusBadge(a.status)}">${capitalize(a.status)}</span></td>
                      <td>${formatDate(a.appliedDate)}</td>
                    </tr>
                  `;
                }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
  lucide.createIcons();
}


/* ── ADD JOB POSTING MODAL ── */
function openAddJobModal() {
  const departments = getDepartments();

  openModal(`
    <div class="modal-header">
      <h3>Post a New Job</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Job Title *</label>
        <input type="text" id="job-title" placeholder="e.g. Senior Backend Developer" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Department *</label>
          <select id="job-dept">
            <option value="">Select department</option>
            ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Employment Type</label>
          <select id="job-type">
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Internship</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="job-location" placeholder="e.g. Lagos, Nigeria" value="Lagos, Nigeria" />
        </div>
        <div class="form-group">
          <label>Salary Range</label>
          <input type="text" id="job-salary" placeholder="e.g. ₦500,000 - ₦800,000/month" />
        </div>
      </div>
      <div class="form-group">
        <label>Job Description *</label>
        <textarea id="job-desc" rows="3" placeholder="Describe the role and responsibilities..."></textarea>
      </div>
      <div class="form-group">
        <label>Requirements *</label>
        <textarea id="job-req" rows="2" placeholder="e.g. 3+ years experience, React, Node.js..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewJob()">
        <i data-lucide="send"></i> Publish Job
      </button>
    </div>
  `, 'modal-lg');
}

function saveNewJob() {
  const title    = document.getElementById('job-title').value.trim();
  const dept     = document.getElementById('job-dept').value;
  const type     = document.getElementById('job-type').value;
  const location = document.getElementById('job-location').value.trim();
  const salary   = document.getElementById('job-salary').value.trim();
  const desc     = document.getElementById('job-desc').value.trim();
  const req      = document.getElementById('job-req').value.trim();

  if (!title || !dept || !desc || !req) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  addJobPosting({
    title, department: dept, type, location, salary,
    description: desc, requirements: req,
    postedDate: new Date().toISOString().split('T')[0],
    status: 'open'
  });

  addNotification(`New job posted: ${title}`, 'recruitment');
  closeModal();
  auditLog(`Job posted: ${title}`, 'recruitment', `Dept: ${dept}`);
  showToast(`"${title}" posted successfully!`, 'success');
  refreshPage();
}


/* ── TOGGLE JOB STATUS ── */
async function toggleJobStatus(jobId) {
  const jobs = getJobPostings();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return;

  const newStatus = jobs[idx].status === 'open' ? 'closed' : 'open';
  const confirmed = await confirmDialog(
    `${newStatus === 'closed' ? 'Close' : 'Reopen'} the position "${jobs[idx].title}"?`,
    newStatus === 'closed' ? 'Close Position' : 'Reopen',
    newStatus === 'closed'
  );
  if (!confirmed) return;

  jobs[idx].status = newStatus;
  saveJobPostings(jobs);
  showToast(`Position ${newStatus === 'closed' ? 'closed' : 'reopened'}.`, 'success');
  renderRecruitment();
}


/* ── HELPERS ── */
function getApplicantStatusBadge(status) {
  const map = {
    pending: 'badge-yellow',
    shortlisted: 'badge-blue',
    rejected: 'badge-red',
    hired: 'badge-green'
  };
  return map[status] || 'badge-gray';
}
