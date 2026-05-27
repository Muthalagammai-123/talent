# TalentStage API

Node.js + Express + Prisma + SQLite backend for the TalentStage marketplace.

## Setup

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

API runs at **http://localhost:3001**

## Demo accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| `client@demo.com` | `demo123` | Client |
| `freelancer@demo.com` | `demo123` | Freelancer |

## Frontend

Start the frontend (`cd frontend && npm run dev`). Vite proxies `/api` → `http://localhost:3001`.

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/role` | Set role (`freelancer` \| `client`) |
| GET/PUT | `/api/portfolio` | Freelancer portfolio |
| GET | `/api/projects/browse` | Browse open jobs |
| GET/POST | `/api/projects/mine` | Client's jobs |
| PATCH | `/api/projects/:id` | Update job |
| GET/POST | `/api/proposals` | Proposals |
| PATCH | `/api/proposals/:id/status` | Hire / reject |
| POST | `/api/proposals/score` | Score proposal |
| GET | `/api/client/dashboard` | Full client hiring state |
| POST | `/api/client/invite` | Invite freelancer |
| POST | `/api/client/milestones/:id/release` | Release payment |
| GET/POST | `/api/messages/threads` | Messaging |
| GET/PUT | `/api/payments` | Payments |
| GET/POST | `/api/community` | Community feed |

Auth: `Authorization: Bearer <token>`

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```
