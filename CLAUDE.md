# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LIKELION SCH (멋쟁이사자처럼 순천향대) recruitment and management platform. Full-stack app for club recruitment, application review, and member management.

## Development Commands

### Frontend (`frontend/`)
```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # TypeScript check + Vite production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (`backend/`)
```bash
python manage.py runserver          # Django dev server at http://127.0.0.1:8000
python manage.py migrate            # Apply migrations
python manage.py makemigrations     # Generate migrations
python manage.py createsuperuser    # Create admin user
```

Both servers must run simultaneously. The Vite dev server proxies `/api` requests to the Django backend.

## Architecture

### Frontend: React 19 + TypeScript + Vite
- **Routing**: React Router DOM 7 — routes defined in `frontend/src/App.tsx`
- **Styling**: Plain CSS files colocated with components (no CSS-in-JS)
- **State**: React hooks only (useState/useEffect), no external state library
- **API layer**: `src/api/client.ts` exports `apiFetch<T>()` — handles CSRF tokens from cookies and includes credentials on all requests
- **Auth**: `src/auth/useAuth.ts` hook calls `GET /api/auth/me`; `src/auth/RequireAuth.tsx` guards routes by role

### Backend: Django 4.2 + DRF
- **Custom user model**: `users.User` (AbstractBaseUser) with roles: APPLICANT, STUDENT, INSTRUCTOR
- **Auth**: Session-based (cookies), CSRF protection, email verification with hashed time-limited codes
- **Database**: SQLite (`backend/db.sqlite3`)
- **CORS**: Only `localhost:5173` allowed

### Key Backend Apps
- `users/` — Custom User model, auth views (login/logout/signup/email verification)
- `applications/` — Application CRUD, admin review, scoring, notification settings

### Application Workflow
1. Applicant saves draft (`DRAFT`) → submits (`SUBMITTED`)
2. Admin scores documents (doc review) → finalizes doc decision
3. Admin scores interviews → finalizes final decision (`ACCEPTED`/`REJECTED`)
4. Scoring: `ApplicationScore` model with `kind` (DOC/INTERVIEW), 3 sub-scores per review, unique per (application, reviewer, kind)

### Role-Based Access
| Role | Access |
|------|--------|
| Public | Home, Login, Signup, Members, Tracks |
| APPLICANT | Apply page, results |
| STUDENT/INSTRUCTOR | Session page |
| INSTRUCTOR | All admin pages (dashboard, applicant review, scoring) |

### API Endpoint Patterns
- Auth: `/api/auth/{login,logout,me,signup,email/send-code,email/verify}`
- Applications: `/api/applications/{my,draft,submit,results/my}`
- Admin: `/api/applications/admin/{list,<id>,<id>/scores,<id>/doc-finalize,<id>/finalize,notification-settings}`

## Conventions

- Korean language used extensively in comments and UI text
- Frontend: PascalCase components, camelCase variables, colocated `.css` files
- Backend: snake_case, Django app structure (models/views/urls/serializers)
- TypeScript strict mode enabled with noUnusedLocals/noUnusedParameters
- Singleton pattern for `ResultNotificationSettings` (always pk=1)
- Email verification required before signup is allowed (10-min window after verification)