/* ═══════════════════════════════════════════════
   DATA.JS — THE DATA LAYER
   
   Think of this file as the "database" of our app.
   Since we're not using a real backend, everything
   lives in localStorage (the browser's built-in
   storage that persists even after you close the tab).

   This file does three things:
   1. Defines the default/seed data (users, employees, etc.)
   2. Provides helper functions to read/write that data
   3. Initializes the data on first load
════════════════════════════════════════════════ */


// ── SEED DATA ──────────────────────────────────
// This is the starting data the app loads with.
// In a real app, this would come from a server.

const SEED_DATA = {

  users: [
    {
      id: "u001",
      name: "Admin User",
      email: "admin@workbuddy.com",
      password: "admin123",
      role: "admin",
      department: "Human Resources",
      position: "HR Manager",
      avatar: "AU",
      phone: "+234 801 234 5678",
      joinDate: "2022-01-10",
      salary: 850000,
      status: "active"
    },
    {
      id: "u002",
      name: "John Adebayo",
      email: "john@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Engineering",
      position: "Software Developer",
      avatar: "JA",
      phone: "+234 802 345 6789",
      joinDate: "2023-03-15",
      salary: 650000,
      status: "active"
    },
    {
      id: "u003",
      name: "Amaka Okonkwo",
      email: "amaka@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Marketing",
      position: "Marketing Analyst",
      avatar: "AO",
      phone: "+234 803 456 7890",
      joinDate: "2023-06-01",
      salary: 580000,
      status: "active"
    },
    {
      id: "u004",
      name: "Emeka Nwosu",
      email: "emeka@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Finance",
      position: "Financial Analyst",
      avatar: "EN",
      phone: "+234 804 567 8901",
      joinDate: "2022-09-20",
      salary: 720000,
      status: "active"
    },
    {
      id: "u005",
      name: "Fatima Bello",
      email: "fatima@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Design",
      position: "UI/UX Designer",
      avatar: "FB",
      phone: "+234 805 678 9012",
      joinDate: "2023-11-05",
      salary: 600000,
      status: "active"
    },
    {
      id: "u006",
      name: "Chidi Obi",
      email: "chidi@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Engineering",
      position: "Backend Developer",
      avatar: "CO",
      phone: "+234 806 789 0123",
      joinDate: "2024-01-15",
      salary: 680000,
      status: "active"
    },
    {
      id: "u007",
      name: "Ngozi Eze",
      email: "ngozi@workbuddy.com",
      password: "emp123",
      role: "employee",
      department: "Operations",
      position: "Operations Lead",
      avatar: "NE",
      phone: "+234 807 890 1234",
      joinDate: "2022-05-30",
      salary: 750000,
      status: "inactive"
    }
  ],

  departments: ["Engineering", "Marketing", "Finance", "Design", "Operations", "Human Resources", "Sales", "Legal"],

  jobPostings: [
    {
      id: "j001",
      title: "Senior React Developer",
      department: "Engineering",
      type: "Full-time",
      location: "Lagos, Nigeria",
      salary: "₦800,000 - ₦1,200,000/month",
      description: "We are looking for an experienced React developer to join our growing engineering team.",
      requirements: "5+ years experience, React, Node.js, TypeScript",
      postedDate: "2025-06-01",
      status: "open",
      applicants: []
    },
    {
      id: "j002",
      title: "Digital Marketing Specialist",
      department: "Marketing",
      type: "Full-time",
      location: "Lagos, Nigeria",
      salary: "₦400,000 - ₦600,000/month",
      description: "Drive our digital marketing campaigns across all platforms.",
      requirements: "3+ years experience, SEO, Social Media, Google Ads",
      postedDate: "2025-06-03",
      status: "open",
      applicants: []
    },
    {
      id: "j003",
      title: "Product Designer",
      department: "Design",
      type: "Contract",
      location: "Remote",
      salary: "₦500,000 - ₦750,000/month",
      description: "Design intuitive user experiences for our suite of products.",
      requirements: "Figma, 3+ years experience, portfolio required",
      postedDate: "2025-05-28",
      status: "open",
      applicants: []
    }
  ],

  applicants: [
    {
      id: "a001",
      jobId: "j001",
      name: "Tunde Fashola",
      email: "tunde@gmail.com",
      phone: "+234 810 111 2222",
      experience: "6 years",
      skills: "React, TypeScript, Node.js, AWS",
      coverLetter: "I have 6 years of experience building scalable React applications for fintech companies. I'm passionate about clean code and great user experiences.",
      appliedDate: "2025-06-02",
      status: "pending",
      aiScore: null,
      aiAnalysis: null
    },
    {
      id: "a002",
      jobId: "j001",
      name: "Blessing Okafor",
      email: "blessing@outlook.com",
      phone: "+234 811 222 3333",
      experience: "4 years",
      skills: "React, JavaScript, CSS, Firebase",
      coverLetter: "Frontend developer with 4 years building React apps. Strong attention to design and performance optimization.",
      appliedDate: "2025-06-03",
      status: "pending",
      aiScore: null,
      aiAnalysis: null
    },
    {
      id: "a003",
      jobId: "j002",
      name: "Chidinma Eze",
      email: "chidinma@gmail.com",
      phone: "+234 812 333 4444",
      experience: "3 years",
      skills: "SEO, Google Ads, Meta Ads, Content Strategy",
      coverLetter: "Digital marketing professional with proven results growing brand presence by 300% in 18 months using data-driven strategies.",
      appliedDate: "2025-06-04",
      status: "pending",
      aiScore: null,
      aiAnalysis: null
    }
  ],

  attendance: [
    { id: "att001", userId: "u002", date: "2025-06-09", clockIn: "08:52", clockOut: "17:10", status: "present", hoursWorked: 8.3 },
    { id: "att002", userId: "u003", date: "2025-06-09", clockIn: "09:05", clockOut: "17:45", status: "present", hoursWorked: 8.7 },
    { id: "att003", userId: "u004", date: "2025-06-09", clockIn: "08:30", clockOut: "16:55", status: "present", hoursWorked: 8.4 },
    { id: "att004", userId: "u005", date: "2025-06-09", clockIn: null, clockOut: null, status: "absent", hoursWorked: 0 },
    { id: "att005", userId: "u006", date: "2025-06-09", clockIn: "09:20", clockOut: "17:00", status: "late", hoursWorked: 7.7 },
    { id: "att006", userId: "u002", date: "2025-06-08", clockIn: "08:45", clockOut: "17:00", status: "present", hoursWorked: 8.25 },
    { id: "att007", userId: "u003", date: "2025-06-08", clockIn: "09:00", clockOut: "17:30", status: "present", hoursWorked: 8.5 },
    { id: "att008", userId: "u004", date: "2025-06-08", clockIn: "10:15", clockOut: "17:00", status: "late", hoursWorked: 6.75 },
    { id: "att009", userId: "u002", date: "2025-06-07", clockIn: "08:50", clockOut: "17:05", status: "present", hoursWorked: 8.25 },
    { id: "att010", userId: "u006", date: "2025-06-07", clockIn: "09:00", clockOut: "17:00", status: "present", hoursWorked: 8.0 },
  ],

  leaveRequests: [
    {
      id: "l001",
      userId: "u002",
      type: "Annual Leave",
      startDate: "2025-06-20",
      endDate: "2025-06-25",
      days: 5,
      reason: "Family vacation",
      status: "pending",
      appliedDate: "2025-06-05",
      reviewedBy: null,
      reviewDate: null,
      comment: ""
    },
    {
      id: "l002",
      userId: "u003",
      type: "Sick Leave",
      startDate: "2025-06-10",
      endDate: "2025-06-11",
      days: 2,
      reason: "Medical appointment and recovery",
      status: "approved",
      appliedDate: "2025-06-09",
      reviewedBy: "u001",
      reviewDate: "2025-06-09",
      comment: "Get well soon!"
    },
    {
      id: "l003",
      userId: "u004",
      type: "Annual Leave",
      startDate: "2025-07-01",
      endDate: "2025-07-05",
      days: 5,
      reason: "Personal travel",
      status: "approved",
      appliedDate: "2025-06-01",
      reviewedBy: "u001",
      reviewDate: "2025-06-02",
      comment: "Enjoy your break!"
    },
    {
      id: "l004",
      userId: "u005",
      type: "Emergency Leave",
      startDate: "2025-06-09",
      endDate: "2025-06-09",
      days: 1,
      reason: "Family emergency",
      status: "approved",
      appliedDate: "2025-06-09",
      reviewedBy: "u001",
      reviewDate: "2025-06-09",
      comment: "Hope everything is okay."
    }
  ],

  payroll: [
    { id: "p001", userId: "u002", month: "May 2025", basicSalary: 650000, allowances: 50000, deductions: 32500, netSalary: 667500, status: "paid", paidDate: "2025-05-31" },
    { id: "p002", userId: "u003", month: "May 2025", basicSalary: 580000, allowances: 40000, deductions: 29000, netSalary: 591000, status: "paid", paidDate: "2025-05-31" },
    { id: "p003", userId: "u004", month: "May 2025", basicSalary: 720000, allowances: 60000, deductions: 36000, netSalary: 744000, status: "paid", paidDate: "2025-05-31" },
    { id: "p004", userId: "u005", month: "May 2025", basicSalary: 600000, allowances: 45000, deductions: 30000, netSalary: 615000, status: "paid", paidDate: "2025-05-31" },
    { id: "p005", userId: "u006", month: "May 2025", basicSalary: 680000, allowances: 50000, deductions: 34000, netSalary: 696000, status: "paid", paidDate: "2025-05-31" },
    { id: "p006", userId: "u002", month: "June 2025", basicSalary: 650000, allowances: 50000, deductions: 32500, netSalary: 667500, status: "pending", paidDate: null },
    { id: "p007", userId: "u003", month: "June 2025", basicSalary: 580000, allowances: 40000, deductions: 29000, netSalary: 591000, status: "pending", paidDate: null },
    { id: "p008", userId: "u004", month: "June 2025", basicSalary: 720000, allowances: 60000, deductions: 36000, netSalary: 744000, status: "pending", paidDate: null },
  ],

  performanceReviews: [
    {
      id: "pr001",
      userId: "u002",
      reviewerId: "u001",
      period: "Q1 2025",
      ratings: { communication: 4, productivity: 5, teamwork: 4, initiative: 4, quality: 5 },
      overallRating: 4.4,
      goals: ["Complete mobile app redesign", "Improve API response times by 30%"],
      achievements: ["Shipped 3 major features ahead of schedule", "Mentored 2 junior developers"],
      feedback: "John consistently delivers high-quality work and is a reliable team member.",
      aiSummary: null,
      reviewDate: "2025-04-10",
      status: "completed"
    },
    {
      id: "pr002",
      userId: "u003",
      reviewerId: "u001",
      period: "Q1 2025",
      ratings: { communication: 5, productivity: 4, teamwork: 5, initiative: 3, quality: 4 },
      overallRating: 4.2,
      goals: ["Launch Q2 campaign", "Grow social media engagement by 25%"],
      achievements: ["Increased website traffic by 40%", "Successfully managed 3 brand campaigns"],
      feedback: "Amaka has excellent communication skills and works well with cross-functional teams.",
      aiSummary: null,
      reviewDate: "2025-04-12",
      status: "completed"
    }
  ],

  notifications: [
    { id: "n001", message: "New leave request from John Adebayo", time: "10 mins ago", read: false, type: "leave" },
    { id: "n002", message: "3 new applicants for Senior React Developer", time: "1 hour ago", read: false, type: "recruitment" },
    { id: "n003", message: "June payroll processing due in 5 days", time: "2 hours ago", read: false, type: "payroll" },
    { id: "n004", message: "Fatima Bello marked absent today", time: "3 hours ago", read: true, type: "attendance" }
  ],

  // Leave balance per employee (days remaining per type)
  leaveBalances: {
    "u002": { annual: 15, sick: 8, emergency: 3, maternity: 90, paternity: 14 },
    "u003": { annual: 18, sick: 10, emergency: 3, maternity: 90, paternity: 14 },
    "u004": { annual: 12, sick: 10, emergency: 3, maternity: 90, paternity: 14 },
    "u005": { annual: 20, sick: 9, emergency: 2 },
    "u006": { annual: 20, sick: 10, emergency: 3, maternity: 90, paternity: 14 },
  }
};


