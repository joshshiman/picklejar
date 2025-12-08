# 🥒 PickleJar

**Group Hangouts, Democratically Decided**

PickleJar is a full-stack democratic planning experience that lets friends plan hangouts without the noise of long group chats. Hosts spin up a PickleJar in seconds, automatically receive a single shareable link, and everyone—guest or host—uses that same link to join, suggest ideas, vote, and see the final result.

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

- Feature branches (`feature/*`, `bugfix/*`), base `develop`/`main`.
- Commit message style: `feat:`, `fix:`, `docs:`, `style:`.
- Run lint/tests before pushing.

---

## ✅ Summary

PickleJar already ships with a production-ready backend, clear API surface, and a structured frontend scaffold. The remaining work focuses on delivering a delightful shared link experience, tightening UX, and polishing automation (sharing, results, reminders). Happy building—let’s make planning fun again.