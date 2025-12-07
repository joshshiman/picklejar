# PickleJar Frontend

React/Next.js frontend for PickleJar - democratic group hangout planning with a single shareable link.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- PickleJar backend running on `http://localhost:8000`

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Entry page (immediately shows create flow)
│   ├── create/              # Alternate route to the create PickleJar flow
│   ├── pj/[id]/             # Single shared PickleJar link + host/guest view
│   │   ├── page.tsx         # Shared entry: join, status, lightweight admin
│   │   ├── suggest/         # Suggestion phase (for members)
│   │   ├── vote/            # Voting phase (for members)
│   │   └── results/         # Results page (for everyone with the link)
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── picklejar/           # PickleJar-specific components
│   └── forms/               # Typeform-style building blocks (future)
├── lib/                     # Utilities and helpers
│   ├── api.ts              # API client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── stores/                  # Zustand state stores
│   └── picklejar.ts        # PickleJar state (planned)
├── styles/                  # Global styles
│   └── globals.css         # Global CSS
└── public/                  # Static assets

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Development Guidelines

### API Integration

The frontend communicates with the FastAPI backend via HTTP calls (Axios today, with an optional centralized client in `lib/api.ts`).

The core flows:

- **Create PickleJar** (home page `/` and `/create`):
  - `POST /api/picklejars/` with:
    - `title`
    - `description` (optional)
    - `points_per_voter`
    - `creator_phone`
  - On success, backend returns a `picklejar.id`.
  - The app then:
    - Generates a **single shareable link**: `/pj/:id`
    - Shows that link with a **copy button**
    - Allows the host to jump straight into `/pj/:id` (“host view”).

- **Join PickleJar** (shared link `/pj/:id`):
  - Guests land directly on `/pj/:id` from the shared link.
  - They join by submitting a phone number:
    - `POST /api/members/{picklejar_id}/join`
  - The client should persist the resulting `member_id` (e.g., `localStorage`) for use on suggestion and voting pages.

- **Suggest** (guest flow `/pj/:id/suggest`):
  - Guests use the same **shared link** and navigate to `Suggest` from `/pj/:id`.
  - `POST /api/suggestions/{picklejar_id}/suggest?member_id={member_id}` with:
    - `title`
    - `description` (optional)
    - `location` (optional)
  - The app never asks for a separate “admin” URL — suggestions are attached to the same `picklejar_id`.

- **Vote** (guest flow `/pj/:id/vote`):
  - Guests allocate their points (configured during create) across suggestions.
  - `POST /api/votes/{picklejar_id}/vote?member_id={member_id}` with:
    - `{ votes: [{ suggestion_id, points }, ...] }`
  - The app enforces the points-per-voter rule on the client and submits in a single payload.

- **Results** (shared link `/pj/:id/results`):
  - Any visitor with the same **one link** can see the final results:
    - `GET /api/picklejars/{picklejar_id}/results`.

A future centralized client in `lib/api.ts` might look like:

```typescript
import axios from "axios";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export async function createPickleJar(payload: {
  title: string;
  description?: string | null;
  points_per_voter: number;
  creator_phone: string;
}) {
  const res = await client.post("/api/picklejars/", payload);
  return res.data;
}
```

### State Management

Zustand is available for global state (see `stores/`), but much of the current MVP keeps state local to pages.

For future work:

- Persist `member_id` when someone joins a PickleJar (e.g., `usePickleJarStore` + `localStorage`).
- Expose helpers like:
  - `useCurrentMember(picklejarId)`
  - `usePickleJar(picklejarId)` (status, points_per_voter, phase).

### Styling

The frontend uses Tailwind CSS and is moving toward a **typeform-style**, full-bleed, focused form experience:

- Minimal chrome, large typography, and progressive disclosure of fields.
- The **entry page (`/`) is itself the create flow**, not a marketing splash.
- The create flow is broken into conceptual steps, but implemented as a single React component.

Example (simplified):

```tsx
<button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
  Submit
</button>
```

## Key Flows & UX

