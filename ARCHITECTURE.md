# PickleJar System Architecture

A comprehensive overview of the PickleJar system design, data flow, and technical architecture.

---

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PICKLEJAR SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                           ┌──────────────┐   │
│  │   Frontend   │◄─────── HTTP/REST ───────►│   Backend    │   │
│  │  (Next.js)   │                           │  (FastAPI)   │   │
│  │              │                           │              │   │
│  │  - React     │                           │  - Uvicorn   │   │
│  │  - TypeScript│                           │  - SQLAlchemy│   │
│  │  - Tailwind  │                           │  - Pydantic  │   │
│  └──────────────┘                           └───────┬──────┘   │
│                                                     │          │
│                                                     │          │
│                                             ┌───────▼──────┐   │
│                                             │   Database   │   │
│                                             │   (SQLite)   │   │
│                                             │      ↓       │   │
│                                             │  (Supabase)  │   │
│                                             └──────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────┐
    │      PickleJar         │
    ├────────────────────────┤
    │ id (PK)                │◄────────┐
    │ title                  │         │
    │ description            │         │
    │ points_per_voter       │         │
    │ max_suggestions        │         │
    │ suggestion_deadline    │         │
    │ voting_deadline        │         │
    │ hangout_datetime       │         │
    │ status                 │         │
    │ creator_phone          │         │
    │ created_at             │         │
    │ updated_at             │         │
    └────────────┬───────────┘         │
                 │                     │
                 │ 1                   │
                 │                     │
                 │                     │
                 │ N                   │
                 │                     │
    ┌────────────▼───────────┐         │
    │       Member           │         │
    ├────────────────────────┤         │
    │ id (PK)                │         │
    │ picklejar_id (FK) ─────┼─────────┘
    │ phone_number           │
    │ display_name           │
    │ is_verified            │
    │ has_suggested          │
    │ has_voted              │
    │ joined_at              │
    │ last_active            │
    └────────────┬───────────┘
                 │
                 │ 1
                 │
                 │
                 │ N
                 │
    ┌────────────▼───────────┐
    │     Suggestion         │
    ├────────────────────────┤
    │ id (PK)                │
    │ picklejar_id (FK)      │
    │ member_id (FK)         │
    │ title                  │
    │ description            │
    │ location               │
    │ estimated_cost         │
    │ created_at             │
    └────────────┬───────────┘
                 │
                 │ 1
                 │
                 │
                 │ N
                 │
    ┌────────────▼───────────┐
    │         Vote           │
    ├────────────────────────┤
    │ id (PK)                │
    │ member_id (FK)         │
    │ suggestion_id (FK)     │
    │ picklejar_id (FK)      │
    │ points                 │
    │ created_at             │
    └────────────────────────┘
```

### Table Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| PickleJar → Member | 1:N | One PickleJar has many Members |
| Member → Suggestion | 1:N | One Member can create multiple Suggestions |
| Member → Vote | 1:N | One Member can cast multiple Votes |
| Suggestion → Vote | 1:N | One Suggestion receives many Votes |
| PickleJar → Suggestion | 1:N | One PickleJar has many Suggestions |
| PickleJar → Vote | 1:N | One PickleJar has many Votes |

---

## 🔄 Application Flow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PICKLEJAR WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  1. CREATE   │  Host creates PickleJar with settings
└──────┬───────┘  - Title, description
       │          - Points per voter (default: 10)
       │          - Max suggestions per member (default: 1)
       │          - Optional deadlines
       ▼
       │  Status: setup
       │  Unique link generated: /pj/abc123
       │
┌──────▼───────┐
│  2. INVITE   │  Host shares link with group
└──────┬───────┘  - Copy link to clipboard
       │          - Share via text/email/social
       ▼
       │  Members click link
       │
┌──────▼───────┐
│  3. JOIN     │  Members join PickleJar
└──────┬───────┘  - Enter phone number
       │          - Optional: display name
       │          - Optional: SMS verification
       ▼
       │  Member record created
       │  Session stored (phone + jar ID)
       │
┌──────▼───────┐
│  4. SUGGEST  │  Members submit ideas
└──────┬───────┘  - Title (required)
       │          - Description (optional)
       │          - Location (optional)
       │          - Cost estimate (optional)
       ▼
       │  Status: suggesting
       │  Suggestions are anonymous
       │  member.has_suggested = true
       │
┌──────▼───────┐
│  5. VOTE     │  Members allocate points
└──────┬───────┘  - View all suggestions
       │          - Distribute points (e.g., 10 total)
       │          - Can vote on own suggestion
       ▼
       │  Status: voting
       │  Votes are anonymous
       │  member.has_voted = true
       │
┌──────▼───────┐
│  6. RESULTS  │  Winner announced
└──────┬───────┘  - Suggestion with most points wins
       │          - All votes revealed
       │          - Authors revealed
       ▼
       │  Status: completed
       │  Calendar invites sent (future)
       │
┌──────▼───────┐
│  7. HANGOUT  │  Group meets up!
└──────────────┘  - Reminders sent
                   - Photo sharing (future)
```

