# PickleJar Development Guide

A comprehensive guide for developers working on PickleJar.

## 🚀 Quick Start

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/joshshiman/picklejar.git
cd picklejar

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
cd ..

# Frontend setup
cd frontend
npm install
cp .env.example .env.local
cd ..
```

### Daily Development

**Terminal 1 - Backend (preferred via `./start.sh`):**
```bash
./start.sh
```
This script sets up the Python virtual environment, copies `.env` files, installs missing dependencies, and launches both the backend (`uvicorn`) and frontend (`npm run dev`) alongside each other.

If you prefer manual control, continue using the two-terminal workflow:

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
picklejar/
├── backend/                  # FastAPI backend
│   ├── main.py              # Application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── config.py            # Settings and configuration
│   ├── routers/             # API endpoints
│   │   ├── picklejars.py   # PickleJar CRUD
│   │   ├── members.py      # Member management
│   │   ├── suggestions.py  # Suggestion operations
│   │   └── votes.py        # Voting logic
│   ├── .env                # Local environment (git-ignored)
│   ├── requirements.txt    # Python dependencies
│   └── picklejar.db       # SQLite database (auto-created)
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js App Router (typeform-style entry + feature routes)
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── how-it-works/
│   │   │   └── page.tsx
│   │   ├── jar/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── results/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── suggest/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── vote/
│   │   │   │       └── page.tsx
│   │   └── components/
│   │       └── ToastProvider.tsx
│   ├── public/
│   └── package.json
│
├── README.md            # Main project documentation
└── DEVELOPMENT.md       # This file
```

## 🔄 Development Workflow

### 1. Creating a New Feature

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Test locally
# Backend: Check http://localhost:8000/docs
# Frontend: Test in browser at http://localhost:3000

# Commit your changes
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

### 2. Adding a New API Endpoint

**Step 1: Define the schema in `backend/schemas.py`**
```python
class NewFeatureCreate(BaseModel):
    name: str
    value: int

class NewFeatureResponse(BaseModel):
    id: str
    name: str
    value: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**Step 2: Add/update the model in `backend/models.py`**
```python
class NewFeature(Base):
    __tablename__ = "new_features"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    value = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Step 3: Create router endpoint in `backend/routers/` (or add to existing)**
```python
@router.post("/", response_model=NewFeatureResponse)
def create_feature(data: NewFeatureCreate, db: Session = Depends(get_db)):
    db_feature = NewFeature(name=data.name, value=data.value)
    db.add(db_feature)
    db.commit()
    db.refresh(db_feature)
    return db_feature
```

**Step 4: Register router in `backend/main.py`**
```python
from routers import newfeature

app.include_router(newfeature.router, prefix="/api/newfeature", tags=["NewFeature"])
```

**Step 5: Test in Swagger UI**
- Visit http://localhost:8000/docs
- Find your endpoint and test it

### 3. Adding a New Frontend Page

**Step 1: Create the page file**
```bash
# For a new route like /about
mkdir -p frontend/app/about
touch frontend/app/about/page.tsx
```

**Step 2: Add page content**
```tsx
// frontend/app/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About PickleJar</h1>
      <p>Your content here</p>
    </div>
  );
}
```

**Step 3: Add to navigation (if needed)**
```tsx
// In your navigation component
<Link href="/about">About</Link>
```

### 4. Database Changes

**With SQLite (Current):**
- Simply update `models.py`
- Delete `picklejar.db` file
- Restart backend (tables will be recreated)
- ⚠️ Note: This deletes all data!

**For Production (with migrations):**
```bash
# Install alembic
pip install alembic

# Initialize alembic (first time only)
alembic init alembic

# Create a migration
alembic revision --autogenerate -m "Add new table"

# Apply migration
alembic upgrade head
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
source .venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_picklejars.py

# Run with verbose output
pytest -v
```

### Frontend Testing

```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Manual Testing Workflow

1. **Create a PickleJar**
   - Visit http://localhost:3000
   - Click "Create PickleJar"
   - Fill in details
   - Note the generated ID

2. **Join as Members**
   - Open in incognito windows
   - Visit the PickleJar link
   - Enter different phone numbers

3. **Submit Suggestions**
   - Each member submits an idea
   - Verify anonymity

4. **Vote**
   - Allocate points across suggestions
   - Verify point limits work

5. **View Results**
   - Check winner calculation
   - Verify suggestions are revealed

## 🐛 Debugging

### Backend Debugging

**Enable detailed logs:**
```bash
uvicorn main:app --reload --log-level debug
```

**Check database contents:**
```bash
# SQLite CLI
sqlite3 backend/picklejar.db

# List tables
.tables

# View data
SELECT * FROM picklejars;
SELECT * FROM members;
SELECT * FROM suggestions;
SELECT * FROM votes;

