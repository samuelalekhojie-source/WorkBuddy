/* ═══════════════════════════════════════════════
   SECURITY.JS — ALL SECURITY FEATURES

   1. Password hashing (SHA-256)
   2. Login rate limiting (5 attempts → 30s lockout)
   3. Session timeout (10 mins inactivity → auto logout)
   4. Activity audit log (every action tracked)
   5. Data privacy notice (first visit modal)
════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════
   1. PASSWORD HASHING — SHA-256
   
   SHA-256 is a one-way cryptographic hash function.
   "admin123" becomes a long string of letters/numbers.
   You can never reverse it back to "admin123".
   
   The browser has a built-in crypto API for this —
   no external library needed.
   
   How it works in our app:
   - On first load, we hash all seed passwords
   - When logging in, we hash what the user typed
     and compare the two hashes
   - The real password is never stored anywhere
════════════════════════════════════════════════ */

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data     = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  // Convert to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Migrate passwords to hashed on first run
async function migratePasswordsToHashed() {
  // Always re-check — don't skip even if flag exists, in case of partial migration
  const users = getUsers();
  let changed = false;

  const updated = await Promise.all(users.map(async user => {
    // Only hash if NOT already a 64-char hex SHA-256 hash
    if (user.password && !/^[a-f0-9]{64}$/.test(user.password)) {
      changed = true;
      return { ...user, password: await hashPassword(user.password) };
    }
    return user;
  }));

  if (changed) {
    saveUsers(updated);
    console.log('✅ Passwords migrated to SHA-256');
  }
  localStorage.setItem('wb_passwords_hashed', 'true');
}

// Secure authentication — handles both hashed and plain text passwords
// gracefully during the migration window
async function authenticateUserSecure(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;

  const hashed = await hashPassword(password);

  // Case 1: stored password is already a SHA-256 hash → compare hashes
  if (/^[a-f0-9]{64}$/.test(user.password)) {
    return user.password === hashed ? user : null;
  }

  // Case 2: stored password is still plain text (migration hasn't run yet)
  // → compare plain text, then immediately hash and save it
  if (user.password === password) {
    // Hash it now so it's secure going forward
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].password = hashed;
      saveUsers(users);
    }
    return user;
  }

  return null;
}


/* ═══════════════════════════════════════════════
   2. LOGIN RATE LIMITING
   
   Tracks failed login attempts per session.
   After 5 failures → lockout for 30 seconds.
   This prevents brute force attacks.
════════════════════════════════════════════════ */

const RateLimit = {
  MAX_ATTEMPTS:  5,
  LOCKOUT_MS:    30000,  // 30 seconds
  key:           'wb_login_attempts',

  getState() {
    try {
      return JSON.parse(sessionStorage.getItem(this.key)) || { attempts: 0, lockedUntil: null };
    } catch { return { attempts: 0, lockedUntil: null }; }
  },

  saveState(state) {
    sessionStorage.setItem(this.key, JSON.stringify(state));
  },

  isLocked() {
    const state = this.getState();
    if (!state.lockedUntil) return false;
    if (Date.now() < state.lockedUntil) return true;
    // Lockout expired — reset
    this.reset();
    return false;
  },

  getRemainingLockSeconds() {
    const state = this.getState();
    if (!state.lockedUntil) return 0;
    return Math.ceil((state.lockedUntil - Date.now()) / 1000);
  },

  recordFailure() {
    const state = this.getState();
    state.attempts += 1;
    if (state.attempts >= this.MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + this.LOCKOUT_MS;
    }
    this.saveState(state);
    return state;
  },

  recordSuccess() { this.reset(); },

  reset() {
    sessionStorage.removeItem(this.key);
  },

  getRemainingAttempts() {
    const state = this.getState();
    return Math.max(0, this.MAX_ATTEMPTS - state.attempts);
  }
};


/* ═══════════════════════════════════════════════
   3. SESSION TIMEOUT
   
   Tracks the last time the user interacted with
   the app. If they've been inactive for 10 minutes,
   they're automatically logged out.
   
   "Interaction" = mouse move, click, or keypress.
════════════════════════════════════════════════ */

