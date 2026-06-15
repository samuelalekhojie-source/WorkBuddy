function renderProfile() {
  const user = getCurrentUser();
  const full = getUserById(user.id);
  if (!full) return;

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>My Profile</h2>
        <p>View and update your personal information</p>
      </div>
    </div>

    <div class="profile-page-grid">

      <!-- LEFT: Profile card -->
      <div class="card">
        <!-- Avatar with edit button -->
        <div style="display:flex;flex-direction:column;align-items:center;padding:1.5rem 1rem;border-bottom:1px solid var(--border-light);margin-bottom:1.25rem">
          <div class="profile-avatar-wrap" style="margin-bottom:0.75rem">
            <div class="profile-avatar-lg" id="profile-avatar-display">
              ${full.avatarImg
                ? `<img src="${full.avatarImg}" alt="${full.name}" />`
                : `<span>${getInitials(full.name)}</span>`}
            </div>
            <label class="avatar-edit-btn" title="Change photo">
              <i data-lucide="camera"></i>
              <input type="file" accept="image/*" onchange="handleAvatarUpload(event)" />
            </label>
          </div>
          <h3 style="font-size:1.1rem;font-weight:800;text-align:center">${full.name}</h3>
          <p style="color:var(--text-secondary);font-size:0.875rem;margin-top:0.2rem">${full.position}</p>
          <span class="badge badge-blue" style="margin-top:0.5rem">${full.department}</span>
        </div>

        <!-- Info fields -->
        <div class="profile-grid">
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="mail"></i> Email</span>
            <span>${full.email}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="phone"></i> Phone</span>
            <span>${full.phone || '—'}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="calendar"></i> Join Date</span>
            <span>${formatDate(full.joinDate)}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="banknote"></i> Salary</span>
            <span>${formatCurrency(full.salary)}/mo</span>
          </div>
          ${full.dateOfBirth ? `
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="cake"></i> Birthday</span>
            <span>${formatDate(full.dateOfBirth)}</span>
          </div>` : ''}
          <div class="profile-field">
            <span class="profile-field-label"><i data-lucide="shield"></i> Role</span>
            <span>${capitalize(full.role)}</span>
          </div>
        </div>

        <!-- Emergency contact -->
        ${full.emergencyContact ? `
          <div style="margin-top:1rem;padding:0.75rem;background:var(--danger-bg);border-radius:var(--radius-sm);border-left:3px solid var(--danger)">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--danger);margin-bottom:0.35rem">Emergency Contact</div>
            <div style="font-size:0.875rem;font-weight:600">${full.emergencyContact.name} <span style="font-weight:400;color:var(--text-secondary)">· ${full.emergencyContact.relationship}</span></div>
            <div style="font-size:0.82rem;color:var(--text-secondary)">${full.emergencyContact.phone}</div>
          </div>
        ` : ''}
      </div>

      <!-- RIGHT: Edit form -->
      <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Personal info -->
        <div class="card">
          <div class="card-header"><div class="card-title">Edit Personal Info</div></div>

          <div class="form-group">
            <label>Phone Number</label>
            <div class="input-wrapper">
              <i data-lucide="phone" class="input-icon"></i>
              <input type="tel" id="prof-phone" value="${full.phone || ''}" placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div class="form-group">
            <label>Date of Birth</label>
            <div class="input-wrapper">
              <i data-lucide="cake" class="input-icon"></i>
              <input type="date" id="prof-dob" value="${full.dateOfBirth || ''}" />
            </div>
          </div>

          <button class="btn btn-primary w-full" onclick="saveProfile()">
            <i data-lucide="save"></i> Save Changes
          </button>
        </div>

        <!-- Emergency contact -->
        <div class="card">
          <div class="card-header"><div class="card-title">Emergency Contact</div></div>

          <div class="form-row">
            <div class="form-group">
              <label>Contact Name</label>
              <input type="text" id="prof-ec-name" value="${full.emergencyContact?.name || ''}" placeholder="Full name" />
            </div>
            <div class="form-group">
              <label>Relationship</label>
              <input type="text" id="prof-ec-rel" value="${full.emergencyContact?.relationship || ''}" placeholder="e.g. Spouse, Parent" />
            </div>
          </div>
          <div class="form-group">
            <label>Contact Phone</label>
            <input type="tel" id="prof-ec-phone" value="${full.emergencyContact?.phone || ''}" placeholder="+234 800 000 0000" />
          </div>

          <button class="btn btn-secondary w-full" onclick="saveEmergencyContact()">
            <i data-lucide="save"></i> Update Emergency Contact
          </button>
        </div>

        <!-- Change password -->
        <div class="card">
          <div class="card-header"><div class="card-title">Change Password</div></div>

          <div class="form-group">
            <label>Current Password</label>
            <input type="password" id="prof-current-pw" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="prof-new-pw" placeholder="Minimum 6 characters" />
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input type="password" id="prof-confirm-pw" placeholder="Repeat new password" />
          </div>

          <button class="btn btn-secondary w-full" onclick="changePassword()">
            <i data-lucide="lock"></i> Update Password
          </button>
        </div>

      </div>
    </div>
  `);
}

/* ── AVATAR UPLOAD ── */
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Image must be smaller than 2MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    updateUser(getCurrentUser().id, { avatarImg: base64 });

    // Update display immediately without full re-render
    const display = document.getElementById('profile-avatar-display');
    if (display) {
      display.innerHTML = `<img src="${base64}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    }

    // Update topbar avatar
    const topbarAvatar = document.getElementById('topbar-avatar');
    if (topbarAvatar) {
      topbarAvatar.innerHTML = `<img src="${base64}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    }

    // Update sidebar avatar
    const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
    if (sidebarAvatar) {
      sidebarAvatar.style.padding = '0';
      sidebarAvatar.style.overflow = 'hidden';
      sidebarAvatar.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
    }

    showToast('Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

/* ── SAVE PERSONAL INFO ── */
function saveProfile() {
  const phone = document.getElementById('prof-phone').value.trim();
  const dob   = document.getElementById('prof-dob').value;

  if (!phone) {
    showToast('Please enter a phone number.', 'error');
    return;
  }

  updateUser(getCurrentUser().id, { phone, dateOfBirth: dob });
  showToast('Profile updated successfully!', 'success');
  auditLog('Employee updated own profile', 'general');
}

/* ── SAVE EMERGENCY CONTACT ── */
function saveEmergencyContact() {
  const name  = document.getElementById('prof-ec-name').value.trim();
  const rel   = document.getElementById('prof-ec-rel').value.trim();
  const phone = document.getElementById('prof-ec-phone').value.trim();

  if (!name || !phone) {
    showToast('Please enter contact name and phone.', 'error');
    return;
  }

  updateUser(getCurrentUser().id, {
    emergencyContact: { name, relationship: rel, phone }
  });
  showToast('Emergency contact updated!', 'success');
}

/* ── CHANGE PASSWORD ── */
async function changePassword() {
  const currentPw = document.getElementById('prof-current-pw').value;
  const newPw     = document.getElementById('prof-new-pw').value;
  const confirmPw = document.getElementById('prof-confirm-pw').value;

  if (!currentPw || !newPw || !confirmPw) {
    showToast('Please fill all password fields.', 'error');
    return;
  }
  if (newPw.length < 6) {
    showToast('New password must be at least 6 characters.', 'error');
    return;
  }
  if (newPw !== confirmPw) {
    showToast('New passwords do not match.', 'error');
    return;
  }

  // Verify current password
  const user = getUserById(getCurrentUser().id);
  const currentHashed = await hashPassword(currentPw);
  if (user.password !== currentHashed) {
    showToast('Current password is incorrect.', 'error');
    return;
  }

  const newHashed = await hashPassword(newPw);
  updateUser(getCurrentUser().id, { password: newHashed });

  // Clear fields
  document.getElementById('prof-current-pw').value = '';
  document.getElementById('prof-new-pw').value     = '';
  document.getElementById('prof-confirm-pw').value = '';

  auditLog('Employee changed password', 'auth');
  showToast('Password changed successfully!', 'success');
}