---

## 🌐 API Architecture

### Endpoint Structure

```
picklejar-api/
├── /                           [GET]  Welcome message
├── /health                     [GET]  Health check
├── /docs                       [GET]  Swagger UI
├── /redoc                      [GET]  ReDoc UI
│
├── /api/picklejars/
│   ├── /                       [POST] Create PickleJar
│   ├── /{id}                   [GET]  Get PickleJar details
│   ├── /{id}                   [PATCH] Update PickleJar
│   ├── /{id}                   [DELETE] Cancel PickleJar
│   ├── /{id}/start-suggesting  [POST] Start suggestion phase
│   ├── /{id}/start-voting      [POST] Start voting phase
│   ├── /{id}/complete          [POST] Complete PickleJar
│   ├── /{id}/stats             [GET]  Get statistics
│   └── /{id}/results           [GET]  Get final results
│
├── /api/members/
│   ├── /{jar_id}/join          [POST] Join PickleJar
│   ├── /{jar_id}/members       [GET]  List members (anon)
│   ├── /{jar_id}/member-by-phone/{phone} [GET] Find member
│   ├── /member/{id}            [GET]  Get member details
│   ├── /member/{id}/display-name [PATCH] Update display name
│   └── /member/{id}            [DELETE] Leave PickleJar
│
├── /api/suggestions/
│   ├── /{jar_id}/suggest       [POST] Submit suggestion
│   ├── /{jar_id}/suggestions   [GET]  List suggestions
│   ├── /suggestion/{id}        [GET]  Get suggestion
│   ├── /suggestion/{id}        [PATCH] Update suggestion
│   └── /suggestion/{id}        [DELETE] Delete suggestion
│
└── /api/votes/
    ├── /{jar_id}/vote          [POST] Submit votes (batch)
    ├── /{jar_id}/votes/{member_id} [GET] Get member's votes
    ├── /{jar_id}/votes/{member_id} [DELETE] Clear votes
    └── /{jar_id}/suggestion/{id}/votes [GET] Vote stats
```

---

## 🔐 Security Model

### Authentication Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATIONLESS ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User       │
└──────┬───────┘
       │
       │  Clicks link: /pj/abc123
       ▼
┌──────────────────┐
│  Frontend        │
│  - Checks local  │
│    storage for   │
│    phone number  │
└──────┬───────────┘
       │
       │  No phone found?
       ▼
┌──────────────────┐
│  Phone Entry     │
│  - Enter phone   │
│  - Optional SMS  │
│    verification  │
└──────┬───────────┘
       │
       │  Store in localStorage
       │  {picklejar_id: "abc123", phone: "+1234567890"}
       ▼
┌──────────────────┐
│  Session Active  │
│  - Send phone +  │
│    jar ID with   │
│    each request  │
└──────────────────┘

Access Control:
- Know the link = can view
- Phone number = can participate
- Member ID = can edit own items
- No passwords or tokens
```

### Data Privacy

| Data Type | Visibility | Revealed When |
|-----------|-----------|---------------|
| Phone numbers | Private | Never shared publicly |
| Suggestions | Anonymous | After voting completes |
| Votes | Anonymous | Point totals visible after voting |
| Display names | Public | Immediately (if provided) |
| Participation status | Public | Real-time (who suggested/voted) |

---

## 🎯 State Machine

### PickleJar Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   PICKLEJAR STATE MACHINE                    │
└─────────────────────────────────────────────────────────────┘

    [SETUP]
       │
       │  POST /start-suggesting
       ▼
  [SUGGESTING]
       │
       │  POST /start-voting
       │  (requires: at least 1 suggestion)
       ▼
    [VOTING]
       │
       │  POST /complete
       ▼
  [COMPLETED]
       │
       │  (terminal state)
       ▼
     [END]

Alternative flows:
- Any state → [CANCELLED] via DELETE
- Auto-transition on deadlines (future)
- Auto-transition when all members complete (future)

State Constraints:
- setup → suggesting: Always allowed
- suggesting → voting: Requires suggestions
- voting → completed: Always allowed
- completed → *: No transitions (terminal)
- * → cancelled: Always allowed
```

