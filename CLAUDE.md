# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack resume management system with a Node.js/Fastify/MongoDB backend and Vue 3/Vite/Tailwind CSS frontend. UI text is primarily in Korean. One resume per user, enforced by a unique constraint on `userId`.

## Repository Layout

- `resume-backend/` — REST API server (Fastify 5, Mongoose 8, JWT auth)
- `resume-web/` — SPA frontend (Vue 3 with `<script setup>`, Vite, Tailwind CSS 4)
- `nginx/` — Reverse proxy config for production
- `scripts/` — Deployment, SSL, backup/restore shell scripts
- `docker-compose.yml` — Orchestrates MongoDB, backend, nginx, and certbot

## Development Commands

### Backend (`resume-backend/`)

```bash
npm install                 # Install dependencies
npm run dev                 # Dev server with nodemon (port 3001)
npm start                   # Production server
npm test                    # Run all Jest tests
npm run test:watch          # Jest in watch mode
npm run test:coverage       # Coverage report (thresholds: 80% lines, 75% functions, 70% branches)
npm run seed                # Seed test data into MongoDB
npm run seed:clear          # Clear seeded data
```

### Frontend (`resume-web/`)

```bash
npm install                 # Install dependencies
npm run dev                 # Vite dev server (port 5173, proxies /api to :3001)
npm run build               # Production build
npm run test:e2e            # Playwright E2E tests against dev server
npm run test:e2e:docker     # Playwright E2E tests against Docker deployment
```

### Docker (from repo root)

```bash
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
```

### Environment Setup

Copy `.env.example` to `.env` in both the repo root and `resume-backend/`. Key variables: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PORT` (default 3001).

## Architecture

### Backend (MVC pattern)

`server.js` → `app.js` (Fastify init with plugins: CORS, JWT, Helmet) → routes → controllers → Mongoose models

- **Routes**: `auth.routes.js` (register/login), `resume.routes.js` (CRUD for resume sections)
- **Controllers**: Business logic in `auth.controller.js` and `resume.controller.js`
- **Models**: `User.js` (email, bcrypt password hash), `Resume.js` (profile, skills, experience, education, certifications as embedded sub-schemas)
- **Middleware**: `auth.middleware.js` provides `authenticate` and `optionalAuthenticate` decorators; `errorHandler.js` is the global error handler
- **Validation**: Fastify JSON Schema on route definitions (`schemas/auth.schema.js`)
- **Admin bypass**: Env-based admin credentials (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) allow login without a DB user

### Frontend (Component-based SPA)

`App.vue` is the root component managing auth state and data fetching. No router — single-page with modals.

- **API layer**: `api/client.js` exports `authApi` and `resumeApi` wrappers that inject Bearer tokens from localStorage
- **Components**: `ProfileHeader`, `SkillSection`, `ExperienceList`/`ExperienceItem`, `ExperienceFormModal`, `PersonalProjectList`, `PostDetailModal`, `LoginModal`, `Footer`
- **Fallback data**: `src/data.json` used when backend is unavailable or user is unauthenticated
- **Styling**: Tailwind utility classes throughout, Reddit-inspired dark theme with orange accents

### Testing

- **Backend unit/integration tests**: Jest + mongodb-memory-server (`resume-backend/tests/unit/`, `tests/integration/`)
- **Frontend E2E**: Playwright (`resume-web/test/e2e.spec.js`) — supports dev mode and Docker mode via env var

## Code Conventions

- Pure JavaScript (no TypeScript)
- Backend files use kebab-case (`auth.routes.js`), frontend components use PascalCase (`ProfileHeader.vue`)
- Vue components use Composition API with `<script setup>`
- All async backend handlers use async/await
- Mongoose schemas use `timestamps: true` and transform `_id` to `id` in JSON responses
- No ESLint or Prettier configured
