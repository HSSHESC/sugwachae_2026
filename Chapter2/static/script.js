// === Section Navigation ===
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

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
    showSection(link.dataset.section);
  });
});

window.addEventListener('popstate', () => {
  showSection(window.location.hash.slice(1) || 'home', false);
});

window.addEventListener('hashchange', () => {
  showSection(window.location.hash.slice(1) || 'home', false);
});

window.addEventListener('DOMContentLoaded', () => {
  showSection(window.location.hash.slice(1) || 'home', false);
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
const adminDenied   = document.getElementById('admin-denied');
const adminGate     = document.getElementById('admin-gate');
const adminLogin    = document.getElementById('admin-login');
const adminFinal    = document.getElementById('admin-final');
const adminDashboard = document.getElementById('admin-dashboard');
const adminRole     = document.getElementById('admin-role');

const adminAccessForm     = document.getElementById('admin-access-form');
const adminAccessPassword = document.getElementById('admin-access-password');
const adminAccessMessage  = document.getElementById('admin-access-message');

const adminLoginForm     = document.getElementById('admin-login-form');
const adminLoginUsername = document.getElementById('admin-login-username');
const adminLoginPassword = document.getElementById('admin-login-password');
const adminLoginMessage  = document.getElementById('admin-login-message');

const finalCheckBtn     = document.getElementById('final-check-btn');
const adminFinalMessage = document.getElementById('admin-final-message');

const dashboardRole  = document.getElementById('dashboard-role');
const dashboardStats = document.getElementById('dashboard-stats');
const dashboardLogs  = document.getElementById('dashboard-logs');

let pendingDashboardData = null;

function hideAll() {
  adminDenied.classList.add('hidden');
  adminGate.classList.add('hidden');
  adminLogin.classList.add('hidden');
  adminFinal.classList.add('hidden');
  adminDashboard.classList.add('hidden');
}

function showAccessDenied(role = 'guest') {
  hideAll();
  adminDenied.classList.remove('hidden');
  adminRole.textContent = role;
  adminRole.className = role === 'admin' ? 'badge badge-success' : 'badge badge-default';
}

function showAdminGate() {
  hideAll();
  adminGate.classList.remove('hidden');
  adminAccessPassword.value = '';
  adminAccessMessage.classList.add('hidden');
  adminAccessPassword.focus();
}

function showAdminLogin() {
  hideAll();
  adminLogin.classList.remove('hidden');
  adminLoginUsername.value = '';
  adminLoginPassword.value = '';
  adminLoginMessage.classList.add('hidden');
  adminLoginUsername.focus();
}

function renderMessage(el, message, query, success) {
  el.classList.remove('hidden');
  el.style.background    = success ? '#dcfce7' : '#fee2e2';
  el.style.borderColor   = success ? '#86efac' : '#fca5a5';
  el.style.color         = success ? '#166534' : '#991b1b';
  el.replaceChildren();

  const text = document.createElement('span');
  text.textContent = message;
  el.append(text);

  if (query) {
    const br   = document.createElement('br');
    const code = document.createElement('code');
    code.className   = 'query-preview';
    code.textContent = query;
    el.append(br, code);
  }
}

function showDashboard(data) {
  hideAll();
  adminDashboard.classList.remove('hidden');
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

// 페이지 진입: admin 세션 있으면 대시보드, 없으면 Step 1 gate 표시
async function loadAdminDashboard() {
  try {
    const res  = await fetch('/api/admin/verify');
    const data = await res.json();
    if (data.authorized) {
      showDashboard(data);
    } else {
      showAdminGate();
    }
  } catch (e) {
    showAdminGate();
  }
}

// Step 1: 소스 코드에서 하드코딩된 비밀번호를 찾아 입력
adminAccessForm.addEventListener('submit', () => {
  const pw = adminAccessPassword.value;

  if (pw === 'ESCADMIN') {
    renderMessage(adminAccessMessage, '접근 비밀번호가 확인되었습니다.', '', true);
    setTimeout(showAdminLogin, 600);
    return;
  }

  renderMessage(adminAccessMessage, '접근 비밀번호가 올바르지 않습니다.', '', false);
});

// Step 2: SQL Injection으로 관리자 로그인
adminLoginForm.addEventListener('submit', async () => {
  const username = adminLoginUsername.value;
  const password = adminLoginPassword.value;

  adminLoginMessage.classList.remove('hidden');
  adminLoginMessage.style.background  = '#eff6ff';
  adminLoginMessage.style.borderColor = '#bfdbfe';
  adminLoginMessage.style.color       = '#1d4ed8';
  adminLoginMessage.textContent       = '처리 중...';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    renderMessage(adminLoginMessage, data.message, data.query, data.success);

    if (data.success && data.user?.role === 'admin') {
      const adminRes  = await fetch('/api/admin/verify');
      const adminData = await adminRes.json();
      if (adminData.authorized) {
        pendingDashboardData = adminData;
        setTimeout(showAdminFinal, 800);
      }
    }
  } catch (e) {
    renderMessage(adminLoginMessage, '서버에 연결할 수 없습니다.', '', false);
  }
});

// Step 3: localStorage 조작으로 대시보드 해금
function showAdminFinal() {
  hideAll();
  adminFinal.classList.remove('hidden');
  adminFinalMessage.classList.add('hidden');
}

finalCheckBtn.addEventListener('click', () => {
  if (localStorage.getItem('esc_admin') === 'true') {
    renderMessage(adminFinalMessage, '인증 완료! 대시보드에 접근합니다.', '', true);
    setTimeout(() => showDashboard(pendingDashboardData), 800);
    return;
  }
  renderMessage(adminFinalMessage, 'Local Storage에 올바른 값이 설정되지 않았습니다.', '', false);
});
