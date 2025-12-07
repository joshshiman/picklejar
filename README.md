# 🥒 PickleJar

**Group Hangouts Made Easy**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

PickleJar is a frictionless platform that helps groups of friends democratically and anonymously decide on hangout plans. Inspired by Music League and LettuceMeet, it removes the awkwardness and indecision from group planning.

---

## 🎯 The Problem

Friend group dynamics often create friction when making plans:

- **The Preference Problem**: People suggest what they think the group wants rather than their true preference
- **The Silence Problem**: Some voices don't get heard in the decision-making process
- **The Indecision Problem**: People without strong preferences feel uncomfortable with outcomes they didn't choose
- **The Politics Problem**: Group dynamics and social hierarchies influence what gets suggested

**Result**: Plans either don't happen, take too long to organize, or leave people unsatisfied.

---

## 💡 The Solution

PickleJar creates a **democratic, anonymous, and frictionless** way to make group decisions:

### How It Works

1. **Create** - A host creates a "PickleJar" and shares a unique link with the group
2. **Suggest** - Everyone anonymously submits their hangout ideas
3. **Vote** - Members allocate points across all suggestions (including their own)
4. **Decide** - The suggestion with the most points wins
5. **Remind** - Everyone gets reminders for the winning hangout

### Key Features

- ✅ **Anonymous Suggestions** - No fear of judgment
- ✅ **Democratic Voting** - Everyone's preferences are weighted equally
- ✅ **Point Allocation** - Express how much you like each option
- ✅ **No Authentication** - Just a link and phone number (optional verification)
- ✅ **Automatic Reminders** - Calendar invites and notifications
- ✅ **Time-based or Completion-based** - Rounds end when everyone participates or time runs out

---

## 🔄 The PickleJar Process

### Phase 1: Setup (Host)
```
Host creates PickleJar → Configures settings → Shares unique link
```
**Settings Include:**
- Suggestion deadline (time-based or when all submit)
- Voting deadline (time-based or when all vote)
- Points per voter (e.g., 10 points to distribute)
- Optional: Date/time constraints for the hangout

### Phase 2: Suggestions (All Members)
```
Members join via link → Enter phone number → Submit suggestion(s)
```
**Status Updates:**
- Members can see who has joined
- Members can see how many suggestions are in
- Suggestions remain anonymous until voting ends

### Phase 3: Voting (All Members)
```
View all suggestions → Allocate points → Submit votes
```
**Voting Rules:**
- Each member gets a fixed number of points (e.g., 10)
- Distribute points across suggestions (can put all on one or spread them out)
- Can vote on your own suggestion
- Votes are anonymous

### Phase 4: Results & Reminders
```
Voting ends → Winner announced → Reminders sent
```
**What Happens:**
- The suggestion with the most points is revealed as the winner
- All suggestions and vote totals are revealed
- Calendar invites sent to all participants
- Reminder notifications before the hangout

---

## 🏗️ Technical Architecture

### Design Principles

1. **Simplicity First** - Minimize steps between idea and execution
2. **Frictionless Entry** - No account creation or complex authentication
3. **Mobile-Friendly** - Most planning happens on phones
4. **Real-time Updates** - See participation status live

### Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React/Next.js
- **Database**: SQLite (MVP) → Supabase/PostgreSQL (Production)
- **ORM**: SQLAlchemy (ensures easy migration)
- **Authentication**: Link-based with optional SMS verification

### Why This Stack?

**FastAPI** provides:
- ⚡ High performance with async support
- 📚 Automatic API documentation (OpenAPI/Swagger)
- 🎯 Type safety with Pydantic models
- 🔌 Native WebSocket support for real-time features
- 🪶 Lightweight compared to Django

**SQLite → Supabase Migration Path**:
- **Phase 1 (MVP)**: SQLite for rapid development with zero setup
- **Phase 2 (Production)**: Migrate to Supabase for:
  - Real-time subscriptions
  - Hosted PostgreSQL
  - Built-in SMS/email integrations
  - Automatic backups
  - Scalability

