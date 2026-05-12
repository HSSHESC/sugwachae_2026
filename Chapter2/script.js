// === Section Navigation ===
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Show target section
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// === Login ===
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password  = document.getElementById('password').value;
  const msg = document.getElementById('login-message');

  msg.classList.remove('hidden');
  msg.style.background = '#eff6ff';
  msg.style.borderColor = '#bfdbfe';
  msg.style.color = '#1d4ed8';
  msg.textContent = '처리 중...';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      msg.style.background = '#dcfce7';
      msg.style.borderColor = '#86efac';
      msg.style.color = '#166534';
    } else {
      msg.style.background = '#fee2e2';
      msg.style.borderColor = '#fca5a5';
      msg.style.color = '#991b1b';
    }

    // 실행된 SQL 쿼리도 함께 표시
    msg.innerHTML = `${data.message}<br><code style="font-size:0.8em;opacity:0.8">${data.query}</code>`;
  } catch (e) {
    msg.style.background = '#fee2e2';
    msg.style.borderColor = '#fca5a5';
    msg.style.color = '#991b1b';
    msg.textContent = '서버에 연결할 수 없습니다.';
  }
});
