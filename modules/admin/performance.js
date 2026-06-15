/* ═══════════════════════════════════════════════
   PERFORMANCE MODULE
   - All employee reviews with ratings
   - Add new review with star ratings
   - AI-generated professional summary via Groq
   - Rating breakdown per category
════════════════════════════════════════════════ */

function renderPerformance() {
  const reviews   = getPerformanceReviews();
  const employees = getEmployees();
  const avgRating = reviews.length
    ? (reviews.reduce((s,r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : '—';

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>Performance Management</h2>
        <p>${reviews.length} reviews · Average rating: ${avgRating}/5</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="openAddReviewModal()">
          <i data-lucide="plus"></i> New Review
        </button>
      </div>
    </div>

    <!-- Performance overview cards -->
    <div class="perf-overview" style="margin-bottom:1.25rem">
      ${employees.map(emp => {
        const empReviews = getReviewsByUser(emp.id);
        const latest = empReviews[empReviews.length - 1];
        return `
          <div class="perf-emp-card">
            <div class="perf-emp-header">
              <div class="emp-avatar">${getInitials(emp.name)}</div>
              <div style="flex:1;min-width:0">
                <div class="emp-name">${emp.name}</div>
                <div class="emp-email">${emp.position}</div>
              </div>
              ${latest ? `
                <div class="perf-rating ${getRatingClass(latest.overallRating)}">
                  ${latest.overallRating}
                </div>
              ` : `<span class="badge badge-gray">No review</span>`}
            </div>
            ${latest ? `
              <div class="perf-bars">
                ${Object.entries(latest.ratings).map(([key,val]) => `
                  <div class="perf-bar-row">
                    <span class="perf-bar-label">${capitalize(key)}</span>
                    <div class="perf-bar-track">
                      <div class="perf-bar-fill" style="width:${val/5*100}%;background:${getRatingColor(val)}"></div>
                    </div>
                    <span class="perf-bar-val">${val}/5</span>
                  </div>
                `).join('')}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem">
                <span class="text-xs text-muted">${latest.period}</span>
                <button class="btn btn-ghost text-xs" onclick="viewReviewDetail('${latest.id}')">
                  View <i data-lucide="arrow-right"></i>
                </button>
              </div>
            ` : `
              <button class="btn btn-secondary w-full" style="margin-top:0.5rem" onclick="openAddReviewModal('${emp.id}')">
                <i data-lucide="plus"></i> Add Review
              </button>
            `}
          </div>
        `;
      }).join('')}
    </div>

    <!-- Reviews Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">All Reviews</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Employee</th><th>Period</th><th>Rating</th><th>Reviewer</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${reviews.length === 0
              ? `<tr><td colspan="7"><div class="empty-state"><i data-lucide="star"></i><p>No reviews yet</p></div></td></tr>`
              : reviews.map(r => {
                  const emp = getUserById(r.userId);
                  const reviewer = getUserById(r.reviewerId);
                  return `<tr>
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar" style="width:28px;height:28px;font-size:0.65rem">${getInitials(emp?.name||'?')}</div>
                        <span class="emp-name">${emp?.name||'Unknown'}</span>
                      </div>
                    </td>
                    <td>${r.period}</td>
                    <td>
                      <span class="perf-rating-sm ${getRatingClass(r.overallRating)}">${r.overallRating}/5</span>
                    </td>
                    <td>${reviewer?.name||'—'}</td>
                    <td>${formatDate(r.reviewDate)}</td>
                    <td><span class="badge ${r.status==='completed'?'badge-green':'badge-yellow'}">${capitalize(r.status)}</span></td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-ghost" onclick="viewReviewDetail('${r.id}')"><i data-lucide="eye"></i></button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function viewReviewDetail(reviewId) {
  const review = getPerformanceReviews().find(r => r.id === reviewId);
  const emp    = getUserById(review.userId);
  if (!review || !emp) return;

  openModal(`
    <div class="modal-header">
      <h3>Performance Review — ${emp.name}</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div>
          <div class="font-semibold">${review.period}</div>
          <div class="text-sm text-muted">${formatDate(review.reviewDate)}</div>
        </div>
        <div class="perf-rating ${getRatingClass(review.overallRating)}" style="width:56px;height:56px;font-size:1.1rem">
          ${review.overallRating}
        </div>
      </div>

      <div class="perf-bars" style="margin-bottom:1rem">
        ${Object.entries(review.ratings).map(([key,val]) => `
          <div class="perf-bar-row">
            <span class="perf-bar-label">${capitalize(key)}</span>
            <div class="perf-bar-track">
              <div class="perf-bar-fill" style="width:${val/5*100}%;background:${getRatingColor(val)}"></div>
            </div>
            <span class="perf-bar-val">${val}/5</span>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom:0.75rem">
        <div class="text-sm font-semibold" style="margin-bottom:0.4rem">Achievements</div>
        ${review.achievements.map(a => `<div class="analysis-item">✅ ${a}</div>`).join('')}
      </div>

      <div style="margin-bottom:0.75rem">
        <div class="text-sm font-semibold" style="margin-bottom:0.4rem">Goals Set</div>
        ${review.goals.map(g => `<div class="analysis-item">🎯 ${g}</div>`).join('')}
      </div>

      <div style="margin-bottom:0.75rem">
        <div class="text-sm font-semibold" style="margin-bottom:0.4rem">Manager Feedback</div>
        <p class="text-sm" style="line-height:1.7;color:var(--text)">${review.feedback}</p>
      </div>

      <!-- AI Summary section -->
      <div class="ai-insight-card" style="padding:1rem">
        <div class="ai-insight-header" style="margin-bottom:0.75rem">
          <div class="ai-pulse" style="width:32px;height:32px"><i data-lucide="sparkles"></i></div>
          <div><div class="font-semibold text-sm">AI Review Summary</div></div>
          <button class="btn btn-secondary text-sm" onclick="generateReviewSummary('${review.id}')">
            ${review.aiSummary ? '<i data-lucide="refresh-cw"></i> Regenerate' : '<i data-lucide="sparkles"></i> Generate'}
          </button>
        </div>
        <div id="ai-review-summary">
          ${review.aiSummary
            ? `<p style="font-size:0.875rem;line-height:1.7;color:var(--text)">${review.aiSummary}</p>`
            : `<p class="text-sm text-muted">Click "Generate" to create an AI-written professional summary of this review.</p>`
          }
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `, 'modal-lg');
}

async function generateReviewSummary(reviewId) {
  const review = getPerformanceReviews().find(r => r.id === reviewId);
  const emp    = getUserById(review.userId);
  const el     = document.getElementById('ai-review-summary');
  if (!el || !review || !emp) return;

  el.innerHTML = `<div class="loading-state" style="padding:0.5rem 0"><div class="spinner"></div><span>Writing summary...</span></div>`;
  const summary = await generatePerformanceSummary(review, emp);
  updateReview(reviewId, { aiSummary: summary });
  el.innerHTML = `<p style="font-size:0.875rem;line-height:1.7;color:var(--text)">${summary}</p>`;
}

function openAddReviewModal(preselectedUserId = '') {
  const employees = getEmployees();

  openModal(`
    <div class="modal-header">
      <h3>New Performance Review</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Employee *</label>
          <select id="rev-emp">
            <option value="">Select employee</option>
            ${employees.map(e => `<option value="${e.id}" ${e.id===preselectedUserId?'selected':''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Review Period *</label>
          <input type="text" id="rev-period" placeholder="e.g. Q2 2025" />
        </div>
      </div>

      <div class="text-sm font-semibold" style="margin-bottom:0.75rem">Ratings (1-5)</div>
      <div class="ratings-grid">
        ${['communication','productivity','teamwork','initiative','quality'].map(cat => `
          <div class="rating-row">
            <span class="rating-label">${capitalize(cat)}</span>
            <div class="star-rating" id="stars-${cat}">
              ${[1,2,3,4,5].map(n => `
                <button type="button" class="star-btn" data-cat="${cat}" data-val="${n}" onclick="setRating('${cat}',${n})">★</button>
              `).join('')}
            </div>
            <span class="rating-val" id="val-${cat}">0</span>
          </div>
        `).join('')}
      </div>

      <div class="form-group" style="margin-top:1rem">
        <label>Achievements (one per line)</label>
        <textarea id="rev-achievements" rows="2" placeholder="e.g. Completed project ahead of schedule"></textarea>
      </div>
      <div class="form-group">
        <label>Goals for Next Period (one per line)</label>
        <textarea id="rev-goals" rows="2" placeholder="e.g. Improve code review turnaround"></textarea>
      </div>
      <div class="form-group">
        <label>Manager Feedback</label>
        <textarea id="rev-feedback" rows="2" placeholder="Overall assessment and comments..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveReview()">
        <i data-lucide="save"></i> Save Review
      </button>
    </div>
  `, 'modal-lg');

  // Initialize ratings storage
  window._reviewRatings = { communication:0, productivity:0, teamwork:0, initiative:0, quality:0 };
}

function setRating(category, value) {
  window._reviewRatings[category] = value;
  document.getElementById(`val-${category}`).textContent = value;
  const stars = document.querySelectorAll(`#stars-${category} .star-btn`);
  stars.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.val) <= value);
  });
}

function saveReview() {
  const userId      = document.getElementById('rev-emp').value;
  const period      = document.getElementById('rev-period').value.trim();
  const achievements= document.getElementById('rev-achievements').value.split('\n').filter(Boolean);
  const goals       = document.getElementById('rev-goals').value.split('\n').filter(Boolean);
  const feedback    = document.getElementById('rev-feedback').value.trim();
  const ratings     = window._reviewRatings || {};

  if (!userId || !period) { showToast('Employee and period are required.', 'error'); return; }
  const allZero = Object.values(ratings).every(v => v === 0);
  if (allZero) { showToast('Please set at least one rating.', 'error'); return; }

  const review = {
    userId, period,
    reviewerId: getCurrentUser().id,
    ratings, achievements, goals, feedback,
    aiSummary: null, status: 'completed'
  };

  addPerformanceReview(review);
  closeModal();
  showToast('Performance review saved!', 'success');
  refreshPage();
}


