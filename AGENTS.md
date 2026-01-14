# PickleJar Documentation Agent Index

This file summarizes the key project docs so you can quickly route questions to the right reference when building, debugging, or onboarding.

## Core Guides
- **`README.md`** – High-level overview, architecture layers (FastAPI + Next.js), workflow from creation to results, backend/frontend stack notes, quick commands, environment settings, and roadmap. Good first stop for understanding the product vision and current state.
- **`DEVELOPMENT.md`** – Deep dive on daily workflow: setup scripts, project structure walkthrough, feature/API/frontend patterns, testing commands, debugging tips, deployment notes, coding style, and security practices. Ideal for developers onboarding or adding new features.
- **`ARCHITECTURE.md`** – Detailed system diagrams, ERD, API map, security model, and technology decisions. Use this to understand the "why" and "how" of the system design.
- **`DEPLOYMENT.md`** – Fly.io deployment guide, database setup, secrets management, and production checklist.

## API & Backend References
- **`API_EXAMPLES.md`** – Extensive curl recipes covering PickleJar creation, member/suggestion/vote flows, stats, and a complete workflow script. Helpful when writing integration tests, frontend API clients, or manual testing.
- **`backend/README.md`** – Backend-specific setup, models, endpoints, database migration path (SQLite → Supabase), configuration table, and testing tips. Use this when touching FastAPI routers, models, or deployment.

## Frontend & UX Guidance
- **`frontend/README.md`** – Frontend stack, key routes (`/`, `/jar/[id]`, subpages), tooling, shared-link API highlights, UX patterns, scripts, and troubleshooting notes. Reference when working on Next.js pages or share-link flow behavior.
- **`PickleJar_UX_Navigation_and_Icons.md`** – Voice/tone, navigation terminology, icon system, layout patterns, CTA wording, accessibility tips, and content review workflow. Use this to keep UI copy and iconography consistent.

---

**How to use this agent index**: Open the relevant markdown above when you need architecture context, implementation detail, API examples, UX direction, or setup commands.