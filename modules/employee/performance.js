function renderEmployeePerformance() {
  const user    = getCurrentUser();
  const reviews = getReviewsByUser(user.id);
  const latest  = reviews[reviews.length - 1];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>My Performance</h2><p>${reviews.length} review${reviews.length!==1?'s':''} on record</p></div>
    </div>
    ${latest ? `
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
          <div class="card-title">Latest Review — ${latest.period}</div>
          <div class="perf-rating ${getRatingClass(latest.overallRating)}">${latest.overallRating}/5</div>
        </div>
        <div class="perf-bars">
          ${Object.entries(latest.ratings).map(([key,val]) => `
            <div class="perf-bar-row">
              <span class="perf-bar-label">${capitalize(key)}</span>
              <div class="perf-bar-track"><div class="perf-bar-fill" style="width:${val/5*100}%;background:${getRatingColor(val)}"></div></div>
              <span class="perf-bar-val">${val}/5</span>
            </div>
          `).join('')}
        </div>
        ${latest.feedback ? `<div style="margin-top:1rem;padding:0.75rem;background:var(--surface-2);border-radius:var(--radius-sm)"><p class="text-sm" style="line-height:1.7">${latest.feedback}</p></div>` : ''}
        ${latest.aiSummary ? `
          <div class="ai-insight-card" style="margin-top:1rem;padding:0.75rem">
            <div class="ai-insight-header" style="margin-bottom:0.5rem">
              <div class="ai-pulse" style="width:28px;height:28px"><i data-lucide="sparkles"></i></div>
              <div class="text-sm font-semibold">AI Summary</div>
            </div>
            <p class="text-sm" style="line-height:1.7">${latest.aiSummary}</p>
          </div>
        ` : ''}
      </div>
    ` : `<div class="card" style="margin-bottom:1.25rem"><div class="empty-state"><i data-lucide="star"></i><h3>No reviews yet</h3><p>Your performance reviews will appear here</p></div></div>`}
    ${reviews.length > 0 ? `
      <div class="card">
        <div class="card-header"><div class="card-title">Review History</div></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Period</th><th>Rating</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              ${reviews.slice().reverse().map(r => `<tr>
                <td>${r.period}</td>
                <td><span class="perf-rating-sm ${getRatingClass(r.overallRating)}">${r.overallRating}/5</span></td>
                <td>${formatDate(r.reviewDate)}</td>
                <td><button class="btn btn-ghost" onclick="viewReviewDetail('${r.id}')"><i data-lucide="eye"></i></button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `);
}