---

## 📡 Data Flow Diagrams

### Creating a PickleJar

```
[Browser]                [Frontend]              [Backend]              [Database]
    │                        │                       │                       │
    │  User fills form       │                       │                       │
    ├───────────────────────►│                       │                       │
    │                        │  POST /api/picklejars │                       │
    │                        ├──────────────────────►│                       │
    │                        │  {title, points, ...} │                       │
    │                        │                       │  INSERT picklejar     │
    │                        │                       ├──────────────────────►│
    │                        │                       │                       │
    │                        │                       │  INSERT member (host) │
    │                        │                       ├──────────────────────►│
    │                        │                       │                       │
    │                        │                       │◄──────────────────────┤
    │                        │  {id: "abc123", ...}  │  Return created rows  │
    │                        │◄──────────────────────┤                       │
    │  Redirect to /pj/abc123│                       │                       │
    │◄───────────────────────┤                       │                       │
    │                        │                       │                       │
```

### Submitting a Vote

```
[Browser]                [Frontend]              [Backend]              [Database]
    │                        │                       │                       │
    │  User allocates points │                       │                       │
    │  [Thai: 6, Pizza: 4]   │                       │                       │
    ├───────────────────────►│                       │                       │
    │                        │  Validate points sum  │                       │
    │                        │  (must ≤ 10)          │                       │
    │                        │                       │                       │
    │                        │  POST /api/votes      │                       │
    │                        ├──────────────────────►│                       │
    │                        │  {votes: [...]}       │                       │
    │                        │                       │  Validate phase       │
    │                        │                       │  (must be "voting")   │
    │                        │                       │                       │
    │                        │                       │  DELETE old votes     │
    │                        │                       ├──────────────────────►│
    │                        │                       │                       │
    │                        │                       │  INSERT new votes     │
    │                        │                       ├──────────────────────►│
    │                        │                       │                       │
    │                        │                       │  UPDATE member        │
    │                        │                       │  (has_voted = true)   │
    │                        │                       ├──────────────────────►│
    │                        │                       │                       │
    │                        │  {total: 10, ...}     │◄──────────────────────┤
    │                        │◄──────────────────────┤                       │
    │  Show confirmation     │                       │                       │
    │◄───────────────────────┤                       │                       │
```

---

## 🧩 Component Architecture (Frontend)

### Planned Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   └── Navigation
│   └── Footer
│
├── HomePage
│   ├── Hero
│   ├── HowItWorks
│   └── CreateButton
│
├── CreatePage
│   └── CreatePickleJarForm
│       ├── TitleInput
│       ├── DescriptionInput
│       ├── SettingsSection
│       └── SubmitButton
│
├── PickleJarPage [/pj/:id]
│   ├── PickleJarHeader
│   │   ├── Title
│   │   ├── Status Badge
│   │   └── ShareButton
│   │
│   ├── MemberList
│   │   └── MemberCard (x N)
│   │
│   └── PhaseContent
│       ├── SetupPhase
│       │   └── StartSuggestingButton
│       │
│       ├── SuggestingPhase
│       │   ├── SuggestionForm
│       │   ├── SuggestionList
│       │   │   └── SuggestionCard (x N)
│       │   └── StartVotingButton
│       │
│       ├── VotingPhase
│       │   ├── VoteAllocation
│       │   │   ├── SuggestionCard (x N)
│       │   │   ├── PointSlider
│       │   │   └── PointsRemaining
│       │   └── SubmitVotesButton
│       │
│       └── ResultsPhase
│           ├── WinnerCard
│           ├── ResultsList
│           │   └── ResultCard (x N)
│           └── CalendarButton
│
└── JoinPage
    └── PhoneNumberForm
        ├── PhoneInput
        ├── DisplayNameInput
        └── JoinButton
