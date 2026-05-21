# plus — Heartbleed 실습 (내븐 DB 누출)

수과체 본 프로젝트의 후속 실습. 학생이 **CVE-2014-0160 (Heartbleed)** 의 핵심
동작을 손으로 직접 재현한다.

## 시나리오

내븐 사내망에서 고객 DB 진단용 OpenSSL 1.0.1f Heartbeat 포트가 노출돼 있다.
정상 사용법은 "payload 를 보내고 같은 길이로 받기"지만, **응답 길이를 더 크게
요청하면 서버 메모리가 그만큼 함께 누출**된다. 보안팀(해고됨) 인수인계가 안 되어
패치는 무기한 연기된 상태.

## 실행

```powershell
cd plus
pip install -r requirements.txt
python app.py
```

브라우저에서 <http://localhost:5001> 접속.
첫 실행 시 `data/개인정보.xlsx` 가 자동 생성된다.

## 학습 흐름

1. `payload = "hi"`, `응답 길이 = 2` → 정상 에코, 누출 0 B.
2. `응답 길이 = 200` → 가짜 힙(`NAVEN_HEAP_SEG...`, `session_admin=...`) 노출.
3. `응답 길이 = 500` → hex dump 에 **`50 4B 03 04`** (ZIP/xlsx 매직) 등장.
   학생이 "이거 엑셀 파일이다" 알아챔.
4. `응답 길이 = 65535` → 전체 누출.
   서버가 **hook** 발동 → `개인정보.xlsx` 원본을 그대로 내려줌.

## 동작 원리 (간단히)

서버는 다음과 같은 메모리 버퍼를 갖고 있다.

```
[ 가짜 힙(200 B) ][ 개인정보.xlsx 바이트 ][ 가짜 로그(1024 B) ]
```

`/api/heartbeat` 는 `length > len(payload)` 일 때 모자란 만큼을 이 버퍼의
앞에서부터 잘라 붙여서 돌려준다. `leak_size` 가 `HOOK_THRESHOLD`
(`가짜 힙 + xlsx 크기`) 이상이면 학생은 누출된 바이트만으로도 xlsx 를 복원할
수 있다는 의미이므로, 서버가 원본 xlsx 를 직접 내려주는 hook 으로 분기한다.

| `leak_size` | 다운로드 결과 |
|---|---|
| `0` | (다운로드 버튼 비활성) |
| `> 0` 그리고 `< HOOK_THRESHOLD` | `leak.bin` (누출된 메모리 그대로) |
| `>= HOOK_THRESHOLD` | `개인정보.xlsx` 원본 (hook) |

## 파일 구조

```
plus/
├── app.py             # Flask 서버 + 메모리 시뮬레이션 + 첫 실행 시 xlsx 생성
├── index.html         # 내븐 진단 시스템 UI
├── style.css
├── script.js          # 폼 / 패킷 미리보기 / hex dump / 다운로드 분기
├── requirements.txt   # flask, openpyxl
├── images/
│   └── NAVEN.png
└── data/
    └── 개인정보.xlsx  # 첫 실행 시 자동 생성
```
