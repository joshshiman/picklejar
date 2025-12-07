# PickleJar Backend

FastAPI backend for PickleJar - Democratic group hangout planning.

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite (MVP) → Supabase/PostgreSQL (Production)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Server**: Uvicorn

## Getting Started

### Prerequisites

- Python 3.9+
- pip (Python package manager)

### Installation

1. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   
   # On macOS/Linux:
   source .venv/bin/activate
   
   # On Windows:
   .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration (defaults work for local development).

4. **Initialize the database**
   
   The database will be created automatically on first run with SQLite.
   Tables are created via SQLAlchemy models in `models.py`.

5. **Run the development server**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at:
   - API: http://localhost:8000
   - Interactive docs (Swagger): http://localhost:8000/docs
   - Alternative docs (ReDoc): http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── database.py            # Database connection and session management
├── models.py              # SQLAlchemy ORM models
├── schemas.py             # Pydantic schemas for validation
├── config.py              # Configuration and settings
├── routers/               # API route handlers
│   ├── __init__.py
│   ├── picklejars.py     # PickleJar CRUD operations
│   ├── members.py        # Member management
│   ├── suggestions.py    # Suggestion management
│   └── votes.py          # Voting operations
├── .env.example          # Environment variables template
├── .env                  # Your local environment variables (git-ignored)
├── requirements.txt      # Python dependencies
└── picklejar.db          # SQLite database (auto-created, git-ignored)
```

## Database Models

### PickleJar
The main container for a group decision session.

**Fields:**
- `id` (String): Unique short ID for URL
- `title` (String): Name of the PickleJar
- `description` (Text): Optional description
- `points_per_voter` (Integer): Points each member can allocate (derived internally by the system; not user-configurable in the UI)
- `max_suggestions_per_member` (Integer): Max suggestions per member
- `suggestion_deadline` (DateTime): Optional deadline for suggestions
- `voting_deadline` (DateTime): Optional deadline for voting
- `hangout_datetime` (DateTime): Planned hangout time
- `status` (String): Current phase (setup, suggesting, voting, completed, cancelled)
- `creator_phone` (String): Phone number of creator

### Member
A participant in a PickleJar.

**Fields:**
- `id` (String): UUID
- `picklejar_id` (String): Foreign key to PickleJar
- `phone_number` (String): Member's phone number (identity)
- `display_name` (String): Optional nickname
- `is_verified` (Boolean): SMS verification status
- `has_suggested` (Boolean): Has submitted a suggestion
- `has_voted` (Boolean): Has submitted votes

### Suggestion
An idea submitted for the group hangout.

**Fields:**
- `id` (String): UUID
- `picklejar_id` (String): Foreign key to PickleJar
- `member_id` (String): Foreign key to Member
- `title` (String): Suggestion title
- `description` (Text): Optional details
- `location` (String): Optional location
- `estimated_cost` (String): Cost indicator ($, $$, $$$, Free)

### Vote
Points allocated by a member to a suggestion.

**Fields:**
- `id` (String): UUID
- `member_id` (String): Foreign key to Member
- `suggestion_id` (String): Foreign key to Suggestion
- `picklejar_id` (String): Foreign key to PickleJar
- `points` (Integer): Number of points allocated

## API Endpoints

### PickleJars

#### Create PickleJar
```http
POST /api/picklejars
Content-Type: application/json

{
  "title": "Friday Dinner",
  "description": "Let's decide where to eat!",
  "points_per_voter": 10,
  "max_suggestions_per_member": 1,
  "creator_phone": "+1234567890"
}
```

#### Get PickleJar
```http
GET /api/picklejars/{picklejar_id}
```

#### Update PickleJar
```http
PATCH /api/picklejars/{picklejar_id}
Content-Type: application/json

{
  "status": "suggesting"
}
```

#### Start Suggesting Phase
```http
POST /api/picklejars/{picklejar_id}/start-suggesting
```

#### Start Voting Phase
```http
POST /api/picklejars/{picklejar_id}/start-voting
```

#### Complete PickleJar
```http
POST /api/picklejars/{picklejar_id}/complete
```

#### Get Results
```http
GET /api/picklejars/{picklejar_id}/results
```

#### Get Statistics
```http
GET /api/picklejars/{picklejar_id}/stats
```

### Members

#### Join PickleJar
```http
POST /api/members/{picklejar_id}/join
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "display_name": "John"
}
```

#### Get Members (Anonymized)
```http
GET /api/members/{picklejar_id}/members
```

#### Get Member by Phone
```http
GET /api/members/{picklejar_id}/member-by-phone/{phone_number}
```

#### Update Display Name
```http
PATCH /api/members/member/{member_id}/display-name?display_name=NewName
```

### Suggestions

#### Submit Suggestion
```http
POST /api/suggestions/{picklejar_id}/suggest?member_id={member_id}
Content-Type: application/json

