# 배포 가이드

Docker를 사용한 프로덕션 배포 가이드입니다.

## 아키텍처

```
[클라이언트] → [Nginx (port 80)] → React SPA (정적 파일)
                                  → /api/    → [Gunicorn (port 8000)] → Django
                                  → /media/  → [Gunicorn (port 8000)] → Django
                                  → /admin/  → [Gunicorn (port 8000)] → Django
```

- **frontend 컨테이너**: Nginx가 React 빌드 결과물을 서빙하고, `/api/`, `/media/`, `/admin/` 요청을 backend로 프록시
- **backend 컨테이너**: Gunicorn + Django가 API 요청 처리
- **데이터**: SQLite DB와 업로드 파일은 Docker volume으로 영속 저장

## 사전 준비

1. **Docker 설치**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) 또는 서버용 Docker Engine 설치
   - 설치 확인:
     ```bash
     docker --version
     docker compose version
     ```

2. **소스 코드 클론**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

## 배포 절차

### 1단계: 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어서 아래 값들을 설정합니다:

```env
# [필수] Django 비밀 키 — 아래 명령어로 생성
SECRET_KEY=생성한-랜덤-문자열

# [필수] 프로덕션에서는 반드시 False
DEBUG=False

# [필수] 접속 허용 도메인/IP (쉼표 구분)
ALLOWED_HOSTS=your-domain.com,서버IP

# [필수] 프론트엔드 접속 URL (쉼표 구분)
CSRF_TRUSTED_ORIGINS=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

# [선택] 이메일 발송 기능 사용 시 (Gmail SMTP)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=gmail-앱-비밀번호
```

**SECRET_KEY 생성:**
```bash
# 방법 1: Python
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# 방법 2: OpenSSL
openssl rand -base64 50
```

### 2단계: 빌드 및 실행

```bash
# 이미지 빌드 + 컨테이너 시작 (백그라운드)
docker compose up -d --build
```

### 3단계: DB 초기화 (최초 1회)

```bash
# 데이터베이스 테이블 생성
docker compose exec backend python manage.py migrate

# Django 관리자 계정 생성
docker compose exec backend python manage.py createsuperuser
```

### 4단계: 동작 확인

| 확인 항목 | URL | 기대 결과 |
|-----------|-----|-----------|
| 프론트엔드 | `http://서버IP` | React 홈페이지 로드 |
| API 헬스체크 | `http://서버IP/api/health` | `{"ok": true}` |
| Django Admin | `http://서버IP/admin/` | 로그인 페이지 |

## 운영 명령어

```bash
# 전체 로그 확인 (실시간)
docker compose logs -f

# 백엔드 로그만 확인
docker compose logs -f backend

# 컨테이너 상태 확인
docker compose ps

# 컨테이너 중지
docker compose down

# 컨테이너 재시작 (코드 변경 없을 때)
docker compose restart

# 코드 변경 후 재배포
docker compose up -d --build

# Django 쉘 접속
docker compose exec backend python manage.py shell

# DB 마이그레이션 (모델 변경 후)
docker compose exec backend python manage.py migrate
```

## 업데이트 (재배포)

코드가 업데이트되었을 때:

```bash
git pull origin main
docker compose up -d --build
docker compose exec backend python manage.py migrate   # 모델 변경이 있을 경우
```

## 포트 변경

80번 포트가 이미 사용 중이면 `docker-compose.yml`에서 변경:

```yaml
# 예: 8080 포트로 변경
ports:
  - "8080:80"
```

## 데이터 관리

### 볼륨 구조
| 볼륨 | 용도 | 경로 (컨테이너 내부) |
|------|------|---------------------|
| `db_data` | SQLite 데이터베이스 | `/app/db/db.sqlite3` |
| `media_data` | 업로드 파일 (이미지, PDF 등) | `/app/media/` |

### 데이터 백업
```bash
# DB 백업
docker compose exec backend cp /app/db/db.sqlite3 /app/db/backup.sqlite3
docker cp $(docker compose ps -q backend):/app/db/backup.sqlite3 ./backup.sqlite3

# 미디어 파일 백업
docker cp $(docker compose ps -q backend):/app/media ./media_backup
```

### 주의사항
- `docker compose down` → 컨테이너만 삭제 (데이터 유지)
- `docker compose down -v` → **볼륨도 삭제 (데이터 삭제됨!)**

## 트러블슈팅

### 컨테이너가 시작되지 않을 때
```bash
docker compose logs backend    # 에러 메시지 확인
```

### .env 파일 변경 후 적용
```bash
docker compose down && docker compose up -d
```

### DB 초기화가 필요할 때
```bash
docker compose down -v                                    # 볼륨 삭제
docker compose up -d                                      # 재시작
docker compose exec backend python manage.py migrate      # 테이블 재생성
docker compose exec backend python manage.py createsuperuser
```
