# 🥒 PickleJar

**Group Hangouts, Democratically Decided**

PickleJar is a full-stack democratic planning experience that lets friends plan hangouts without the noise of long group chats. Hosts spin up a PickleJar in seconds, automatically receive a single shareable link, and everyone—guest or host—uses that same link to join, suggest ideas, vote, and see the final result.

<div align="center">
  <a href="QUICKSTART.md"><img src="https://img.shields.io/badge/Quickstart-Run%20the%20stack-16a34a?style=for-the-badge&logo=gnometerminal&logoColor=white" alt="Quickstart badge" /></a>
  <a href="API_EXAMPLES.md"><img src="https://img.shields.io/badge/API%20Recipes-curl%20helpers-0ea5e9?style=for-the-badge&logo=fastapi&logoColor=white" alt="API recipes badge" /></a>
  <a href="DEVELOPMENT.md"><img src="https://img.shields.io/badge/Dev%20Guide-patterns%20%26%20workflow-f97316?style=for-the-badge&logo=github&logoColor=white" alt="Development guide badge" /></a>
  <a href="PROJECT_SUMMARY.md"><img src="https://img.shields.io/badge/Roadmap-current%20focus-9333ea?style=for-the-badge&logo=notion&logoColor=white" alt="Roadmap badge" /></a>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Status-MVP%20polish%20in%20progress-84cc16?style=flat-square" alt="Status badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-2563eb?style=flat-square" alt="Backend badge" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014%20%2B%20Tailwind-0f172a?style=flat-square&labelColor=0ea5e9" alt="Frontend badge" />
  <img src="https://img.shields.io/badge/Tests-Pytest%20%7C%20ESLint-eab308?style=flat-square" alt="Tests badge" />
</p>

## ✨ Highlights
- Single shared link keeps every participant on the same page through creation, suggestion, voting, and results.
- Backed by FastAPI + SQLAlchemy with generated docs, health checks, and a clear migration path to Supabase/PostgreSQL.
- Next.js 14 App Router frontend mirrors the product tone: lightweight, fast, and phone-friendly.
- Automation helpers (`start.sh`, toast UX, local member persistence) make demos and onboarding painless.

## 🔗 Quick Links
| Need | Reference |
| --- | --- |
| Spin up the stack fast | [QUICKSTART.md](QUICKSTART.md) |
| See end-to-end API calls | [API_EXAMPLES.md](API_EXAMPLES.md) |
| Follow the day-to-day dev workflow | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Dive into architecture diagrams | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Align on UX voice and icons | [PickleJar_UX_Navigation_and_Icons.md](PickleJar_UX_Navigation_and_Icons.md) |

---

## 🧱 Current Architecture

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Backend** | FastAPI + SQLAlchemy + SQLite (MVP) | Hosts the REST API, enforces phases, stores PickleJars, members, suggestions, and votes. Includes automatic docs (`/docs`, `/redoc`). |
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS + TypeScript | Typeform-style create flow at `/`, shared `jar/[id]` experience for joining, suggesting, voting, and results. |
| **State & UX** | Local component state with toast notifications | Members store their `member_id` in `localStorage`, all interactions reuse the `/jar/{id}` link. |

---

## 🌀 Application Workflow

1. **Create PickleJar (`POST /api/picklejars`)**  
   Every visitor landing on `/` sees the create form. Submitting it returns a PickleJar ID and redirects to `/jar/{id}`.

2. **Share Link**  
   The host interface shows the `/jar/{id}` link with copy/share helpers. This is the only URL required for all participants.

3. **Join (`POST /api/members/{id}/join`)**  
   Guests input their phone number (no password), receive or persist a `member_id`, and gain access to phase-specific actions.

4. **Suggest (`POST /api/suggestions/{id}/suggest`)**  
   Anyone with a `member_id` can drop “pickles” (ideas), optionally including description, location, or cost.

5. **Vote (`POST /api/votes/{id}/vote`)**  
   Once the host starts voting, each member allocates `points_per_voter` (derived via `n - 1` rule). Clients enforce the budget client-side before submitting.

6. **Results (`GET /api/picklejars/{id}/results`)**  
   When voting ends, the same link surfaces the winner, full ranking, and stats.

---

## 🖥️ Backend Details