/* ═══════════════════════════════════════════════
   LOCALSTORAGE HELPERS
   
   These are the functions that actually read and
   write data. Think of them like a mini database API.

   db.get(key)        → read data
   db.set(key, data)  → write data
   db.init()          → load seed data on first run
════════════════════════════════════════════════ */

const db = {

  // Read a collection from localStorage
  get(key) {
    try {
      const raw = localStorage.getItem(`wb_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`db.get error for key "${key}":`, e);
      return null;
    }
  },

  // Write a collection to localStorage
  set(key, data) {
    try {
      localStorage.setItem(`wb_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`db.set error for key "${key}":`, e);
    }
  },

  // Initialize with seed data
  // Version bump forces a re-seed so new features get their data
  init() {
    const VERSION = 'v4'; // bump this when seed data changes
    if (localStorage.getItem('wb_initialized') === VERSION) return;
    Object.keys(SEED_DATA).forEach(key => {
      this.set(key, SEED_DATA[key]);
    });
    // Clear sub-seed flags so they re-run
    localStorage.removeItem('wb_tasks_seeded');
    localStorage.removeItem('wb_passwords_hashed');
    localStorage.setItem('wb_initialized', VERSION);
    console.log('✅ WorkBuddy data initialized', VERSION);
  },

  // Reset everything (useful for testing — call db.reset() in console)
  reset() {
    Object.keys(SEED_DATA).forEach(key => {
      this.set(key, SEED_DATA[key]);
    });
    console.log('🔄 WorkBuddy data reset to defaults');
  }
};


