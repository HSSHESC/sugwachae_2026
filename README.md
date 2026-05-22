# 2026학년도 수학과학체험전

한성과학고등학교와 서대문구청이 함께 주관하는 2026학년도 중학생 대상 수학과학체험전을 위한 프로젝트입니다. 가상의 기업 **내븐 Corporation**을 배경으로 웹 보안 취약점이 어떻게 발생하고 어떤 정보가 노출될 수 있는지 체험할 수 있도록 구성되어 있습니다.

> 이 프로젝트에는 교육 목적의 의도적인 취약점이 포함되어 있습니다. 외부에 공개된 서버나 실제 서비스 환경에 배포하지 마세요.

## 실습 구성

| 구분      | 경로    |   포트 | 내용                                                                  |
| --------- | ------- | -----: | --------------------------------------------------------------------- |
| 메인 실습 | `main/` | `5000` | SQL Injection을 이용해 관리자 권한과 기밀 문서에 접근하는 웹 실습     |
| 후속 실습 | `plus/` | `5001` | Heartbleed(CVE-2014-0160) 동작을 단순화해 메모리 누출을 관찰하는 실습 |

## 실행 환경

- Python 3.x
- pip
- 웹 브라우저

## 빠른 시작

### 1. 메인 실습 실행

```powershell
cd main
pip install -r requirements.txt
python app.py
```

브라우저에서 `http://localhost:5000`으로 접속합니다.

메인 실습은 실행 시 SQLite 데이터베이스를 초기화하고, 로그인 API에서 의도적으로 취약한 SQL 쿼리를 사용합니다.

### 2. 후속 실습 실행

새 터미널을 열고 실행합니다.

```powershell
cd plus
pip install -r requirements.txt
python app.py
```

브라우저에서 `http://localhost:5001`으로 접속합니다.

후속 실습은 첫 실행 시 `plus/data/개인정보.xlsx` 파일을 자동 생성합니다.

## 프로젝트 구조

```text
.
├── main/
│   ├── app.py              # SQL Injection 실습용 Flask 서버
│   ├── index.html          # 메인 실습 UI
│   ├── script.js           # 로그인, 관리자 인증, 문서 조회 로직
│   ├── style.css
│   └── requirements.txt
├── plus/
│   ├── app.py              # Heartbleed 시뮬레이션 Flask 서버
│   ├── index.html          # Heartbeat 진단 UI
│   ├── script.js           # 패킷 미리보기, hex dump, 다운로드 로직
│   ├── style.css
│   ├── requirements.txt
│   ├── README.md           # 후속 실습 상세 설명
│   ├── data/
│   │   └── 개인정보.xlsx
│   └── images/
│       └── NAVEN.png
├── images/                 # 메인 실습 이미지와 기밀 문서 리소스
├── 계약서.md
├── 활동지_뉴스기사.md
├── 학습지.pdf
├── style.css
└── README.md
```

## 학습 흐름

### 메인 실습: SQL Injection

1. 내븐 기업 포털에 접속합니다.
2. 로그인 요청이 어떤 SQL 쿼리로 처리되는지 확인합니다.
3. 입력값이 검증 없이 쿼리에 삽입될 때 인증 우회가 가능하다는 점을 관찰합니다.
4. 관리자 권한 확인 과정을 거쳐 기밀 문서와 다운로드 기능에 접근합니다.

### 후속 실습: Heartbleed 시뮬레이션

1. 정상 Heartbeat 요청으로 payload와 응답 길이가 같을 때의 동작을 확인합니다.
2. payload보다 큰 응답 길이를 요청해 서버 메모리 일부가 응답에 포함되는 현상을 관찰합니다.
3. hex dump에서 파일 시그니처와 단서를 찾아 누출된 데이터를 해석합니다.
4. 조건을 만족하면 실습용 xlsx 파일을 다운로드합니다.

## 주요 API

### `main/app.py`

- `POST /api/login`: 로그인 요청 처리. SQL Injection 취약점이 의도적으로 포함되어 있습니다.
- `GET /api/me`: 현재 세션 사용자 조회
- `GET /api/admin/verify`: 관리자 권한 확인
- `GET /api/admin/document`: 관리자 전용 문서 내용 조회
- `GET /api/admin/document/download`: 관리자 전용 문서 이미지 다운로드

### `plus/app.py`

- `POST /api/heartbeat`: payload와 length를 받아 Heartbeat 응답을 생성합니다.
- `GET /api/leaked-file`: 조건 충족 시 실습용 xlsx 파일 다운로드

## 주의사항

- 본 프로젝트의 취약점은 교육용으로 의도된 것입니다.
- `debug=True`로 실행되므로 공개 네트워크에서 실행하지 마세요.
- `main/lab.db`는 서버 실행 위치 기준으로 생성 또는 초기화될 수 있습니다.
- `plus/data/개인정보.xlsx`는 실습용 가짜 데이터입니다.
- CDN을 통해 Pretendard 폰트, Lucide 아이콘, marked 라이브러리를 불러옵니다. 오프라인 환경에서는 일부 UI 리소스가 표시되지 않을 수 있습니다.