**Migration is painless** thanks to SQLAlchemy - just change the connection string!

### Key Technical Decisions

- **Authenticationless**: Each PickleJar has a unique shareable link (UUID-based)
- **Phone Number Association**: Members tied to phone numbers (low friction identity)
- **Optional Verification**: SMS verification can be enabled by host for added security
- **Session Management**: Browser-based sessions tied to phone numbers
- **ORM Abstraction**: SQLAlchemy allows seamless database switching
- **API Documentation**: Auto-generated with FastAPI's built-in Swagger UI

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joshshiman/picklejar.git
   cd picklejar
   ```

2. **Set up Python virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic python-multipart
   pip freeze > requirements.txt
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Project

#### Backend (Django)

```bash
cd backend

# Create the database (SQLite will be created automatically on first run)
# Run the FastAPI server with auto-reload
uvicorn main:app --reload

# Or with host/port specification
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- API: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

#### Frontend

```bash
cd frontend

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 📱 Usage Example

**Scenario**: A group of 5 friends wants to decide where to eat dinner

1. **Sarah** creates a PickleJar titled "Friday Dinner 🍕"
2. She shares the link: `picklejar.app/pj/abc123xyz`
3. Everyone joins and submits suggestions:
   - Pizza place downtown
   - New sushi restaurant
   - Thai food
   - Someone's apartment (potluck)
4. Voting opens with 10 points per person to distribute
5. Results:
   - Thai food: 28 points ✅ **Winner**
   - Sushi: 22 points
   - Potluck: 15 points
   - Pizza: 5 points
6. Everyone receives a calendar invite for Thai food on Friday at 7pm

---

## 🗺️ Roadmap

### Phase 1: MVP (SQLite)
- [ ] Core voting functionality
- [ ] Link-based session management
- [ ] Anonymous suggestions and voting
- [ ] Point allocation system
- [ ] Basic phone number association
- [ ] Winner calculation and display

### Phase 2: Production (Supabase Migration)
- [ ] Migrate to Supabase/PostgreSQL
- [ ] Real-time status updates
- [ ] SMS verification integration
- [ ] Calendar invite generation
- [ ] Reminder notifications

### Phase 3: Enhanced Features
- [ ] Group chat for confirmed hangout
- [ ] Recurring PickleJars (weekly dinner, etc.)
- [ ] Template suggestions (restaurants, activities, etc.)
- [ ] Location-based suggestions
- [ ] Budget preferences
- [ ] Photo sharing after hangout
- [ ] Mobile app (React Native)

---

## 🔄 Migration Guide (SQLite → Supabase)

When you're ready to move to production, migrating from SQLite to Supabase is straightforward:

### Step 1: Set up Supabase
```bash
# Create a Supabase project at https://supabase.com
# Get your connection string from Project Settings → Database
```

### Step 2: Update Database URL
```python
# backend/database.py
# Change from:
DATABASE_URL = "sqlite:///./picklejar.db"

# To:
DATABASE_URL = "postgresql://user:pass@db.xxxxx.supabase.co:5432/postgres"
```

### Step 3: Run Migrations
```bash
# SQLAlchemy will handle the schema automatically
python migrate.py  # or your migration script
```

### Step 4: Export/Import Data (if needed)
```bash
# Export from SQLite
sqlite3 picklejar.db .dump > data.sql

# Import to PostgreSQL (adjust syntax as needed)
psql $DATABASE_URL < data.sql
```

That's it! Your SQLAlchemy models work with both databases.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

[MIT License](LICENSE) - feel free to use this project for any purpose.

---

## 💬 Feedback

Have ideas or found a bug? [Open an issue](https://github.com/joshshiman/picklejar/issues) or reach out!

---

**Made with 🥒 for friends who actually want to hang out**