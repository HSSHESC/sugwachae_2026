// 개발용 임시 저장 — 배포 전 제거 예정
sessionStorage.setItem('debug_admin_pw', 'NAVENADMIN');

// === Section Navigation ===
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
let adminUnlocked = false;

function showSection(target, updateHash = true) {
  const section = document.getElementById(target) ? target : 'home';

  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  sections.forEach(item => {
    item.classList.toggle('active', item.id === section);
  });

  if (updateHash && window.location.hash !== `#${section}`) {
    history.pushState(null, '', `#${section}`);
  }

  if (section === 'admin') {
    loadAdminDashboard();
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    if (link.dataset.section !== 'admin' && !adminUnlocked) return;
    showSection(link.dataset.section);
  });
});

function safeTarget(target) {
  return (target === 'admin' && adminUnlocked) ? 'home' : target;
}

window.addEventListener('popstate', () => {
  showSection(safeTarget(window.location.hash.slice(1) || 'home'), false);
});

window.addEventListener('hashchange', () => {
  showSection(window.location.hash.slice(1) || 'home', false);
});

window.addEventListener('DOMContentLoaded', () => {
  showSection(safeTarget(window.location.hash.slice(1) || 'home'), false);
});

// === Login ===
const loginButton = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');

function setMessageState(success) {
  loginMessage.classList.remove('hidden');
  loginMessage.style.background = success ? '#dcfce7' : '#fee2e2';
  loginMessage.style.borderColor = success ? '#86efac' : '#fca5a5';
  loginMessage.style.color = success ? '#166534' : '#991b1b';
}

function renderLoginMessage(message, query, success) {
  setMessageState(success);
  loginMessage.replaceChildren();

  const text = document.createElement('span');
  text.textContent = message;
  loginMessage.append(text);

  if (query) {
    const lineBreak = document.createElement('br');
    const code = document.createElement('code');
    code.className = 'query-preview';
    code.textContent = query;
    loginMessage.append(lineBreak, code);
  }
}

loginButton.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  loginMessage.classList.remove('hidden');
  loginMessage.style.background = '#eff6ff';
  loginMessage.style.borderColor = '#bfdbfe';
  loginMessage.style.color = '#1d4ed8';
  loginMessage.textContent = '처리 중...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    renderLoginMessage(data.message, data.query, data.success);

    if (data.success && data.user?.role === 'admin') {
      showSection('admin');
    }
  } catch (e) {
    renderLoginMessage('서버에 연결할 수 없습니다.', '', false);
  }
});

// === Admin Dashboard ===
const adminDenied = document.getElementById('admin-denied');
const adminGate = document.getElementById('admin-gate');
const adminDashboard = document.getElementById('admin-dashboard');
const adminRole = document.getElementById('admin-role');
const adminAccessForm = document.getElementById('admin-access-form');
const adminAccessPassword = document.getElementById('admin-access-password');
const adminAccessMessage = document.getElementById('admin-access-message');
const dashboardRole = document.getElementById('dashboard-role');
const dashboardStats = document.getElementById('dashboard-stats');
const dashboardLogs = document.getElementById('dashboard-logs');
let pendingAdminDashboard = null;

function showAccessDenied(role = 'guest') {
  adminDenied.classList.remove('hidden');
  adminGate.classList.add('hidden');
  adminDashboard.classList.add('hidden');
  adminRole.textContent = role;
  adminRole.className = role === 'admin' ? 'badge badge-success' : 'badge badge-default';
  pendingAdminDashboard = null;
}

function showAdminGate(data) {
  pendingAdminDashboard = data;
  adminDenied.classList.add('hidden');
  adminGate.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
  adminAccessPassword.value = '';
  adminAccessMessage.classList.add('hidden');
  adminAccessPassword.focus();
}

function renderAdminAccessMessage(message, success) {
  adminAccessMessage.classList.remove('hidden');
  adminAccessMessage.style.background = success ? '#dcfce7' : '#fee2e2';
  adminAccessMessage.style.borderColor = success ? '#86efac' : '#fca5a5';
  adminAccessMessage.style.color = success ? '#166534' : '#991b1b';
  adminAccessMessage.textContent = message;
}

async function loadContract() {
  const el = document.getElementById('contract-content');
  try {
    const res = await fetch('/api/admin/document');
    const data = await res.json();
    el.innerHTML = marked.parse(data.content);
  } catch (e) {
    el.textContent = '문서를 불러올 수 없습니다.';
  }
}

function showDashboard(data) {
  adminUnlocked = true;
  adminDenied.classList.add('hidden');
  adminGate.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
  const navAdmin = document.getElementById('nav-admin');
  if (navAdmin) navAdmin.textContent = '🔓 우리의 나쁜 업적';
  loadContract();
  dashboardRole.textContent = data.role;

  dashboardStats.replaceChildren();
  data.dashboard.stats.forEach(stat => {
    const statItem = document.createElement('div');
    statItem.className = 'dashboard-stat';

    const label = document.createElement('span');
    label.textContent = stat.label;

    const value = document.createElement('strong');
    value.textContent = stat.value;

    statItem.append(label, value);
    dashboardStats.append(statItem);
  });

  dashboardLogs.replaceChildren();
  data.dashboard.logs.forEach(log => {
    const item = document.createElement('li');
    item.textContent = log;
    dashboardLogs.append(item);
  });
}

async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/admin/verify');
    const data = await res.json();

    if (!res.ok || !data.authorized) {
      showAccessDenied(data.role);
      return;
    }

    showAdminGate(data);
  } catch (e) {
    showAccessDenied('unknown');
  }
}

adminAccessForm.addEventListener('submit', async () => {
  const accessPassword = adminAccessPassword.value;

  if (!pendingAdminDashboard) {
    renderAdminAccessMessage('관리자 세션을 먼저 확인해야 합니다.', false);
    return;
  }

  try {
    const res = await fetch('/api/admin/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: accessPassword }),
    });
    const data = await res.json();

    if (data.success) {
      renderAdminAccessMessage(data.message, true);
      showDashboard(pendingAdminDashboard);
    } else {
      renderAdminAccessMessage(data.message, false);
    }
  } catch (e) {
    renderAdminAccessMessage('서버에 연결할 수 없습니다.', false);
  }
});