/* ═══════════════════════════════════════════════
   CONVENIENCE DATA FUNCTIONS
   These wrap db.get/set for specific collections
   and make the modules cleaner to write.
════════════════════════════════════════════════ */

// ── Users / Employees ──
function getUsers()          { return db.get('users') || []; }
function getEmployees()      { return getUsers().filter(u => u.role === 'employee'); }
function getUserById(id)     { return getUsers().find(u => u.id === id); }
function saveUsers(users)    { db.set('users', users); }

function addUser(user) {
  const users = getUsers();
  user.id = 'u' + Date.now();
  users.push(user);
  saveUsers(users);
  return user;
}

function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return users[idx];
  }
  return null;
}

function deleteUser(id) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

// ── Authentication ──
function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (user && user.password === password) return user;
  return null;
}

// ── Session ──
function setCurrentUser(user) {
  // Don't store password in session
  const { password, ...safeUser } = user;
  sessionStorage.setItem('wb_session', JSON.stringify(safeUser));
}

function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem('wb_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem('wb_session');
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

// ── Departments ──
function getDepartments() { return db.get('departments') || []; }

// ── Job Postings ──
function getJobPostings()      { return db.get('jobPostings') || []; }
function saveJobPostings(data) { db.set('jobPostings', data); }

function addJobPosting(job) {
  const jobs = getJobPostings();
  job.id = 'j' + Date.now();
  job.applicants = [];
  jobs.push(job);
  saveJobPostings(jobs);
  return job;
}

// ── Applicants ──
function getApplicants()         { return db.get('applicants') || []; }
function saveApplicants(data)    { db.set('applicants', data); }
function getApplicantsByJob(jobId) { return getApplicants().filter(a => a.jobId === jobId); }

function addApplicant(applicant) {
  const applicants = getApplicants();
  applicant.id = 'a' + Date.now();
  applicants.push(applicant);
  saveApplicants(applicants);
  return applicant;
}

function updateApplicant(id, updates) {
  const applicants = getApplicants();
  const idx = applicants.findIndex(a => a.id === id);
  if (idx !== -1) {
    applicants[idx] = { ...applicants[idx], ...updates };
    saveApplicants(applicants);
    return applicants[idx];
  }
  return null;
}

// ── Attendance ──
function getAttendance()         { return db.get('attendance') || []; }
function saveAttendance(data)    { db.set('attendance', data); }

function getAttendanceByUser(userId) {
  return getAttendance().filter(a => a.userId === userId);
}

function getTodayAttendance() {
  const today = new Date().toISOString().split('T')[0];
  return getAttendance().filter(a => a.date === today);
}

function getUserTodayAttendance(userId) {
  const today = new Date().toISOString().split('T')[0];
  return getAttendance().find(a => a.userId === userId && a.date === today);
}

function clockIn(userId) {
  const attendance = getAttendance();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);
  const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

  const record = {
    id: 'att' + Date.now(),
    userId,
    date: today,
    clockIn: timeStr,
    clockOut: null,
    status: isLate ? 'late' : 'present',
    hoursWorked: 0
  };

  attendance.push(record);
  saveAttendance(attendance);
  return record;
}

