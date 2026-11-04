# 배포 가이드

Docker Compose로 운영 환경을 구성하는 방법입니다. 서비스는 2026년 7월에 운영을 종료했으며, 이 문서는 다시 배포할 때를 위해 남겨 둡니다.

## 아키텍처

```
[클라이언트] → [Nginx Proxy Manager :80, :443] → [frontend Nginx :80] → React SPA
                                                                      → /static/, /media/ (파일 직접 제공)
                                                                      → /api/, /django-admin/ → [backend Gunicorn :8000] → Django
```

| 서비스 | 역할 |
|--------|------|
| `npm` | Nginx Proxy Manager. 외부 80·443 포트를 받아 HTTPS를 처리합니다. 관리 화면(81)은 서버 안에서만 열립니다 |
| `frontend` | React 빌드 결과와 정적·미디어 파일을 제공하고 API 요청을 backend로 넘깁니다 |
| `backend` | Gunicorn + Django. API를 처리합니다 |

## 사전 준비

서버에 Docker와 Docker Compose를 설치하고 저장소를 내려받습니다.

```bash
git clone https://github.com/KimHands/likelion14-sch.git
cd likelion14-sch
```

## 배포 절차

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env`에서 아래 값을 바꿉니다.

```env
SECRET_KEY=생성한-랜덤-문자열
DEBUG=False
ALLOWED_HOSTS=your-domain.com

CSRF_TRUSTED_ORIGINS=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

# 인증 메일 발송에 필요합니다 (Gmail SMTP)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=gmail-앱-비밀번호
```

`SECRET_KEY`는 아래 명령으로 만듭니다. 기본값으로 두면 backend가 시작되지 않습니다.

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 2. 빌드 및 실행

```bash
docker compose up -d --build
```

### 3. DB 초기화 (최초 1회)

```bash
docker compose exec backend python manage.py migrate
```

운영진 화면에 들어가려면 `INSTRUCTOR` 역할과 메일 인증이 필요합니다. `createsuperuser`만으로는 역할이 `APPLICANT`로 남으므로 아래 명령으로 계정을 만듭니다.

```bash
docker compose exec backend python manage.py shell -c "from users.models import User; User.objects.create_superuser('admin@sch.ac.kr', '비밀번호', name='관리자', role='INSTRUCTOR', email_verified=True)"
```

### 4. 프록시와 HTTPS 설정

관리 화면은 서버 안에서만 열리므로 SSH 터널로 접속합니다.

```bash
ssh -L 8181:127.0.0.1:81 사용자@서버주소
```

브라우저에서 `http://localhost:8181`을 열고 Proxy Host를 추가합니다.

| 항목 | 값 |
|------|-----|
| Domain Names | 서비스 도메인 |
| Scheme / Forward Hostname / Port | `http` / `frontend` / `80` |
| SSL | Let's Encrypt 인증서 발급, Force SSL 사용 |

`DEBUG=False`이면 Django가 HTTP 요청을 HTTPS로 넘깁니다. 프록시가 보내는 `X-Forwarded-Proto` 헤더로 HTTPS 여부를 판단합니다.

### 5. 동작 확인

| 확인 항목 | URL | 기대 결과 |
|-----------|-----|-----------|
| 프론트엔드 | `https://your-domain.com` | 메인 페이지 |
| API | `https://your-domain.com/api/health` | `{"ok": true}` |
| Django Admin | `https://your-domain.com/django-admin/` | 로그인 페이지 |

## 운영 명령어

```bash
docker compose ps                  # 컨테이너 상태
docker compose logs -f backend     # backend 로그
docker compose restart             # 재시작 (코드 변경 없을 때)
docker compose up -d --build       # 코드 변경 후 재배포
docker compose exec backend python manage.py migrate   # 모델 변경 후
```

`.env`를 바꾼 뒤에는 `docker compose up -d`로 컨테이너를 다시 만들어야 적용됩니다.

## 데이터 관리

| 위치 | 내용 |
|------|------|
| `db_data` 볼륨 | SQLite 데이터베이스 (`/app/db/db.sqlite3`) |
| `./data/media` | 업로드 파일 |
| `./data/static` | Django 정적 파일 |
| `./data/npm` | Nginx Proxy Manager 설정, 계정, 키, 접속 로그 |
| `./letsencrypt` | 인증서와 개인키 |

> **주의:** `data/`, `letsencrypt/`, `.env`에는 비밀 값과 접속 기록이 들어 있으므로 커밋하지 않습니다. `.gitignore`에 등록되어 있으니 강제로 추가하지 마세요.

### 백업

```bash
docker compose exec backend sh -c "python -c \"import sqlite3; sqlite3.connect('/app/db/db.sqlite3').backup(sqlite3.connect('/app/db/backup.sqlite3'))\""
docker compose cp backend:/app/db/backup.sqlite3 ./backup.sqlite3
cp -r data/media ./media_backup
```

### 삭제 주의

- `docker compose down`: 컨테이너만 지웁니다. 데이터는 남습니다.
- `docker compose down -v`: `db_data` 볼륨까지 지웁니다. **DB가 삭제됩니다.**

## 트러블슈팅

### 컨테이너가 시작되지 않을 때

```bash
docker compose ps -a
docker compose logs backend frontend
```

### 80·443 포트를 이미 쓰고 있을 때

`docker-compose.yml`의 `npm` 서비스에서 왼쪽 포트 번호를 바꿉니다.

```yaml
ports:
  - '8080:80'
  - '127.0.0.1:81:81'
  - '8443:443'
```
