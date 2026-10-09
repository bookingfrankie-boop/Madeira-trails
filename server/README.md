# Madeira Quest API

The API is served by the same Node process as the built Vite site. It uses the existing Railway PostgreSQL service when `DATABASE_URL` is configured. No new Railway service or database is required.

## Runtime
- `npm run build` builds the frontend.
- `npm start` serves `dist/` and the same-origin `/api/*` endpoints.
- Set `DATABASE_URL` on the existing web service to the existing Postgres service's private connection URL before enabling multiplayer. Do not use a public database proxy for service-to-service traffic.
- The server creates/updates the small schema in `schema.sql` on startup. Review migration policy before a production launch.

## API
- `POST /api/auth/register` and `POST /api/auth/login`: username/password authentication; sessions are random tokens stored as SHA-256 hashes and delivered in HttpOnly SameSite cookies. Passwords use Node scrypt.
- `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET /api/game/state`: player stats, global top 20, and activity totals by zone.
- `POST /api/activities`: validates the activity against the Madeira-island bounding box and speed/duration thresholds; computes distance from GPS samples server-side; stores only aggregates and sample count, never the raw GPS route.
- `GET /api/health`: checks database connectivity.

## Limits and caveats
- The bounding box is a broad guardrail, not an official coastline polygon. Zone assignment is estimated by the middle sample's nearest municipal-centre point; it is not a legally or cartographically exact boundary.
- GPS spoofing cannot be eliminated by these heuristics. A production anti-cheat policy needs replay detection, anomaly monitoring, and clear appeal rules.
- There is no email verification or password recovery in this first API cut. Do not describe the account system as production-ready until those flows, CSRF/origin checks, backup/restore, migrations and security testing are implemented.
- This API intentionally does not store route coordinates. Activity payloads carry them only for server-side validation, then they are discarded.