```

---

## 🔧 Technology Decisions

### Backend: Why FastAPI?

| Feature | Benefit |
|---------|---------|
| **Async Support** | Handle concurrent requests efficiently |
| **Auto Documentation** | Swagger UI generates automatically |
| **Type Safety** | Pydantic models catch errors early |
| **Fast Performance** | One of the fastest Python frameworks |
| **Modern Python** | Uses Python 3.9+ features (type hints) |

### Frontend: Why Next.js?

| Feature | Benefit |
|---------|---------|
| **App Router** | Modern routing with layouts |
| **TypeScript** | Type safety across frontend |
| **Server Components** | Better performance |
| **Built-in Optimization** | Image, font, script optimization |
| **Easy Deployment** | Vercel integration |

### Database: Why SQLite → Supabase?

| Phase | Database | Reason |
|-------|----------|--------|
| **MVP** | SQLite | Zero setup, perfect for development |
| **Production** | Supabase | Hosted PostgreSQL with extras (auth, storage, real-time) |

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Vercel     │         │   Railway    │         │   Supabase   │
│  (Frontend)  │         │  (Backend)   │         │  (Database)  │
├──────────────┤         ├──────────────┤         ├──────────────┤
│              │         │              │         │              │
│  - Next.js   │◄───────►│  - FastAPI   │◄───────►│  PostgreSQL  │
│  - Static    │  HTTPS  │  - Uvicorn   │  SSL    │  - Real-time │
│    files     │         │  - Python    │         │  - Backups   │
│  - CDN       │         │              │         │  - Auth      │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
       └────────────────────────┴────────────────────────┘
                                │
                         ┌──────▼──────┐
                         │   Users     │
                         │  (Browser)  │
                         └─────────────┘

URLs:
- Frontend: https://picklejar.app
- Backend: https://api.picklejar.app
- Database: Internal connection only
```

---

## 📈 Scalability Considerations

### Current Architecture Limits

| Resource | Limit | Mitigation |
|----------|-------|------------|
| SQLite concurrent writes | Low | Migrate to PostgreSQL |
| Single server | 1 instance | Deploy multiple backend instances |
| No caching | N/A | Add Redis for sessions/votes |
| No CDN | N/A | Vercel provides CDN automatically |

### Future Enhancements

```
Phase 1: MVP (Current)
- Single FastAPI instance
- SQLite database
- No caching

Phase 2: Scaling
- Multiple backend instances
- Supabase PostgreSQL
- Redis for caching
- WebSocket for real-time updates

Phase 3: Enterprise
- Load balancer
- Database read replicas
- CDN for assets
- Message queue for notifications
```

---

## 🔍 Monitoring & Observability

### Planned Metrics

```
Application Metrics:
- PickleJars created per day
- Active participants per PickleJar
- Suggestions submitted
- Votes cast
- Completion rate (created → completed)
- Average time per phase

Technical Metrics:
- API response times
- Error rates
- Database query performance
- Frontend page load times
- Mobile vs desktop usage
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          - Full user flows
                 /______\          - Cypress/Playwright
                /        \
               /   API    \        - Endpoint testing
              /   Tests    \       - pytest
             /_____________ \
            /                \
           /   Unit Tests     \   - Function testing
          /    (Backend +      \  - Jest + pytest
         /      Frontend)       \
        /_______________________ \
```

### Test Coverage Goals

| Layer | Coverage Target | Tools |
|-------|----------------|-------|
| Backend Unit | 80%+ | pytest |
| Frontend Unit | 70%+ | Jest + React Testing Library |
| API Integration | 100% of endpoints | pytest + httpx |
| E2E | Critical paths | Playwright |

---

## 📚 Additional Resources

### Architecture Patterns Used

- **RESTful API**: Standard HTTP methods and status codes
- **Repository Pattern**: Database operations abstracted in models
- **DTO Pattern**: Pydantic schemas for data transfer
- **State Machine**: PickleJar status transitions
- **Soft Delete**: Items marked inactive, not removed

### Design Principles

1. **Simplicity**: Minimal steps from idea to execution
2. **Transparency**: Users always know what's happening
3. **Privacy**: Anonymity until appropriate time
4. **Flexibility**: Configurable settings per PickleJar
5. **Scalability**: Architecture supports growth

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** ✅ Complete