function clockOut(userId) {
  const attendance = getAttendance();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);

  const idx = attendance.findIndex(a => a.userId === userId && a.date === today);
  if (idx !== -1) {
    attendance[idx].clockOut = timeStr;
    const [inH, inM] = attendance[idx].clockIn.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    attendance[idx].hoursWorked = parseFloat(((outH * 60 + outM - inH * 60 - inM) / 60).toFixed(2));
    saveAttendance(attendance);
    return attendance[idx];
  }
  return null;
}

// ── Leave ──
function getLeaveRequests()        { return db.get('leaveRequests') || []; }
function saveLeaveRequests(data)   { db.set('leaveRequests', data); }
function getLeaveByUser(userId)    { return getLeaveRequests().filter(l => l.userId === userId); }
function getPendingLeaves()        { return getLeaveRequests().filter(l => l.status === 'pending'); }

function addLeaveRequest(leave) {
  const leaves = getLeaveRequests();
  leave.id = 'l' + Date.now();
  leave.appliedDate = new Date().toISOString().split('T')[0];
  leave.status = 'pending';
  leaves.push(leave);
  saveLeaveRequests(leaves);
  return leave;
}

function updateLeaveStatus(id, status, reviewerId, comment = '') {
  const leaves = getLeaveRequests();
  const idx = leaves.findIndex(l => l.id === id);
  if (idx !== -1) {
    leaves[idx].status = status;
    leaves[idx].reviewedBy = reviewerId;
    leaves[idx].reviewDate = new Date().toISOString().split('T')[0];
    leaves[idx].comment = comment;
    saveLeaveRequests(leaves);
    return leaves[idx];
  }
  return null;
}

