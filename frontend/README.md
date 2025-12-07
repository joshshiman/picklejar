# PickleJar Frontend

React/Next.js frontend for PickleJar - Democratic group hangout planning.

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
│   ├── page.tsx             # Home page
│   ├── create/              # Create PickleJar
│   ├── pj/[id]/             # PickleJar pages
│   │   ├── page.tsx         # Join/Overview
│   │   ├── suggest/         # Suggestion phase
│   │   ├── vote/            # Voting phase
│   │   └── results/         # Results page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── picklejar/           # PickleJar-specific components
│   └── forms/               # Form components
├── lib/                     # Utilities and helpers
│   ├── api.ts              # API client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── stores/                  # Zustand state stores
│   └── picklejar.ts        # PickleJar state
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

The frontend communicates with the FastAPI backend through a centralized API client (`lib/api.ts`):

```typescript
import { api } from '@/lib/api';

// Create a PickleJar
const picklejar = await api.createPickleJar({
  title: "Friday Dinner",
  points_per_voter: 10
});

// Get suggestions
const suggestions = await api.getSuggestions(picklejarId);
```

### State Management

Use Zustand stores for global state:

```typescript
import { usePickleJarStore } from '@/stores/picklejar';

const { currentPickleJar, setPickleJar } = usePickleJarStore();
```

### Styling

Use Tailwind CSS utility classes:

```tsx
<button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
  Submit
</button>
```

## Key Features to Implement

### Phase 1: MVP
- [ ] Home page with "Create PickleJar" CTA
- [ ] Create PickleJar form
- [ ] Share link functionality
- [ ] Join PickleJar with phone number
- [ ] Submit suggestions
- [ ] View suggestions list
- [ ] Vote with point allocation
- [ ] View results

### Phase 2: Enhanced UX
- [ ] Real-time updates (polling or WebSockets)
- [ ] Progress indicators
- [ ] Responsive mobile design
- [ ] Loading states and animations
- [ ] Error handling and notifications

### Phase 3: Advanced Features
- [ ] SMS verification flow
- [ ] Calendar invite generation
- [ ] Share on social media
- [ ] Vote visualization (charts)
- [ ] Member avatars/profiles

## Component Examples

### Create PickleJar Button
```tsx
import Link from 'next/link';

export function CreateButton() {
  return (
    <Link href="/create" className="btn-primary">
      🥒 Create a PickleJar
    </Link>
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
  onVote?: (points: number) => void;
}

export function SuggestionCard({ title, description, location, cost }: SuggestionCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold text-lg">{title}</h3>
      {description && <p className="text-gray-600">{description}</p>}
      <div className="flex gap-2 mt-2">
        {location && <span className="text-sm">📍 {location}</span>}
        {cost && <span className="text-sm">💰 {cost}</span>}
      </div>
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