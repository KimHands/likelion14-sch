<div align="center">
  <img src="frontend/src/assets/likelion_sch_logo.png" width="100" alt="LIKELION SCH Logo" />

  # LIKELION SCH — 멋쟁이사자처럼 순천향대

  순천향대학교 멋쟁이사자처럼 동아리 **모집 · 심사 · 운영 플랫폼**

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
  [![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose)

</div>

---

## 목차

- [스크린샷](#스크린샷)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [로컬 개발](#로컬-개발)
- [Docker 배포](#docker-배포)
- [역할별 접근 권한](#역할별-접근-권한)

---

## 스크린샷

### 메인 페이지

<div align="center">
  <img src="FIgma/5%EC%B0%A8_%EB%A9%94%EC%9D%B8%20%ED%8E%98%EC%9D%B4%EC%A7%80.png" width="90%" alt="메인 페이지" />
</div>

<br />

### 지원 시스템

| 회원가입 | 로그인 | 가입 완료 |
|:---:|:---:|:---:|
| ![회원가입](FIgma/1%EC%B0%A8_%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85.png) | ![로그인](FIgma/3%EC%B0%A8_%EB%A1%9C%EA%B7%B8%EC%9D%B8.png) | ![가입 완료](FIgma/3%EC%B0%A8_%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85%20%EC%99%84%EB%A3%8C%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) |

| 지원서 작성 | 합격 결과 확인 |
|:---:|:---:|
| ![지원서 작성](FIgma/1%EC%B0%A8_%EC%98%88%EB%B9%84%20%EC%88%98%EA%B0%95%EC%83%9D%20%EC%A7%80%EC%9B%90%EC%84%9C%20%EC%9E%91%EC%84%B1%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) | ![합불 결과](FIgma/%EC%A7%80%EC%9B%90%20%ED%95%A9%EB%B6%88%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) |

### 관리자 (운영진)

| 지원자 목록 | 서류 채점 | 면접 채점 |
|:---:|:---:|:---:|
| ![지원자 리스트](FIgma/2%EC%B0%A8_%EC%A7%80%EC%9B%90%EC%9E%90%20%EB%A6%AC%EC%8A%A4%ED%8A%B8%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) | ![서류 채점](FIgma/2%EC%B0%A8_%EC%84%9C%EB%A5%98%20%EC%B1%84%EC%A0%90%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) | ![면접 채점](FIgma/2%EC%B0%A8_%EB%A9%B4%EC%A0%91%20%EC%B1%84%EC%A0%90%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) |

### 교육 세션 & 커리큘럼

| AI 세션 | 풀스택 세션 | 기획 세션 |
|:---:|:---:|:---:|
| ![AI 세션](FIgma/%EA%B5%90%EC%9C%A1%20%EC%84%B8%EC%85%98_AI.png) | ![풀스택 세션](FIgma/%EA%B5%90%EC%9C%A1%20%EC%84%B8%EC%85%98_%ED%92%80%EC%8A%A4%ED%83%9D.png) | ![기획 세션](FIgma/%EA%B5%90%EC%9C%A1%20%EC%84%B8%EC%85%98_%EA%B8%B0%ED%9A%8D.png) |

| 운영진 소개 | 커리큘럼 상세 (AI) |
|:---:|:---:|
| ![운영진 소개](FIgma/4%EC%B0%A8_%EA%B5%90%EC%9C%A1%EC%9E%90%20%EC%86%8C%EA%B0%9C%20%ED%8E%98%EC%9D%B4%EC%A7%80.png) | ![커리큘럼 AI](FIgma/6%EC%B0%A8_%EC%BB%A4%EB%A6%AC%ED%81%98%EB%9F%BC%20%EC%83%81%EC%84%B8%20%ED%8E%98%EC%9D%B4%EC%A7%80_AI.png) |

---

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

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 19, TypeScript 5, Vite 5, React Router 7 |
| **Backend** | Django 4.2, Django REST Framework |
| **Database** | SQLite |
| **Deployment** | Docker, Nginx, Gunicorn |

---

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
├── FIgma/                   # 디자인 목업 (Figma 시안)
├── docker-compose.yml
└── DEPLOY.md                # 배포 가이드
```

---

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

---

## Docker 배포

```bash
cp .env.example .env         # .env 파일 편집
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

---

## 역할별 접근 권한

| 역할 | 접근 가능 페이지 |
|------|-----------------|
| 비로그인 | 홈, 로그인, 회원가입, 운영진, 트랙 소개 |
| **APPLICANT** (지원자) | 지원서 작성, 결과 확인 |
| **STUDENT** (아기사자) | 세션 페이지 |
| **INSTRUCTOR** (운영진) | 관리자 대시보드, 지원자 심사, 세션/프로젝트 관리 |