// ── Payroll ──
function getPayroll()         { return db.get('payroll') || []; }
function savePayroll(data)    { db.set('payroll', data); }
function getPayrollByUser(userId) { return getPayroll().filter(p => p.userId === userId); }

function calculatePayroll(userId, month) {
  const user = getUserById(userId);
  if (!user) return null;
  const basic = user.salary;
  const allowances = Math.round(basic * 0.08);  // 8% allowance
  const deductions = Math.round(basic * 0.05);  // 5% deduction (tax + pension)
  const net = basic + allowances - deductions;
  return { userId, month, basicSalary: basic, allowances, deductions, netSalary: net, status: 'pending', paidDate: null };
}

function processPayroll(userId, month) {
  const payroll = getPayroll();
  const existing = payroll.find(p => p.userId === userId && p.month === month);
  if (existing) {
    existing.status = 'paid';
    existing.paidDate = new Date().toISOString().split('T')[0];
    savePayroll(payroll);
    return existing;
  }
  const newRecord = calculatePayroll(userId, month);
  if (!newRecord) return null;
  newRecord.id = 'p' + Date.now();
  newRecord.status = 'paid';
  newRecord.paidDate = new Date().toISOString().split('T')[0];
  payroll.push(newRecord);
  savePayroll(payroll);
  return newRecord;
}

// ── Performance ──
function getPerformanceReviews()        { return db.get('performanceReviews') || []; }
function savePerformanceReviews(data)   { db.set('performanceReviews', data); }
function getReviewsByUser(userId)       { return getPerformanceReviews().filter(r => r.userId === userId); }

function addPerformanceReview(review) {
  const reviews = getPerformanceReviews();
  review.id = 'pr' + Date.now();
  review.reviewDate = new Date().toISOString().split('T')[0];
  const ratings = Object.values(review.ratings);
  review.overallRating = parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  reviews.push(review);
  savePerformanceReviews(reviews);
  return review;
}

function updateReview(id, updates) {
  const reviews = getPerformanceReviews();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx !== -1) {
    reviews[idx] = { ...reviews[idx], ...updates };
    savePerformanceReviews(reviews);
    return reviews[idx];
  }
  return null;
}

// ── Notifications ──
function getNotifications()       { return db.get('notifications') || []; }
function saveNotifications(data)  { db.set('notifications', data); }
function getUnreadCount()         { return getNotifications().filter(n => !n.read).length; }

function markAllRead() {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
}

function addNotification(message, type = 'info') {
  const notifs = getNotifications();
  notifs.unshift({
    id: 'n' + Date.now(),
    message,
    time: 'Just now',
    read: false,
    type
  });
  saveNotifications(notifs);
}

// ── Leave Balances ──
function getLeaveBalance(userId) {
  const balances = db.get('leaveBalances') || {};
  return balances[userId] || { annual: 20, sick: 10, emergency: 3, maternity: 90, paternity: 14 };
}