- **Stack:** FastAPI, Uvicorn, SQLAlchemy (ORM), SQLite (MVP, swap to Supabase/PostgreSQL by changing `DATABASE_URL`), Pydantic/Pydantic-settings.
- **Modules:** `main.py`, `database.py`, `models.py`, `schemas.py`, routers for picklejars/members/suggestions/votes.
- **Key concepts:** Shareable link identification, lazy phase transitions on deadlines, derived point limits, soft deletes (`is_active` flags), auto-generated docs.
- **Commands:**
  ```bash
  cd backend
  python -m venv .venv
  source .venv/bin/activate      # Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
- **Docs:** Swagger (`/docs`), ReDoc (`/redoc`). Health at `/health`.

---

## 🚀 Frontend Details

- **Stack:** Next.js 14 App Router, React 18.2, TypeScript, Tailwind CSS, Axios, React Hook Form, Zustand (planned), Lucide icons.
- **Routes Overview:**
  - `/` – Typeform-style create flow.
  - `/jar/[id]` – Shared page showing status, members, suggestions, share controls.
  - `/jar/[id]/suggest` – Drop a pickle.
  - `/jar/[id]/vote` – Budgeted voting UI.
  - `/jar/[id]/results` – Final ranking.
  - `/jar/[id]/edit` – Host controls, auto-save metadata, phase transitions.
- **Global utilities:** `ToastProvider`, API calls via `process.env.NEXT_PUBLIC_API_URL`.
- **Commands:**
  ```bash
  cd frontend
  npm install
  cp .env.example .env.local
  npm run dev
  ```
- Frontend communicates with backend APIs using `/api/...` endpoints; the shared link is the single truth for all phases.

---

## 🛠️ Development Workflow

- Run backend and frontend concurrently (use `start.sh` or two terminals).
- Backend uses `.env` (copy from `.env.example`), frontend uses `.env.local`.
- `start.sh` checks prerequisites, prepares environments, and launches both servers.
- Local data persists in `backend/picklejar.db`; delete to reset.

---

## 🧪 Testing & Debugging

- **Backend:** `pytest`, `pytest --cov`, inspect SQLite via `sqlite3 backend/picklejar.db`.
- **Frontend:** `npm run lint`, `npm run type-check`, `npm run build`, check console/network logs.
- Use Swagger UI for manual API testing or `API_EXAMPLES.md` for curl guides.

---

## ⚙️ Env Configuration

### Backend `.env`:
```
DATABASE_URL=sqlite:///./picklejar.db
DEBUG=True
SECRET_KEY=your-secret-key
SMS_ENABLED=false
EMAIL_ENABLED=false
```

### Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=PickleJar
NEXT_PUBLIC_SMS_VERIFICATION_ENABLED=false
```

Add Twilio/SMTP secrets when enabling SMS/email features.

---

## 📦 Project Documentation

- `README.md` – Overview (this file).
- `DEVELOPMENT.md` – Developer workflow, branching, testing, architecture.
- `API_EXAMPLES.md` – Extensive curl examples covering complete PickleJar lifecycle.
- `ARCHITECTURE.md` – System diagrams, ERD, API map, security model.
- `backend/README.md` – Backend-specific setup and references.
- `frontend/README.md` – Frontend-specific guidance.
- `PROJECT_SUMMARY.md` – High-level summary, roadmap, success metrics.
- `PickleJar_UX_Navigation_and_Icons.md` – Copy tone, navigation labels, icon usage.

---

## 🔁 Roadmap Highlights

1. **MVP polish:** whole shared link flow, suggestion/vote UX, results visualization.
2. **Phase 2:** Supabase/PostgreSQL migration, real-time status, SMS verification, calendar invites.
3. **Phase 3+:** Recurring PickleJars, analytics, mobile app, location-aware suggestions.

---

## 📬 Contributing

1. **Branching model:** Fork the repo (or stay within the org) and branch from `develop` using `feature/*`, `bugfix/*`, or `docs/*` prefixes so reviewers can scan intent instantly.
2. **Environment prep:** Follow [QUICKSTART.md](QUICKSTART.md) to run both services. Confirm API calls succeed (`/health`, `/docs`) before touching frontend flows.
3. **Focused changes:** Keep PR scope tight. Touch backend routers/schemas and frontend hooks/components in the same change only when the feature truly spans both layers.
4. **Quality gates:** Run the full lint/test suite before pushing. At minimum:
   ```/dev/null/contributing.sh#L1-4
   pytest
   pytest --cov
   npm run lint
   npm run type-check
   ```
5. **Docs & fixtures:** Update `README.md`, `DEVELOPMENT.md`, or `API_EXAMPLES.md` whenever you alter behavior, endpoints, or CLI instructions. Add sample payloads/fixtures if your change needs new QA steps.
6. **Pull request checklist:** Reference the issue, summarize user impact, note screenshots or recordings (especially for UX), and confirm tests/lints passed. Tag reviewers who own the affected area (backend, frontend, UX).

---

## ✅ Summary

PickleJar already ships with a production-ready backend, clear API surface, and a structured frontend scaffold. The remaining work focuses on delivering a delightful shared link experience, tightening UX, and polishing automation (sharing, results, reminders). Happy building—let’s make planning fun again.