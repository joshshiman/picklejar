# PickleJar Quick Start Guide

This file captures the current workflow for running both services locally and includes a short API reference for the shared `/jar/{id}` experience.

---

## 🧰 Recommended Workflow

```bash
git clone https://github.com/joshshiman/picklejar.git
cd picklejar
./start.sh          # boots backend + frontend, copies env files, opens logs
```

- Backend: http://localhost:8000 (Swagger at `/docs`, ReDoc at `/redoc`)
- Frontend: http://localhost:3000 (typeform-style create flow, shares single `/jar/{id}` link)
- The `start.sh` script handles venv creation, dependency installs, and concurrent servers.

---

## 🪄 Common Commands (manual alternative)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 🌐 Shared Link API Reference

| Action | Endpoint | Notes |
|--------|----------|-------|
| Create PickleJar | `POST /api/picklejars` | Returns `id`, `points_per_voter`, and shareable link `/jar/{id}` |
| Join with phone | `POST /api/members/{id}/join` | Saves `member_id` (persist in `localStorage`) |
| Suggest idea | `POST /api/suggestions/{id}/suggest?member_id={member_id}` | Optional description/location/cost |
| Start suggesting phase | `POST /api/picklejars/{id}/start-suggesting` | Host action |
| Start voting phase | `POST /api/picklejars/{id}/start-voting` | Derives `points_per_voter = max(suggestions - 1, 1)` |
| Vote | `POST /api/votes/{id}/vote?member_id={member_id}` | Submit array `{ votes: [{ suggestion_id, points }] }` |
| View results | `GET /api/picklejars/{id}/results` | Winner + ranking once status is `completed` |
| Stats | `GET /api/picklejars/{id}/stats` | Members/suggestions/votes summary |
| Member list | `GET /api/members/{id}/members` | Anonymized participation data |

---

## 🧪 Validation Flow

1. Create PickleJar via frontend `/` form → host redirected to `/jar/{id}`.
2. Guests join via `/jar/{id}` (phone number) → client stores `pj_member_{id}`.
3. Suggest phase: `/jar/{id}/suggest` lets each member drop pickles.
4. Voting phase: `/jar/{id}/vote` enforces remaining points, submits votes.
5. Results: `/jar/{id}/results` shows winner and full ranking.

---

## 🧩 Tips

- Delete `backend/picklejar.db` to reset data (tables auto-created).
- Use Swagger (`/docs`) for manual endpoint checks when building frontend.
- Keep frontend/env pointing to `NEXT_PUBLIC_API_URL=http://localhost:8000`.

---