function renderProfile() {
  const user = getCurrentUser();
  const full = getUserById(user.id);
  if (!full) return;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>My Profile</h2><p>View and update your personal information</p></div>
    </div>
    <div class="dashboard-grid">
      <div class="card">
        <div class="profile-header">
          <div class="profile-avatar-lg">${getInitials(full.name)}</div>
          <div class="profile-meta">
            <h3>${full.name}</h3>
            <p>${full.position} · ${full.department}</p>
            <span class="badge badge-green">Active</span>
          </div>
        </div>
        <div class="profile-grid">
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="mail"></i> Email</span><span>${full.email}</span></div>
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="phone"></i> Phone</span><span>${full.phone||'—'}</span></div>
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="building-2"></i> Department</span><span>${full.department}</span></div>
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="briefcase"></i> Position</span><span>${full.position}</span></div>
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="calendar"></i> Join Date</span><span>${formatDate(full.joinDate)}</span></div>
          <div class="profile-field"><span class="profile-field-label"><i data-lucide="banknote"></i> Salary</span><span>${formatCurrency(full.salary)}/mo</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Edit Information</div></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="prof-phone" value="${full.phone||''}" /></div>
        <button class="btn btn-primary w-full" onclick="saveProfile()"><i data-lucide="save"></i> Save Changes</button>
      </div>
    </div>
  `);
}

function saveProfile() {
  const phone = document.getElementById('prof-phone').value.trim();
  updateUser(getCurrentUser().id, { phone });
  showToast('Profile updated!', 'success');
}