### Entry Flow (`/` and `/create`)

- The **first screen** a user sees is the **create PickleJar flow**, not a landing/CTA page.
- The flow is **typeform-style**:
  - Step 1: What’s this hangout about? (title)
  - Step 2: Optional context (description)
  - Step 3: Voting power (points per voter)
  - Step 4: Host contact (creator phone)
  - Step 5: Review and create
- On submit:
  - The backend returns `id`.
  - The UI:
    - Shows a **single shareable link**: `/pj/:id` (with a copy button).
    - Offers a “View host view” button that routes to `/pj/:id`.

### Single Shared Link Behavior

- There is **one URL per PickleJar**: `/pj/:id`.
- That URL is reused for:
  - Joining the hangout.
  - Seeing current phase / status.
  - Navigating to Suggest, Vote, and Results.
- Guests don’t need to track multiple URLs; **one link rules them all**.

### Guest Flow (Shared Link `/pj/:id`)

1. **Join**
   - Enter phone number to join.
   - Behind the scenes:
     - `POST /api/members/{picklejar_id}/join`
     - Store `member_id` locally for later calls.

2. **Suggest**
   - Navigate to `/pj/:id/suggest` from the shared page.
   - Submit suggestions anonymously for this PickleJar.

3. **Vote**
   - Navigate to `/pj/:id/vote` when the group is ready.
   - Allocate points up to `points_per_voter` set during creation.

4. **Results**
   - Access `/pj/:id/results` from the same shared link.
   - Everyone sees the winning option and point breakdown.

### Host / “Admin” Behavior

- There is **no separate admin URL**.
- The host also uses `/pj/:id`:
  - Their phone number marks them as the creator.
  - They see group status (members, suggestion/vote completion) through the same surface.
  - Future: host-only controls (e.g., manually switch phases) can be gated by creator identity.

### Future UX Enhancements

- Real-time updates (polling or WebSockets) on the shared `/pj/:id` view.
- Better progress indicators for:
  - How many members have joined.
  - How many have suggested / voted.
- Strong mobile ergonomics for:
  - Single-column, thumb-friendly forms.
  - Clear affordances to jump between Suggest / Vote / Results.
- Toasts and inline errors for all network actions.

### Future “Nice To Haves”

- SMS verification flow and SMS reminders for the winning hangout.
- Calendar invite generation once a winner is chosen.
- Social sharing snippets for the `/pj/:id` link.
- Vote visualizations (charts) on the results page.
- Member avatars / nicknames.

## Component Examples

### Typeform-like Step Header (conceptual)

```tsx
function StepHeader({ step, total, title, subtitle }: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="space-y-2 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
        Step {step} of {total}
      </p>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          {subtitle}
        </p>
      )}
    </header>
  );
}
```

### Suggestion Card

```tsx
interface SuggestionCardProps {
  title: string;
  description?: string;
  location?: string;
  cost?: string;
  onVoteChange?: (points: number) => void;
  points?: number;
}

export function SuggestionCard({
  title,
  description,
  location,
  cost,
  onVoteChange,
  points = 0,
}: SuggestionCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition flex justify-between gap-4">
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        {description && <p className="text-gray-600">{description}</p>}
        <div className="flex gap-2 mt-2 text-sm text-gray-500">
          {location && <span>📍 {location}</span>}
          {cost && <span>💰 {cost}</span>}
        </div>
      </div>
      {onVoteChange && (
        <input
          type="number"
          min={0}
          value={points}
          onChange={(e) => onVoteChange(Number(e.target.value) || 0)}
          className="w-20 border rounded px-2 py-1 text-right"
        />
      )}
    </div>
  );
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `PickleJar` |
| `NEXT_PUBLIC_SMS_VERIFICATION_ENABLED` | Enable SMS verification | `false` |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Manual Build

```bash
npm run build
npm run start
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS configuration in backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Type Errors
- Run `npm run type-check` to identify issues
- Ensure types in `lib/types.ts` match backend schemas

### Build Failures
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

MIT