/* ═══════════════════════════════════════════════
   UTILITY / FORMAT HELPERS
════════════════════════════════════════════════ */

function formatCurrency(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRatingStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  return stars || '☆';
}

function generateId(prefix = 'id') {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 6);
}


// ── TASKS ──
function getTasks()           { return db.get('tasks') || []; }
function saveTasks(data)      { db.set('tasks', data); }
function getTasksByUser(uid)  { return getTasks().filter(t => t.assignedTo === uid); }
function getPendingTasksByUser(uid) { return getTasksByUser(uid).filter(t => t.status !== 'completed'); }

function addTask(task) {
  const tasks = getTasks();
  task.id = 'task' + Date.now();
  task.createdAt = new Date().toISOString().split('T')[0];
  task.status = 'pending';
  task.progress = 0;
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...updates }; saveTasks(tasks); return tasks[idx]; }
  return null;
}

// ── INTERVIEWS ──
function getInterviews()        { return db.get('interviews') || []; }
function saveInterviews(data)   { db.set('interviews', data); }
function getInterviewsByJob(jobId) { return getInterviews().filter(i => i.jobId === jobId); }

function addInterview(interview) {
  const interviews = getInterviews();
  interview.id = 'int' + Date.now();
  interview.status = 'scheduled';
  interviews.push(interview);
  saveInterviews(interviews);
  return interview;
}

function updateInterview(id, updates) {
  const interviews = getInterviews();
  const idx = interviews.findIndex(i => i.id === id);
  if (idx !== -1) { interviews[idx] = { ...interviews[idx], ...updates }; saveInterviews(interviews); }
}

// ── BIRTHDAYS ──
function getTodayBirthdays() {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return getUsers().filter(u => {
    if (!u.dateOfBirth) return false;
    const [, m, d] = u.dateOfBirth.split('-');
    return m === mm && d === dd;
  });
}

// ── SEED TASKS ──
const SEED_TASKS = [
  {
    id: 'task001', title: 'Complete Q2 Report', description: 'Prepare and submit the Q2 performance report covering all KPIs and team metrics for review by management.', assignedTo: 'u002', assignedBy: 'u001', dueDate: '2025-06-20', priority: 'high', status: 'in-progress', progress: 60, createdAt: '2025-06-01'
  },
  {
    id: 'task002', title: 'Update Project Documentation', description: 'Review and update all technical documentation for the current sprint. Ensure all API endpoints are documented.', assignedTo: 'u002', assignedBy: 'u001', dueDate: '2025-06-18', priority: 'medium', status: 'pending', progress: 20, createdAt: '2025-06-05'
  },
  {
    id: 'task003', title: 'Design New Campaign Assets', description: 'Create social media assets and banners for the upcoming product launch campaign. Deliver 5 designs minimum.', assignedTo: 'u003', assignedBy: 'u001', dueDate: '2025-06-25', priority: 'high', status: 'pending', progress: 0, createdAt: '2025-06-07'
  },
  {
    id: 'task004', title: 'Monthly Budget Review', description: 'Analyse last month\'s budget utilisation and prepare variance report for the finance committee meeting.', assignedTo: 'u004', assignedBy: 'u001', dueDate: '2025-06-15', priority: 'high', status: 'completed', progress: 100, createdAt: '2025-06-01'
  },
];

const SEED_INTERVIEWS = [
  {
    id: 'int001', jobId: 'j001', applicantId: 'a001', applicantName: 'Tunde Fashola',
    date: '2025-06-17', time: '10:00', duration: '45 mins',
    interviewer: 'Admin User', format: 'Video Call', notes: 'Focus on React architecture and system design.',
    status: 'scheduled'
  },
  {
    id: 'int002', jobId: 'j001', applicantId: 'a002', applicantName: 'Blessing Okafor',
    date: '2025-06-18', time: '14:00', duration: '30 mins',
    interviewer: 'Admin User', format: 'In-person', notes: 'Portfolio review and culture fit discussion.',
    status: 'scheduled'
  },
];

// Add tasks and interviews to db.init
const _originalInit = db.init.bind(db);
db.init = function() {
  _originalInit();
  if (!localStorage.getItem('wb_tasks_seeded')) {
    db.set('tasks', SEED_TASKS);
    db.set('interviews', SEED_INTERVIEWS);
    localStorage.setItem('wb_tasks_seeded', 'true');
  }
};