{
  "title": "Thai Restaurant",
  "description": "Amazing pad thai place downtown",
  "location": "123 Main St",
  "estimated_cost": "$$"
}
```

#### Get All Suggestions
```http
GET /api/suggestions/{picklejar_id}/suggestions
```

#### Update Suggestion
```http
PATCH /api/suggestions/suggestion/{suggestion_id}?member_id={member_id}
Content-Type: application/json

{
  "description": "Updated description"
}
```

#### Delete Suggestion
```http
DELETE /api/suggestions/suggestion/{suggestion_id}?member_id={member_id}
```

### Votes

#### Submit Votes
```http
POST /api/votes/{picklejar_id}/vote?member_id={member_id}
Content-Type: application/json

{
  "votes": [
    {"suggestion_id": "abc123", "points": 6},
    {"suggestion_id": "def456", "points": 4}
  ]
}
```

> Note: The backend enforces how many points a member can allocate. In the current product flow, this is **derived internally** (for example, based on the number of participants such as `n - 1`) rather than configured directly by the user when creating a PickleJar.

#### Get Member's Votes
```http
GET /api/votes/{picklejar_id}/votes/{member_id}
```

#### Clear Votes
```http
DELETE /api/votes/{picklejar_id}/votes/{member_id}
```

## PickleJar Workflow

### 1. Setup Phase
- Host creates a PickleJar with minimal settings (e.g., title and optional description; voting power is derived internally)
- Host shares the unique link (e.g., `picklejar.app/pj/abc123`)
- Members join via the link by entering phone number
- Host starts the suggesting phase

### 2. Suggesting Phase
- All members submit their hangout suggestions
- Suggestions are anonymous at this point
- Host can see how many members have suggested
- Phase ends when:
  - All members have suggested, OR
  - Time deadline is reached, OR
  - Host manually starts voting

### 3. Voting Phase
- Members allocate points across all suggestions
- Each member has a fixed number of points (e.g., 10)
- Can distribute points however they want
- Can vote on their own suggestion
- Votes are anonymous
- Phase ends when:
  - All members have voted, OR
  - Time deadline is reached, OR
  - Host manually completes the PickleJar

### 4. Results
- The suggestion with the most points wins
- All suggestions and vote totals are revealed
- Suggestion authors are revealed
- Optional: Calendar invites sent to all members

## Database Migration (SQLite → Supabase)

When ready to move to production:

### 1. Set up Supabase

1. Create account at https://supabase.com
2. Create a new project
3. Get connection string from Project Settings → Database

### 2. Update Environment Variable

```bash
# In .env, change from:
DATABASE_URL=sqlite:///./picklejar.db

# To:
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 3. Run Migrations

The SQLAlchemy models will work with both databases. Just restart the server:

```bash
uvicorn main:app --reload
```

Tables will be created automatically on first run.

### 4. Migrate Data (if needed)

```bash
# Export from SQLite
sqlite3 picklejar.db .dump > data.sql

# Import to PostgreSQL (adjust for Supabase)
psql $DATABASE_URL < data.sql
```

## Configuration

Environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./picklejar.db` |
| `SECRET_KEY` | Secret key for sessions | (generate random) |
| `DEBUG` | Debug mode | `True` |
| `SMS_ENABLED` | Enable SMS verification | `False` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |
| `EMAIL_ENABLED` | Enable email features | `False` |

## Testing

Run tests with pytest:

```bash
pytest
```

Test coverage:

```bash
pytest --cov=. --cov-report=html
```

## Development Tips

### Interactive API Documentation

FastAPI automatically generates interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

You can test all endpoints directly in the browser!

### Database Inspection

View the SQLite database:

```bash
# Using sqlite3
sqlite3 picklejar.db
.tables
.schema picklejars
SELECT * FROM picklejars;

# Or use a GUI tool like DB Browser for SQLite
```

### Hot Reload

The `--reload` flag enables hot reloading during development:

```bash
uvicorn main:app --reload --log-level debug
```

### CORS Configuration

CORS origins are configured in `main.py`. Add your frontend URL if deploying:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-production-domain.com"
    ],
    ...
)
```

## Deployment

### Option 1: Railway

1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Option 2: Fly.io

```bash
flyctl launch
flyctl deploy
```

### Option 3: Docker

```bash
docker build -t picklejar-backend .
docker run -p 8000:8000 picklejar-backend
```

## Troubleshooting

### Database locked error (SQLite)
This happens with concurrent writes. Consider using PostgreSQL for production or implement retry logic.

### Import errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### CORS errors from frontend
Add your frontend URL to CORS origins in `main.py`.

### Port already in use
Change the port:
```bash
uvicorn main:app --reload --port 8001
```

## Contributing

1. Create a feature branch
2. Make changes
3. Write/update tests
4. Submit pull request

## License

MIT