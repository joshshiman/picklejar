# PickleJar Frontend

Next.js 14 App Router delivering the shared `/jar/{id}` experience—create, join, suggest, vote, and view results with a single link.

---

## 🚀 Overview

- **Entry point**: `http://localhost:3000` instantly shows the typeform-style creation journey; no separate marketing splash.
- **Shared link**: Every PickleJar lives at `/jar/{id}`. Hosts, guests, and results pages all reuse that URL for their interactions.
- **Flow**:
  1. Create a PickleJar on `/` (title, description, voting settings, host phone).
  2. Share the generated `/jar/{id}` link.
  3. Members join via phone, drop ideas, vote, and view results through the same experience.

---

## 🧱 Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Typeform-like create flow that returns a PickleJar ID and shared link. |
| `/how-it-works` | Explains the shared-link journey with expandable steps. |
| `/jar/[id]` | Unified host/guest dashboard (status, members, suggestions, share tools). |
| `/jar/[id]/suggest` | Drop a “pickle” with title and optional description/location/cost. |
| `/jar/[id]/vote` | Allocate `points_per_voter` across suggestions with client-enforced remaining points. |
| `/jar/[id]/results` | Winner announcement and ranked results once voting completes. |
| `/jar/[id]/edit` | Host controls: metadata edits, deadlines, and manual phase transitions. |

---

## 🧰 Stack & Tooling

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Lucide icons
- **State**: Local React state + `ToastProvider` for feedback
- **Forms**: React Hook Form for the structured question experience
- **HTTP**: Axios calling `NEXT_PUBLIC_API_URL`
- **Persistence**: Store `member_id` in `localStorage` (`pj_member_{id}`) so suggestions/votes reuse identity

---

## ✅ Quick Start

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=PickleJar
NEXT_PUBLIC_SMS_VERIFICATION_ENABLED=false
NEXT_PUBLIC_MAPBOX_TOKEN=pk.yourPublicTokenFromMapbox
NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=false
```

Set `NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=true` locally when you want to exercise the Mapbox-powered location picker on `/jar/[id]/suggest`. That picker also requires `NEXT_PUBLIC_MAPBOX_TOKEN` to be present; the frontend only sends the public token and the backend remains the source of truth for structured location columns.

---

## 🔗 Shared Link API Highlights

- **Create**: `POST /api/picklejars` → redirect to `/jar/{id}`
- **Join**: `POST /api/members/{id}/join` → persist `member_id`
- **Suggest**: `POST /api/suggestions/{id}/suggest?member_id={member_id}`
- **Vote**: `POST /api/votes/{id}/vote?member_id={member_id}` with `{ votes: [{ suggestion_id, points }] }`
- **Results**: `GET /api/picklejars/{id}/results`

All interactions stay within the `/jar/{id}` experience.

---

## ✨ UX Patterns

- **Typeform feel**: Full-screen sections, oversized copy, auto-resizing textareas.
- **Share footer**: Sticky CTA bar with copy/share and next-phase prompts.
- **Phase timeline**: Vertical timeline cards showing Setup → Suggesting → Voting → Results.
- **Toasts**: `ToastProvider` surfaces success/error messages for every API request.

---

## 🧪 Dev Tips

- Open `/jar/[id]` in multiple incognito windows to simulate different members.
- Use the share button (navigator.share or clipboard fallback) to confirm the generated link works.
- Inspect Axios requests in DevTools to ensure `member_id` query params and payload shapes are correct.

---

## ⚙️ Available Scripts

- `npm run dev` – Start dev server
- `npm run build` – Compile for production
- `npm run start` – Serve production build
- `npm run lint` – Run ESLint
- `npm run type-check` – Run TypeScript checks

---

## 🏗️ Deployment Notes

- Build production assets with `npm run build` and serve with `npm run start`.
- Deploy the `frontend` directory to a host such as Vercel, pointing `NEXT_PUBLIC_API_URL` to the live API.
- Ensure backend CORS includes the production frontend origin before going live.

---

## 🛠️ Troubleshooting

- **API unreachable**: Make sure the backend is running at `http://localhost:8000` and matches `NEXT_PUBLIC_API_URL`.
- **TypeScript errors**: Run `npm run type-check` and sync `lib/types.ts` with backend schemas.
- **Build hiccups**: Remove `.next`/`node_modules`, reinstall (`npm install`), and rebuild.
- **Share link glitches**: Review the clipboard/share logic in `app/jar/[id]/page.tsx` and ensure native fallback works.

---

## 🧩 Next Frontend Priorities

1. Ship `/jar/[id]/vote` with remaining points indicator, validation, and keyboard-friendly inputs.
2. Polish `/jar/[id]/results` with vote breakdown, winner context, and sharing tools.
3. Expand `/jar/[id]/edit` with deadlines, manual transitions, and autosave messaging.
4. Introduce caching or a Zustand store to persist PickleJar/member state across routes.

---

## 📄 License

MIT