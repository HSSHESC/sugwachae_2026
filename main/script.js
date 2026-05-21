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

  if (section === 'insider') {
    document.getElementById('insider-secret-value').textContent = 6696000 * 3 + 2610;
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
      setTimeout(() => showSection('insider'), 600);
    }
  } catch (e) {
    renderLoginMessage('서버에 연결할 수 없습니다.', '', false);
  }
});

// 테마 토글 (night ↔ light). 극비 nav는 항상 corp-dark 색이라 light에서만 드러남.
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('theme-light');
  themeToggle.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}" width="14" height="14"></i>`;
  if (window.lucide) window.lucide.createIcons();
});

// === Admin Section ===
const adminSection = document.getElementById('admin');
const adminGate1 = document.getElementById('admin-gate-1');
const adminGate = document.getElementById('admin-gate');
const adminFinal = document.getElementById('admin-final');
const adminDashboard = document.getElementById('admin-dashboard');

function setAdminBg(n) {
  adminSection.classList.remove('bg-1', 'bg-2', 'bg-3');
  if (n) adminSection.classList.add(`bg-${n}`);
}

const adminGate1Form = document.getElementById('admin-gate1-form');
const adminGate1Password = document.getElementById('admin-gate1-password');
const adminGate1Message = document.getElementById('admin-gate1-message');

const adminAccessForm = document.getElementById('admin-access-form');
const adminAccessPassword = document.getElementById('admin-access-password');
const adminAccessMessage = document.getElementById('admin-access-message');

const dashboardRole = document.getElementById('dashboard-role');
const dashboardStats = document.getElementById('dashboard-stats');
const dashboardLogs = document.getElementById('dashboard-logs');

const finalCheckBtn = document.getElementById('final-check-btn');
const adminFinalMessage = document.getElementById('admin-final-message');

// naven_admin 기본값: 변수는 존재하되 False — 학생이 직접 True로 바꿔야 통과
if (sessionStorage.getItem('naven_admin') === null) {
  sessionStorage.setItem('naven_admin', 'False');
}

function hideAll() {
  adminGate1.classList.add('hidden');
  adminGate.classList.add('hidden');
  adminFinal.classList.add('hidden');
  adminDashboard.classList.add('hidden');
}

function showAdminGate1() {
  hideAll();
  setAdminBg(1);
  adminGate1.classList.remove('hidden');
  adminGate1Password.value = '';
  adminGate1Message.classList.add('hidden');
  adminGate1Password.focus();
}

function showAdminGate() {
  hideAll();
  setAdminBg(2);
  adminGate.classList.remove('hidden');
  adminAccessPassword.value = '';
  adminAccessMessage.classList.add('hidden');
  adminAccessPassword.focus();
}

function showAdminFinal() {
  hideAll();
  setAdminBg(3);
  adminFinal.classList.remove('hidden');
  adminFinalMessage.classList.add('hidden');
}

function renderInlineMessage(el, message, success) {
  el.classList.remove('hidden');
  el.style.background = success ? '#dcfce7' : '#fee2e2';
  el.style.borderColor = success ? '#86efac' : '#fca5a5';
  el.style.color = success ? '#166534' : '#991b1b';
  el.textContent = message;
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
  hideAll();
  setAdminBg(null);
  adminDashboard.classList.remove('hidden');
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

function loadAdminDashboard() {
  showAdminGate1();
}

// 1차/2차 비밀번호는 평문 대신 SHA-256 해시로만 비교 (소스에 평문 노출 방지)
const GATE1_HASH = 'e0dac7ffd00b6de31f85889e5b6d139361e8f8cedb8694b884528bf0c77e6fa0';
const GATE2_HASH = '2a8107e1b0abc3866a3f27c1e5992c3310da501db4be6f51086a94b57066e7ec';

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Step 1: 1차 비밀번호 (admin SQLi 로그인 응답 메시지에서 노출됨)
adminGate1Form.addEventListener('submit', async () => {
  if (await sha256Hex(adminGate1Password.value) === GATE1_HASH) {
    renderInlineMessage(adminGate1Message, '1차 인증 완료.', true);
    setTimeout(showAdminGate, 600);
    return;
  }
  renderInlineMessage(adminGate1Message, '1차 비밀번호가 올바르지 않습니다.', false);
});

// Step 2: 2차 비밀번호 (소스 코드 주석에서 노출됨)
adminAccessForm.addEventListener('submit', async () => {
  if (await sha256Hex(adminAccessPassword.value) === GATE2_HASH) {
    renderInlineMessage(adminAccessMessage, '2차 인증 완료.', true);
    setTimeout(showAdminFinal, 600);
    return;
  }
  renderInlineMessage(adminAccessMessage, '2차 비밀번호가 올바르지 않습니다.', false);
});

// Step 3: sessionStorage 변수 + admin 세션 확인
finalCheckBtn.addEventListener('click', async () => {
  if (sessionStorage.getItem('naven_admin') !== 'True') {
    renderInlineMessage(adminFinalMessage, 'sessionStorage에 naven_admin 변수가 없거나 False입니다.', false);
    return;
  }
  try {
    const res = await fetch('/api/admin/verify');
    const data = await res.json();
    if (!data.authorized) {
      renderInlineMessage(adminFinalMessage, '관리자 세션이 없습니다. 메인 로그인에서 admin으로 다시 로그인하세요.', false);
      return;
    }
    sessionStorage.removeItem('naven_admin');
    showDashboard(data);
  } catch (e) {
    renderInlineMessage(adminFinalMessage, '서버에 연결할 수 없습니다.', false);
  }
});
