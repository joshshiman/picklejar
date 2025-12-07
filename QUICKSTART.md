# PickleJar Quick Start Guide

Get up and running with PickleJar in under 5 minutes! 🥒

---

## ⚡ Super Quick Start

```bash
# 1. Clone and navigate
git clone https://github.com/joshshiman/picklejar.git
cd picklejar

# 2. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# 3. Start backend (in this terminal)
uvicorn main:app --reload

# 4. Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env.local

# 5. Start frontend
npm run dev
```

**Done!** 
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎯 Test the Backend in 30 Seconds

### Option 1: Use Swagger UI (Easiest)

1. Open http://localhost:8000/docs
2. Expand `POST /api/picklejars`
3. Click "Try it out"
4. Edit the JSON:
   ```json
   {
     "title": "Test Dinner",
     "points_per_voter": 10,
     "max_suggestions_per_member": 1,
     "creator_phone": "+1234567890"
   }
   ```
5. Click "Execute"
6. Copy the `id` from the response
7. Test other endpoints with that ID!

### Option 2: Use curl

```bash
# Create a PickleJar
curl -X POST "http://localhost:8000/api/picklejars" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Friday Dinner",
    "points_per_voter": 10,
    "creator_phone": "+1234567890"
  }'

# Copy the ID from response, then get details
curl -X GET "http://localhost:8000/api/picklejars/YOUR_ID_HERE"
```

---

## 🏃 Complete Test Flow (5 minutes)

Follow these steps to test the entire system:

### Step 1: Create PickleJar
```bash
# Visit http://localhost:8000/docs
# POST /api/picklejars
# Response: {"id": "abc123xy", ...}
```

### Step 2: Join as Members
```bash
# POST /api/members/abc123xy/join
# Body: {"phone_number": "+1111111111", "display_name": "Alice"}
# Repeat with different numbers for Bob, Charlie
```

### Step 3: Start Suggesting
```bash
# POST /api/picklejars/abc123xy/start-suggesting
```

### Step 4: Submit Suggestions
```bash
# POST /api/suggestions/abc123xy/suggest?member_id=ALICE_ID
# Body: {"title": "Thai Restaurant", "estimated_cost": "$$"}
# Repeat for each member
```

### Step 5: Start Voting
```bash
# POST /api/picklejars/abc123xy/start-voting
```

### Step 6: Submit Votes
```bash
# POST /api/votes/abc123xy/vote?member_id=ALICE_ID
# Body: {
#   "votes": [
#     {"suggestion_id": "sugg1", "points": 6},
#     {"suggestion_id": "sugg2", "points": 4}
#   ]
# }
```

### Step 7: View Results
```bash
# POST /api/picklejars/abc123xy/complete
# GET /api/picklejars/abc123xy/results
```

---

## 📋 What's Already Built

### ✅ Backend (100% Complete)
- **4 Database Models**: PickleJar, Member, Suggestion, Vote
- **28 API Endpoints**: Full CRUD operations
- **Automatic Documentation**: Swagger UI at /docs
- **Phase Management**: Setup → Suggest → Vote → Complete
- **Point Allocation**: Flexible voting system
- **Anonymous Voting**: Until completion
- **Winner Calculation**: Automatic tallying

### 🔨 Frontend (Structure Ready)
- **Package.json**: All dependencies listed
- **Environment Template**: .env.example created
- **Documentation**: Setup instructions in README
- **Pending**: Page implementation (your task!)

---

## 🛠️ Your First Feature

Let's build the home page!

### 1. Create the Home Page

```bash
cd frontend
mkdir -p app
```

Create `app/page.tsx`:
```tsx
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          🥒 PickleJar
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Group hangouts made easy
        </p>
        <a
          href="/create"
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
        >
          Create a PickleJar
        </a>
      </div>
    </div>
  );
}
```

### 2. Create Root Layout

Create `app/layout.tsx`:
```tsx
import './globals.css'

export const metadata = {
  title: 'PickleJar - Group Hangouts Made Easy',
  description: 'Democratic group planning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### 3. Create Global Styles

Create `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
```

### 4. Configure Tailwind

Create `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `postcss.config.js`:
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5. Test It!

```bash
npm run dev
# Visit http://localhost:3000
```

---

## 📚 Next Steps

### Week 1: Core Pages
- [ ] Create PickleJar form page (`/create`)
- [ ] PickleJar overview page (`/pj/[id]`)
- [ ] Join page with phone input

### Week 2: Suggestion Phase
- [ ] Suggestion submission form
- [ ] List view of all suggestions
- [ ] Edit/delete functionality

### Week 3: Voting Phase
- [ ] Point allocation UI
- [ ] Vote submission
- [ ] Vote summary display

### Week 4: Results
- [ ] Results page with winner
- [ ] Vote breakdown
- [ ] Share functionality

---

## 🔍 Useful Commands

### Backend
```bash
# Activate virtual environment
source backend/.venv/bin/activate

# Run backend
uvicorn main:app --reload

# Check database
sqlite3 backend/picklejar.db "SELECT * FROM picklejars;"

# Run tests (when you write them)
pytest
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm run start
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.9+
```

### Frontend won't start
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

### CORS errors
- Check `backend/main.py` - your frontend URL should be in `allow_origins`
- Default: `http://localhost:3000` is already included

### Database issues
```bash
# Reset database (WARNING: deletes all data)
rm backend/picklejar.db
# Restart backend - tables will be recreated
```

### Port already in use
```bash
# Backend - use different port
uvicorn main:app --reload --port 8001

# Frontend - use different port
npm run dev -- -p 3001
```

---

## 📖 Documentation

- **README.md** - Project overview
- **DEVELOPMENT.md** - Developer workflows
- **API_EXAMPLES.md** - API testing examples
- **ARCHITECTURE.md** - System design
- **backend/README.md** - Backend details
- **frontend/README.md** - Frontend details

---

## 🎉 You're Ready!

The backend is complete and fully functional. Your job is to build the frontend that consumes the API. The backend already handles:

✅ All business logic  
✅ Data validation  
✅ Database operations  
✅ Anonymous voting  
✅ Winner calculation  

Focus on creating a great user experience! 🚀

---

**Questions?** Check the docs or test the API at http://localhost:8000/docs

**Happy coding! 🥒**