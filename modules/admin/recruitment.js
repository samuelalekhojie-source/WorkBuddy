/* ═══════════════════════════════════════════════
   RECRUITMENT MODULE
════════════════════════════════════════════════ */

function renderRecruitment() {
  const jobs       = getJobPostings();
  const applicants = getApplicants();
  const openJobs   = jobs.filter(j => j.status === 'open').length;
  const totalApps  = applicants.length;
  const screened   = applicants.filter(a => a.aiScore !== null).length;
  const shortlisted= applicants.filter(a => a.status === 'shortlisted').length;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Recruitment</h2>
        <p>${openJobs} open position${openJobs !== 1 ? 's' : ''} &middot; ${totalApps} total applicant${totalApps !== 1 ? 's' : ''}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="showApplyPortalModal()">
          <i data-lucide="external-link"></i> Apply Portal
        </button>
        <button class="btn btn-secondary" onclick="showAllApplicantsView()">
          <i data-lucide="users"></i> All Applicants
        </button>
        <button class="btn btn-primary" onclick="openAddJobModal()">
          <i data-lucide="plus"></i> Post a Job
        </button>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="briefcase"></i></div>
        <div class="stat-info"><div class="stat-value">${openJobs}</div><div class="stat-label">Open Positions</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><i data-lucide="users"></i></div>
        <div class="stat-info"><div class="stat-value">${totalApps}</div><div class="stat-label">Total Applicants</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="sparkles"></i></div>
        <div class="stat-info"><div class="stat-value">${screened}</div><div class="stat-label">AI Screened</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i data-lucide="star"></i></div>
        <div class="stat-info"><div class="stat-value">${shortlisted}</div><div class="stat-label">Shortlisted</div></div>
      </div>
    </div>

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
  const jobApps    = allApplicants.filter(a => a.jobId === job.id);
  const pending    = jobApps.filter(a => a.status === 'pending').length;
  const screened   = jobApps.filter(a => a.aiScore !== null).length;
  const shortlisted= jobApps.filter(a => a.status === 'shortlisted').length;
  const interviews = typeof getInterviews === 'function' ? getInterviews().filter(i => i.jobId === job.id).length : 0;

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
        <span class="badge ${job.status === 'open' ? 'badge-green' : 'badge-gray'}">${capitalize(job.status)}</span>
      </div>
      <p class="job-desc">${job.description}</p>
      <div class="job-salary"><i data-lucide="banknote"></i> ${job.salary || 'Competitive'}</div>
      <div class="job-stats">
        <div class="jstat"><span class="jstat-num">${jobApps.length}</span><span class="jstat-lbl">Applied</span></div>
        <div class="jstat"><span class="jstat-num">${screened}</span><span class="jstat-lbl">Screened</span></div>
        <div class="jstat"><span class="jstat-num">${shortlisted}</span><span class="jstat-lbl">Shortlisted</span></div>
        <div class="jstat"><span class="jstat-num">${pending}</span><span class="jstat-lbl">Pending</span></div>
      </div>
      <div class="job-card-actions">
        ${job.status === 'open' ? `
          <button class="btn btn-secondary btn-sm-icon" onclick="screenAllApplicants('${job.id}')" title="AI Screen All">
            <i data-lucide="sparkles"></i> Screen All
          </button>` : ''}
        <button class="btn btn-secondary btn-sm-icon" onclick="navigate('admin-interviews')" title="Interviews">
          <i data-lucide="calendar-clock"></i> ${interviews}
        </button>
        <button class="btn btn-primary" onclick="viewJobApplicants('${job.id}')">
          <i data-lucide="users"></i> Applicants
        </button>
      </div>
    </div>
  `;
}

function viewJobApplicants(jobId) {
  const job        = getJobPostings().find(j => j.id === jobId);
  if (!job) return;
  const applicants = getApplicantsByJob(jobId);
  const main       = document.getElementById('recruitment-main');
  if (!main) return;

  main.innerHTML = `
    <div style="margin-bottom:1rem">
      <button class="btn btn-secondary" onclick="renderRecruitment()">
        <i data-lucide="arrow-left"></i> Back to Jobs
      </button>
    </div>
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-header">
        <div>
          <div class="card-title">${job.title}</div>
          <div class="text-sm text-secondary">${job.department} &middot; ${job.location} &middot; ${job.salary || 'Competitive'}</div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
          <span class="badge ${job.status === 'open' ? 'badge-green' : 'badge-gray'}">${capitalize(job.status)}</span>
          ${job.status === 'open'
            ? `<button class="btn btn-secondary text-sm" onclick="toggleJobStatus('${job.id}')"><i data-lucide="x-circle"></i> Close</button>`
            : `<button class="btn btn-secondary text-sm" onclick="toggleJobStatus('${job.id}')"><i data-lucide="refresh-cw"></i> Reopen</button>`}
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
        <select onchange="filterApplicantsByStatus(this.value, '${jobId}')"
          style="padding:0.4rem 0.6rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:0.82rem">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>
      ${applicants.length === 0
        ? `<div class="empty-state"><i data-lucide="user-x"></i><h3>No applicants yet</h3><p>Share the apply portal link to receive applications</p></div>`
        : `<div class="applicants-list" id="applicants-list-${jobId}">
            ${applicants.map(a => buildApplicantCard(a, job)).join('')}
           </div>`}
    </div>
  `;
  lucide.createIcons();
}

function buildApplicantCard(applicant, job) {
  const scoreColor = applicant.aiScore >= 80 ? 'var(--success)'
    : applicant.aiScore >= 60 ? 'var(--warning)'
    : applicant.aiScore !== null ? 'var(--danger)' : 'var(--text-muted)';
  const recBadge = { 'Strong Yes':'badge-green','Yes':'badge-blue','Maybe':'badge-yellow','No':'badge-red' };

  return `
    <div class="applicant-card" id="app-${applicant.id}">

      <!-- Header -->
      <div class="applicant-header">
        <div class="activity-avatar">${getInitials(applicant.name)}</div>
        <div class="applicant-info">
          <div class="applicant-name">${applicant.name}</div>
          <div class="applicant-sub">
            <span><i data-lucide="briefcase"></i>${applicant.experience}</span>
            <span><i data-lucide="mail"></i>${applicant.email}</span>
            ${applicant.phone ? `<span><i data-lucide="phone"></i>${applicant.phone}</span>` : ''}
            <span><i data-lucide="calendar"></i>${formatDate(applicant.appliedDate)}</span>
          </div>
          ${applicant.currentRole ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.15rem">Current role: <strong>${applicant.currentRole}</strong></div>` : ''}
          <div style="display:flex;gap:0.75rem;margin-top:0.3rem;flex-wrap:wrap">
            ${applicant.linkedin ? `<a href="${applicant.linkedin}" target="_blank" style="font-size:0.72rem;color:var(--blue-primary);display:flex;align-items:center;gap:0.25rem;text-decoration:none"><i data-lucide="linkedin" style="width:12px;height:12px"></i>LinkedIn</a>` : ''}
            ${applicant.portfolio ? `<a href="${applicant.portfolio}" target="_blank" style="font-size:0.72rem;color:var(--blue-primary);display:flex;align-items:center;gap:0.25rem;text-decoration:none"><i data-lucide="globe" style="width:12px;height:12px"></i>Portfolio</a>` : ''}
            ${applicant.salaryExpect ? `<span style="font-size:0.72rem;color:var(--warning);font-weight:600">Expected: ${applicant.salaryExpect}</span>` : ''}
            ${applicant.availability ? `<span style="font-size:0.72rem;color:var(--success);font-weight:600">Available: ${applicant.availability}</span>` : ''}
          </div>
        </div>
        <div class="applicant-score-wrap">
          ${applicant.aiScore !== null
            ? `<div class="ai-score" style="color:${scoreColor};border-color:${scoreColor}">
                <span class="score-num">${applicant.aiScore}</span>
                <span class="score-lbl">AI Score</span>
               </div>`
            : `<div class="ai-score unscreened"><i data-lucide="sparkles"></i><span>Unscreened</span></div>`}
        </div>
      </div>

      <!-- Skills -->
      <div class="applicant-skills">
        ${(applicant.skills || '').split(',').map(s => `<span class="skill-chip">${s.trim()}</span>`).join('')}
      </div>

      <!-- Cover letter preview -->
      ${applicant.coverLetter ? `
        <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:0.75rem;margin-bottom:0.6rem;border-left:3px solid var(--border-light)">
          <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.3rem">Cover Letter</div>
          <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6">
            ${applicant.coverLetter.slice(0,220)}${applicant.coverLetter.length > 220
              ? `... <button onclick="viewFullCoverLetter('${applicant.id}')" style="background:none;border:none;color:var(--blue-primary);font-size:0.78rem;cursor:pointer;padding:0;font-weight:600">Read full</button>`
              : ''}
          </p>
        </div>
      ` : ''}

      <!-- CV file -->
      ${applicant.cvFileName ? `
        <div style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.75rem;background:var(--success-bg);border:1px solid rgba(22,163,74,0.2);border-radius:var(--radius-sm);margin-bottom:0.6rem">
          <i data-lucide="file-text" style="color:var(--success);width:15px;height:15px;flex-shrink:0"></i>
          <span style="font-size:0.78rem;font-weight:600;color:var(--success);flex:1">${applicant.cvFileName}</span>
          ${applicant.cvFile
            ? `<button onclick="downloadApplicantCV('${applicant.id}')" class="btn btn-ghost" style="font-size:0.72rem;color:var(--success);padding:0.2rem 0.5rem">
                <i data-lucide="download"></i> Download
               </button>`
            : ''}
        </div>
      ` : ''}

      <!-- Other docs -->
      ${(applicant.clFileName || applicant.pfFileName) ? `
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem">
          ${applicant.clFileName ? `<span style="font-size:0.72rem;background:var(--blue-faint);color:var(--blue-primary);padding:0.2rem 0.65rem;border-radius:20px;font-weight:600"><i data-lucide="file"></i> ${applicant.clFileName}</span>` : ''}
          ${applicant.pfFileName ? `<span style="font-size:0.72rem;background:var(--blue-faint);color:var(--blue-primary);padding:0.2rem 0.65rem;border-radius:20px;font-weight:600"><i data-lucide="image"></i> ${applicant.pfFileName}</span>` : ''}
        </div>
      ` : ''}

      <!-- AI Analysis -->
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
              <div class="analysis-label">&#10003; Strengths</div>
              ${(applicant.aiAnalysis.strengths || []).map(s => `<div class="analysis-item">${s}</div>`).join('')}
            </div>
            <div>
              <div class="analysis-label">&#9888; Concerns</div>
              ${(applicant.aiAnalysis.concerns || []).map(c => `<div class="analysis-item concern">${c}</div>`).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="applicant-footer">
        <span class="badge ${getApplicantStatusBadge(applicant.status)}">${capitalize(applicant.status)}</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          ${applicant.aiScore === null ? `
            <button class="btn btn-secondary text-sm" onclick="screenSingleApplicant('${applicant.id}', '${job.id}')">
              <i data-lucide="sparkles"></i> AI Screen
            </button>` : ''}
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

function viewFullCoverLetter(applicantId) {
  const a = getApplicants().find(x => x.id === applicantId);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h3>${a.name} &mdash; Cover Letter</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="profile-grid" style="margin-bottom:1rem">
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="mail"></i> Email</span><span>${a.email}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="phone"></i> Phone</span><span>${a.phone || '&mdash;'}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="briefcase"></i> Experience</span><span>${a.experience}</span></div>
        <div class="profile-field"><span class="profile-field-label"><i data-lucide="code"></i> Skills</span><span>${a.skills}</span></div>
      </div>
      <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:1.25rem;line-height:1.8;color:var(--text);font-size:0.875rem;white-space:pre-wrap">${a.coverLetter || 'No cover letter provided.'}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

function downloadApplicantCV(applicantId) {
  const a = getApplicants().find(x => x.id === applicantId);
  if (!a?.cvFile) { showToast('CV file not available for download.', 'error'); return; }
  const link = document.createElement('a');
  link.href = a.cvFile;
  link.download = a.cvFileName || 'cv.pdf';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloaded: ${a.cvFileName}`, 'success');
  auditLog(`CV downloaded: ${a.name}`, 'recruitment');
}

async function screenSingleApplicant(applicantId, jobId) {
  const applicant = getApplicants().find(a => a.id === applicantId);
  const job       = getJobPostings().find(j => j.id === jobId);
  if (!applicant || !job) return;
  const card = document.getElementById(`app-${applicantId}`);
  if (card) {
    const btn = card.querySelector(`button[onclick*="screenSingle"]`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Screening...'; }
  }
  const result = await screenCandidate(job, applicant);
  updateApplicant(applicantId, { aiScore: result.score, aiAnalysis: result, status: result.recommendation === 'Strong Yes' ? 'shortlisted' : applicant.status });
  showToast(`${applicant.name} screened &mdash; Score: ${result.score}/100`, 'success');
  auditLog(`AI screened: ${applicant.name}`, 'recruitment', `Score: ${result.score}`);
  viewJobApplicants(jobId);
}

async function screenAllApplicants(jobId) {
  const job        = getJobPostings().find(j => j.id === jobId);
  if (!job) return;
  const unscreened = getApplicantsByJob(jobId).filter(a => a.aiScore === null);
  if (!unscreened.length) { showToast('All applicants already screened.', 'info'); return; }
  showToast(`Screening ${unscreened.length} applicant${unscreened.length > 1 ? 's' : ''}... please wait.`, 'info');
  for (const applicant of unscreened) {
    const result = await screenCandidate(job, applicant);
    updateApplicant(applicant.id, { aiScore: result.score, aiAnalysis: result, status: result.recommendation === 'Strong Yes' ? 'shortlisted' : applicant.status });
  }
  showToast(`All ${unscreened.length} applicants screened!`, 'success');
  auditLog(`Bulk AI screening: ${job.title}`, 'recruitment', `${unscreened.length} screened`);
  viewJobApplicants(jobId);
}

function filterApplicantsByStatus(status, jobId) {
  const job        = getJobPostings().find(j => j.id === jobId);
  let   applicants = getApplicantsByJob(jobId);
  if (status) applicants = applicants.filter(a => a.status === status);
  const list = document.getElementById(`applicants-list-${jobId}`);
  if (!list) return;
  list.innerHTML = applicants.length
    ? applicants.map(a => buildApplicantCard(a, job)).join('')
    : `<div class="empty-state"><i data-lucide="filter-x"></i><p>No applicants with this status</p></div>`;
  lucide.createIcons();
}

function updateApplicantStatus(applicantId, newStatus, jobId) {
  updateApplicant(applicantId, { status: newStatus });
  const labels = { shortlisted:'Shortlisted', rejected:'Rejected', hired:'Hired' };
  showToast(`Applicant ${labels[newStatus] || newStatus}`, newStatus === 'rejected' ? 'warning' : 'success');
  viewJobApplicants(jobId);
}

function showAllApplicantsView() {
  const jobs       = getJobPostings();
  const applicants = getApplicants();
  const main       = document.getElementById('recruitment-main');
  if (!main) return;
  main.innerHTML = `
    <div style="margin-bottom:1rem">
      <button class="btn btn-secondary" onclick="renderRecruitment()"><i data-lucide="arrow-left"></i> Back to Jobs</button>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">All Applicants (${applicants.length})</div></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Applicant</th><th>Applied For</th><th>Experience</th><th>CV</th><th>AI Score</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${applicants.length === 0
              ? `<tr><td colspan="7"><div class="empty-state"><i data-lucide="users"></i><p>No applicants yet</p></div></td></tr>`
              : applicants.map(a => {
                  const job        = jobs.find(j => j.id === a.jobId);
                  const scoreColor = a.aiScore >= 80 ? 'var(--success)' : a.aiScore >= 60 ? 'var(--warning)' : a.aiScore !== null ? 'var(--danger)' : 'var(--text-muted)';
                  return `<tr>
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar">${getInitials(a.name)}</div>
                        <div><div class="emp-name">${a.name}</div><div class="emp-email">${a.email}</div></div>
                      </div>
                    </td>
                    <td>${job ? job.title : '&mdash;'}</td>
                    <td>${a.experience}</td>
                    <td>${a.cvFileName
                      ? `<button onclick="downloadApplicantCV('${a.id}')" class="btn btn-ghost" style="font-size:0.72rem;color:var(--success)"><i data-lucide="download"></i> CV</button>`
                      : '<span class="text-muted text-xs">None</span>'}</td>
                    <td>${a.aiScore !== null ? `<span style="font-weight:700;color:${scoreColor}">${a.aiScore}/100</span>` : '<span class="text-muted">—</span>'}</td>
                    <td><span class="badge ${getApplicantStatusBadge(a.status)}">${capitalize(a.status)}</span></td>
                    <td>${formatDate(a.appliedDate)}</td>
                  </tr>`;
                }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function openAddJobModal() {
  const departments = typeof getDepartments === 'function' ? getDepartments() : [];
  openModal(`
    <div class="modal-header">
      <h3>Post a New Job</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Job Title *</label><input type="text" id="job-title" placeholder="e.g. Senior Backend Developer" /></div>
      <div class="form-row">
        <div class="form-group"><label>Department *</label><select id="job-dept"><option value="">Select department</option>${departments.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
        <div class="form-group"><label>Type</label><select id="job-type"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Location</label><input type="text" id="job-location" value="Lagos, Nigeria" /></div>
        <div class="form-group"><label>Salary Range</label><input type="text" id="job-salary" placeholder="e.g. &#8358;500,000 - &#8358;800,000/month" /></div>
      </div>
      <div class="form-group"><label>Job Description *</label><textarea id="job-desc" rows="3" placeholder="Describe the role..."></textarea></div>
      <div class="form-group"><label>Requirements *</label><textarea id="job-req" rows="2" placeholder="e.g. 3+ years, React, Node.js..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewJob()"><i data-lucide="send"></i> Publish Job</button>
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
  if (!title || !dept || !desc || !req) { showToast('Please fill in all required fields.', 'error'); return; }
  addJobPosting({ title, department: dept, type, location, salary, description: desc, requirements: req, postedDate: new Date().toISOString().split('T')[0], status: 'open' });
  addNotification(`New job posted: ${title}`, 'recruitment');
  auditLog(`Job posted: ${title}`, 'recruitment');
  closeModal();
  showToast(`"${title}" posted!`, 'success');
  refreshPage();
}

async function toggleJobStatus(jobId) {
  const jobs  = getJobPostings();
  const idx   = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return;
  const newStatus = jobs[idx].status === 'open' ? 'closed' : 'open';
  const confirmed = await confirmDialog(`${newStatus === 'closed' ? 'Close' : 'Reopen'} "${jobs[idx].title}"?`, newStatus === 'closed' ? 'Close' : 'Reopen', newStatus === 'closed');
  if (!confirmed) return;
  jobs[idx].status = newStatus;
  saveJobPostings(jobs);
  showToast(`Position ${newStatus}.`, 'success');
  renderRecruitment();
}

function showApplyPortalModal() {
  const applyUrl = window.location.href.replace(/\/[^/]*$/, '/apply.html');
  openModal(`
    <div class="modal-header">
      <h3>Applicant Portal Link</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <p class="text-secondary text-sm" style="margin-bottom:1rem">Share this link with candidates. They can browse open positions, upload their CV and apply. Applications appear here instantly.</p>
      <div style="display:flex;gap:0.5rem;align-items:center">
        <input type="text" id="portal-url" value="${applyUrl}" readonly style="flex:1;padding:0.65rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);color:var(--text);font-size:0.8rem;font-family:monospace" />
        <button class="btn btn-primary" onclick="copyPortalLink()"><i data-lucide="copy"></i> Copy</button>
      </div>
      <button class="btn btn-secondary w-full" style="margin-top:0.75rem" onclick="window.open('apply.html','_blank')">
        <i data-lucide="external-link"></i> Preview Portal
      </button>
    </div>
  `);
}

function copyPortalLink() {
  const input = document.getElementById('portal-url');
  if (input) {
    navigator.clipboard.writeText(input.value)
      .then(() => showToast('Portal link copied!', 'success'))
      .catch(() => { input.select(); document.execCommand('copy'); showToast('Copied!', 'success'); });
  }
}

function getApplicantStatusBadge(status) {
  return { pending:'badge-yellow', shortlisted:'badge-blue', rejected:'badge-red', hired:'badge-green' }[status] || 'badge-gray';
}
