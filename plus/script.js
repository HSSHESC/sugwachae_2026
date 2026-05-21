// === Heartbleed 실습 — 클라이언트 로직 ===

const $ = id => document.getElementById(id);

const payloadInput = $('payload');
const lengthInput  = $('length');
const sendBtn      = $('send-btn');
const packetPreview= $('packet-preview');
const hexDump      = $('hex-dump');
const respActions  = $('resp-actions');
const downloadBtn  = $('download-btn');

let lastResponseHex = '';
let lastHook = false;

// -------- 패킷 미리보기 --------
function bytesToSpacedHex(arr) {
  return [...arr].map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function updatePacketPreview() {
  const payload = payloadInput.value;
  const length  = parseInt(lengthInput.value, 10) || 0;
  const payloadBytes = new TextEncoder().encode(payload);

  const typeHex = '01';
  const lenHex  = length.toString(16).padStart(4, '0').toUpperCase().match(/.{2}/g).join(' ');
  const dataHex = bytesToSpacedHex(payloadBytes) || '∅';

  packetPreview.innerHTML = `
    <span class="pk-type">${typeHex}</span>
    <span class="pk-len">${lenHex}</span>
    <span class="pk-data">${dataHex}</span>
  `;
}
payloadInput.addEventListener('input', updatePacketPreview);
lengthInput.addEventListener('input', updatePacketPreview);
updatePacketPreview();

// -------- hex dump 렌더링 (16 bytes/line) --------
function renderHexDump(hex) {
  if (!hex) return '응답 없음';
  const bytes = hex.match(/.{2}/g) || [];
  const lines = [];
  const MAX_LINES = 256;
  for (let i = 0; i < bytes.length; i += 16) {
    if (lines.length >= MAX_LINES) {
      lines.push(`... (총 ${bytes.length} B 중 ${MAX_LINES * 16} B 만 표시)`);
      break;
    }
    const chunk = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(6, '0');
    const hexPart = chunk.join(' ').padEnd(48, ' ');
    const asciiPart = chunk.map(b => {
      const c = parseInt(b, 16);
      return (c >= 0x20 && c < 0x7f) ? String.fromCharCode(c) : '.';
    }).join('');
    lines.push(`${offset}  ${hexPart}  ${asciiPart}`);
  }
  return lines.join('\n');
}

// -------- 송신 --------
sendBtn.addEventListener('click', async () => {
  const payload = payloadInput.value;
  const length  = parseInt(lengthInput.value, 10);

  if (isNaN(length) || length < 0) {
    hexDump.textContent = '응답 길이가 올바르지 않습니다.';
    return;
  }

  hexDump.textContent = '전송 중...';
  respActions.classList.add('hidden');

  try {
    const res = await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, length }),
    });
    const data = await res.json();

    if (data.error) {
      hexDump.textContent = `에러: ${data.error}`;
      return;
    }

    lastResponseHex = data.response_hex;
    lastHook = data.hook;

    hexDump.textContent = renderHexDump(data.response_hex);

    if (data.response_size > 0) {
      respActions.classList.remove('hidden');
    }
  } catch (e) {
    hexDump.textContent = '서버 연결 실패.';
  }
});

// -------- 다운로드 분기 --------
downloadBtn.addEventListener('click', () => {
  if (lastHook) {
    // hook: 서버가 실제 xlsx 를 그대로 내려줌
    window.location.href = '/api/leaked-file';
    return;
  }
  // 부분 누출: 클라이언트가 받은 hex 를 그대로 Blob 으로 다운로드
  const bytes = new Uint8Array((lastResponseHex.match(/.{2}/g) || []).map(b => parseInt(b, 16)));
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leak.bin';
  a.click();
  URL.revokeObjectURL(url);
});