# Exit
.quit
```

**Python debugger:**
```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint() (Python 3.7+)
breakpoint()
```

### Frontend Debugging

**Browser DevTools:**
- Console: View logs and errors
- Network: Check API calls
- React DevTools: Inspect component state

**Check environment variables:**
```bash
# In frontend directory
cat .env.local
```

**View build errors:**
```bash
npm run build
# Look for errors in output
```

### Common Issues

**Issue: "Module not found" in backend**
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

**Issue: "Cannot find module" in frontend**
```bash
# Solution: Reinstall node modules
rm -rf node_modules package-lock.json
npm install
```

**Issue: CORS errors**
```python
# Solution: Add your URL to main.py
allow_origins=[
    "http://localhost:3000",
    "http://your-url-here:3000"
]
```

**Issue: Database locked (SQLite)**
```bash
# Solution: Close all connections and restart
# Or switch to PostgreSQL for multi-user testing
```

**Issue: Port already in use**
```bash
# Backend (change port)
uvicorn main:app --reload --port 8001

# Frontend (change port)
npm run dev -- -p 3001
```

## 📊 Database Schema

### Current Schema (MVP)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  PickleJar   │       │    Member    │       │  Suggestion  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │───┬──<│ picklejar_id │   ┌──<│ picklejar_id │
│ title        │   │   │ id (PK)      │───┤   │ member_id    │
│ status       │   │   │ phone_number │   │   │ id (PK)      │
│ points_per...│   │   │ display_name │   │   │ title        │
└──────────────┘   │   │ has_suggested│   │   │ description  │
                   │   │ has_voted    │   │   └──────────────┘
                   │   └──────────────┘   │          │
                   │                      │          │
                   │   ┌──────────────┐   │          │
                   │   │     Vote     │   │          │
                   │   ├──────────────┤   │          │
                   └──<│ picklejar_id │   │          │
                       │ member_id    │───┘          │
                       │ suggestion_id│──────────────┘
                       │ points       │
                       └──────────────┘
```

## 🚀 Deployment

### Backend Deployment (Railway/Fly.io/Render)

1. **Update environment for production:**
```bash
DEBUG=False
DATABASE_URL=postgresql://... # Supabase connection string
ENABLE_STRUCTURED_LOCATION=true  # Enable structured location ingestion when supported
```

Toggle `ENABLE_STRUCTURED_LOCATION` only after the backend and database have the structured location columns deployed; leave it `false` otherwise.

2. **Deploy:**
```bash
# Railway
railway up

# Fly.io
flyctl deploy

# Render
# Push to GitHub, Render auto-deploys
```

### Frontend Deployment (Vercel)

1. **Push to GitHub**

2. **Import to Vercel:**
   - Connect GitHub repository
   - Root directory: `frontend`
   - Framework: Next.js
   - Set environment variables

3. **Set environment variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_MAPBOX_TOKEN=pk.yourPublicTokenFromMapbox
NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=false # Switch to true when the picker should be visible
```

Set `NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=true` (and match the backend flag) whenever you want the Mapbox-powered picker live in production.

4. **Deploy:**
   - Vercel auto-deploys on push to main

## 📝 Code Style Guidelines

### Python (Backend)

- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions small and focused

```python
def get_picklejar(picklejar_id: str, db: Session) -> PickleJar:
    """
    Retrieve a PickleJar by ID.
    
    Args:
        picklejar_id: The unique identifier for the PickleJar
        db: Database session
        
    Returns:
        PickleJar object
        
    Raises:
        HTTPException: If PickleJar not found
    """
    return db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
```

### TypeScript (Frontend)

- Use TypeScript for type safety
- Prefer functional components
- Use meaningful variable names
- Extract reusable components

```tsx
interface PickleJarCardProps {
  title: string;
  memberCount: number;
  status: 'setup' | 'suggesting' | 'voting' | 'completed';
}

export function PickleJarCard({ title, memberCount, status }: PickleJarCardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{memberCount} members</p>
      <span className={`badge-${status}`}>{status}</span>
    </div>
  );
}
```

## 🔐 Security Considerations

### Current (MVP)
- Phone numbers for identity (no password)
- Link-based access (know the URL = access)
- No authentication tokens
- Anonymous voting

### Future Improvements
- SMS verification for phone numbers
- Session tokens with expiration
- Rate limiting on endpoints
- Input sanitization
- HTTPS only in production

## 📚 Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Learning
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Next.js Learn](https://nextjs.org/learn)
- [SQLAlchemy ORM Tutorial](https://docs.sqlalchemy.org/en/20/orm/tutorial.html)

## 🤝 Getting Help

- Check the interactive API docs: http://localhost:8000/docs
- Review this guide
- Check GitHub Issues
- Ask in team chat

## 📋 Pre-commit Checklist

Before committing code:

- [ ] Code runs without errors
- [ ] Tested manually in browser
- [ ] No console errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code is formatted properly
- [ ] Meaningful commit message
- [ ] Sensitive data not committed (.env files)

## 🎯 Next Steps

### Immediate Priorities
1. Complete MVP features (create, suggest, vote, results)
2. Add loading states and error handling
3. Make mobile responsive
4. Add basic styling with Tailwind

### Phase 2
1. Real-time updates (polling or WebSockets)
2. SMS verification
3. Calendar invite generation
4. Share functionality

### Phase 3
1. Migrate to Supabase
2. Deploy to production
3. Add analytics
4. Mobile app (React Native)

---

**Happy coding! 🥒**