# Location Picker Rollout Plan

## Purpose
Create an incremental plan for enabling structured location selection on suggestions so they can be plotted on a shared map, starting with the Supabase schema updates.

## Guiding Principles
- Favor additive schema changes to avoid downtime.
- Keep Supabase as source of truth; synchronize SQLite + SQLAlchemy afterwards.
- Maintain backwards compatibility by keeping existing `location` free-text field until migration completes.
- Ship feature behind a feature flag until end-to-end experience is validated.

## Current State Snapshot
- Suggestions store only a `location` string with no coordinates.
- Map view lacks stable identifiers for plotting suggestions.

## Desired Capabilities
1. Store canonical geospatial metadata from a location picker/autocomplete provider.
2. Allow future filtering/aggregation (distance, clustering) without re-geocoding.
3. Provide enough information to render pins on a client-rendered map.
4. Preserve original human-readable description for display and auditing.

## Data Model Additions (per `suggestions` table)
| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `structured_location` | JSONB | ✅ | Stores normalized payload (name, address, place_id, provider metadata).
| `latitude` | double precision | ✅ | Decimal degrees, SRID 4326.
| `longitude` | double precision | ✅ | Decimal degrees, SRID 4326.
| `map_bounds` | JSONB | ✅ | Optional NE/SW bounds for viewport fitting.
| `geo_source` | text | ✅ | Provider slug (e.g., `mapbox`, `google`).
| `location_confidence` | integer | ✅ | Optional ranking (0-100) from provider.
| `location_last_verified_at` | timestamptz | ✅ | For future revalidation flows.

### Derived/Support Structures
- Create a partial index on (`picklejar_id`, `latitude`, `longitude`) where both coords are not null to accelerate map queries.
- Add a check constraint enforcing lat/long bounds (lat between -90 and 90, lng between -180 and 180).
- Optionally introduce a materialized view later for heatmaps; not part of v1.

## Phase Breakdown
### Phase 0 – Planning (you are here)
- Finalize schema plan with stakeholders.
- Confirm which provider will power autocomplete (likely Mapbox Places).
- Document fallback behavior when structured data is unavailable.

### Phase 1 – Supabase Schema Update
1. Draft SQL in repo under `sql/supabase/20240914_add_structured_location.sql`.
2. SQL should:
   - `ALTER TABLE suggestions ADD COLUMN ...` for each field above.
   - Backfill `structured_location` with `{ "name": location }` when only free text exists.
   - Add the spatial check constraint and partial index.
3. Run SQL in Supabase SQL Editor (or CLI) against production.
4. Export executed SQL and commit to repo for reproducibility.
5. Mirror changes to SQLite (either via raw SQL or SQLAlchemy metadata update) to keep dev env working.

### Phase 2 – Backend Alignment
- Update SQLAlchemy `Suggestion` model to include new columns.
- Extend Pydantic schemas (`SuggestionCreate`, `SuggestionResponse`, etc.) to accept/return structured fields.
- Gate acceptance behind `ENABLE_STRUCTURED_LOCATION` env flag; when disabled, backend ignores structured payload.
- Add validation to ensure lat/long accompany structured payload.
- Update API docs and automated tests to cover the new schema.

### Phase 3 – Location Picker Integration
- Select provider SDK (Mapbox GL JS + Geocoding API likely).
- Build frontend component for suggestion form with autocomplete + map preview.
- Normalize provider response into backend contract before submission.
- Handle manual entry fallback when autocomplete fails.
- Log provider errors to aid debugging.

### Phase 4 – Map Visualization
- Update jar detail page to request suggestions including coordinates.
- Render pins on map (Mapbox/MapLibre) with clustering toggle.
- Provide tooltip linking back to suggestion detail.
- Consider heatmap/overlap view for future iteration.

### Phase 5 – Rollout & Telemetry
- Enable feature flag for internal team jars.
- Monitor Supabase metrics: % of suggestions with coordinates, error rates.
- Add analytics events for picker open, selection, submission.
- Once stable, remove flag and require structured location for new suggestions.

## Risk & Mitigation
| Risk | Mitigation |
| --- | --- |
| API key exposure | Proxy autocomplete requests through backend/Supabase Edge Function; store secrets server-side. |
| Partial data submissions | Keep free-text `location` as fallback; backend accepts structured payload only when complete. |
| Performance impact on queries | Add partial index and query only non-null coordinates for map views. |
| Migration drift between Supabase and SQLite | Commit SQL file + update SQLAlchemy models in same PR; run local migrations in CI. |

## Success Criteria
- ≥90% of new suggestions capture structured coordinates.
- Map view renders pins without manual data massaging.
- Supabase schema + repo migration scripts stay in sync.
- No regression in existing suggestion creation flow.

## Progress (2024-09-14)
- Supabase production schema now includes structured-location columns, lat/lng constraint, and the partial index; the executed SQL lives in `sql/supabase/20240914_add_structured_location.sql`.
- SQLAlchemy `Suggestion` model and Pydantic schemas expose the new fields so local development matches Supabase.
- A backend feature flag (`ENABLE_STRUCTURED_LOCATION`) plus router validation ensures structured payloads are only accepted when the flag is enabled and lat/lng are provided together.
- The frontend `/jar/[id]/suggest` flow now has a Mapbox-powered location picker behind `NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION`, with normalized payload helpers and README env doc updates so devs can test the structured-location data path end to end.

## Next Action Items
1. Capture the decision to defer rebuilding the local SQLite database (production Supabase already reflects the structured-location schema) and note when we'll regenerate the local file alongside upcoming migration work.
2. Expand backend test coverage and API docs to reflect the structured-location contract and feature flag behavior.
3. QA the Mapbox location picker (error/loading states, manual fallback, feature-flag toggles) and prep telemetry so we know when to roll it out beyond internal jars.
4. Design the map visualization update (data fetching contract, clustering rules) in parallel so plotting can follow immediately after picker data flows in.
