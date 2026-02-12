# LIKELION SCH - 멋쟁이사자처럼 순천향대

순천향대학교 멋쟁이사자처럼 동아리 모집 및 운영 플랫폼입니다.

## 주요 기능

### 홈페이지
- 동아리 소개 (About, 트랙 소개, 로드맵, 프로젝트 포트폴리오)
- 운영진 소개 페이지

### 지원 시스템
- 회원가입 + 이메일 인증
- 지원서 작성 (임시저장 → 제출)
- 2단계 심사: 서류 평가 → 면접 평가
- 합격/불합격 결과 확인

### 관리자 (운영진)
- 지원자 목록 조회 및 필터링
- 서류/면접 점수 입력 (3개 항목별 채점)
- 합격 여부 최종 결정
- 세션(퀴즈, 과제, Q&A, 공지) 관리
- 프로젝트 포트폴리오 관리

### 교육 세션
- 트랙별 퀴즈 (프론트엔드/백엔드)
- 트랙별 과제 (AI/기획)
- Q&A 게시판
- 공지사항

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite, React Router 7 |
| Backend | Django 4.2, Django REST Framework |
| Database | SQLite |
| Deployment | Docker, Nginx, Gunicorn |

## 프로젝트 구조

```
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── components/      # 공통 컴포넌트
│   │   ├── auth/            # 인증 (useAuth, RequireAuth)
│   │   ├── api/             # API 클라이언트 (apiFetch)
│   │   └── assets/          # 이미지, 아이콘
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                 # Django + DRF
│   ├── users/               # 사용자 모델, 인증, 이메일 인증
│   ├── applications/        # 지원서 CRUD, 채점, 결과 알림
│   ├── sessionsapp/         # 퀴즈, 과제, Q&A, 공지
│   ├── projects/            # 프로젝트 포트폴리오
│   ├── config/              # Django 설정
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
└── DEPLOY.md                # 배포 가이드
```

## 로컬 개발

### 사전 준비
- Node.js 20+
- Python 3.11+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver   # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

> 두 서버를 동시에 실행해야 합니다. Vite dev server가 `/api`, `/media` 요청을 Django로 프록시합니다.

## Docker 배포

```bash
cp .env.example .env         # .env 파일 편집
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

## 역할별 접근 권한

| 역할 | 접근 가능 페이지 |
|------|-----------------|
| 비로그인 | 홈, 로그인, 회원가입, 운영진, 트랙 소개 |
| APPLICANT (지원자) | 지원서 작성, 결과 확인 |
| STUDENT (아기사자) | 세션 페이지 |
| INSTRUCTOR (운영진) | 관리자 대시보드, 지원자 심사, 세션/프로젝트 관리 |