const SessionTimeout = {
  TIMEOUT_MS:  10 * 60 * 1000,  // 10 minutes
  WARNING_MS:   2 * 60 * 1000,  // warn at 2 minutes remaining
  timer:        null,
  warningTimer: null,
  lastActivity: Date.now(),

  start() {
    this.resetTimer();
    // Listen for any user activity
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.onActivity(), { passive: true });
    });
  },

  onActivity() {
    this.lastActivity = Date.now();
    this.resetTimer();
    // Hide warning if it was showing
    const warning = document.getElementById('session-warning');
    if (warning) warning.classList.add('hidden');
  },

  resetTimer() {
    clearTimeout(this.timer);
    clearTimeout(this.warningTimer);

    // Warning at 8 minutes
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.TIMEOUT_MS - this.WARNING_MS);

    // Logout at 10 minutes
    this.timer = setTimeout(() => {
      this.expire();
    }, this.TIMEOUT_MS);
  },

  showWarning() {
    const user = getCurrentUser();
    if (!user) return;
    const warning = document.getElementById('session-warning');
    if (warning) warning.classList.remove('hidden');
  },

  expire() {
    const user = getCurrentUser();
    if (!user) return;
    this.stop();
    clearSession();
    clearChatHistory();
    showLogin();
    // Show expired message on login page
    setTimeout(() => {
      showLoginError('Your session expired due to inactivity. Please sign in again.');
    }, 100);
  },

  stop() {
    clearTimeout(this.timer);
    clearTimeout(this.warningTimer);
  }
};


/* ═══════════════════════════════════════════════
   4. ACTIVITY AUDIT LOG
   
   Every important action gets logged:
   - Who did it (user name + role)
   - What they did
   - When (timestamp)
   - Category (auth, employee, leave, payroll, etc.)
   
   Admins can view the full log in Settings.
   This is a GDPR/compliance requirement.
════════════════════════════════════════════════ */

const AuditLog = {
  KEY: 'wb_audit_log',
  MAX_ENTRIES: 200,

  getLog() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch { return []; }
  },

  log(action, category = 'general', details = '') {
    const user    = getCurrentUser();
    const entries = this.getLog();

    entries.unshift({
      id:        'log' + Date.now(),
      timestamp: new Date().toISOString(),
      userId:    user?.id || 'system',
      userName:  user?.name || 'System',
      userRole:  user?.role || 'unknown',
      action,
      category,
      details
    });

    // Keep only the most recent entries
    if (entries.length > this.MAX_ENTRIES) entries.splice(this.MAX_ENTRIES);
    localStorage.setItem(this.KEY, JSON.stringify(entries));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  }
};

// Shorthand function used across the app
function auditLog(action, category = 'general', details = '') {
  AuditLog.log(action, category, details);
}


/* ═══════════════════════════════════════════════
   5. DATA PRIVACY NOTICE
   
   Shown once on first visit. Explains what data
   the app stores and that it stays on-device.
   Checking the box dismisses it permanently.
════════════════════════════════════════════════ */

function showPrivacyNoticeIfNeeded() {
  if (localStorage.getItem('wb_privacy_accepted')) return;

  const overlay = document.createElement('div');
  overlay.id = 'privacy-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '999';
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div style="width:36px;height:36px;background:var(--blue-faint);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--blue-primary)">
            <i data-lucide="shield-check"></i>
          </div>
          <h3>Data Privacy Notice</h3>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem">
          WorkBuddy stores all employee and HR data <strong>locally on this device</strong> using your browser's localStorage. No data is transmitted to any external server except for AI features which use the Groq API.
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem">
          ${[
            ['shield', 'All data stays on your device'],
            ['lock', 'Passwords are hashed with SHA-256'],
            ['eye-off', 'No tracking or analytics collected'],
            ['server', 'AI queries are processed by Groq API'],
            ['trash-2', 'Data can be cleared at any time from Settings'],
          ].map(([icon, text]) => `
            <div style="display:flex;align-items:center;gap:0.6rem;font-size:0.82rem;color:var(--text)">
              <i data-lucide="${icon}" style="width:14px;height:14px;color:var(--success);flex-shrink:0"></i>
              ${text}
            </div>
          `).join('')}
        </div>
        <label style="display:flex;align-items:flex-start;gap:0.6rem;font-size:0.82rem;color:var(--text-secondary);cursor:pointer">
          <input type="checkbox" id="privacy-checkbox" style="margin-top:2px;accent-color:var(--blue-primary)" />
          I understand that this app stores data locally on this device and agree to the data usage described above.
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary w-full" onclick="acceptPrivacyNotice()" id="privacy-accept-btn" disabled>
          <i data-lucide="check"></i> Accept & Continue
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Enable the button only when checkbox is checked
  setTimeout(() => {
    const checkbox = document.getElementById('privacy-checkbox');
    const btn      = document.getElementById('privacy-accept-btn');
    if (checkbox && btn) {
      checkbox.addEventListener('change', () => {
        btn.disabled = !checkbox.checked;
      });
    }
    lucide.createIcons();
  }, 100);
}

function acceptPrivacyNotice() {
  localStorage.setItem('wb_privacy_accepted', 'true');
  document.getElementById('privacy-overlay')?.remove();
  auditLog('Privacy notice accepted', 'compliance');
}
