# Gamehouse

A Next.js 16 app for creating events and assigning participants to balanced teams.

## Run locally

Requires Node.js 20.9+ and MongoDB 7+.

1. Run `npm install`.
2. Copy `env.template` to `.env.local` and set `MONGODB_URI`.
3. Optionally set a long, random `ADMIN_SESSION_SECRET` in production. If omitted, sessions use each event’s salted password hash as the signing key.
4. Run `npm run dev` and open http://localhost:3000.

Event creation collects an organizer email and an admin password. The organizer logs in once with those credentials to use the unified workspace. Password recovery is not implemented.

## Flows

- **Home:** responsive introduction plus create-event and organizer-login links.
- **Create:** event name, shareable slug, description, organizer email, password confirmation, two participant-page theme colors, 2–20 teams, optional team links, and a live preview.
- **Registration:** name and email collection, validation, balanced assignment, browser lock, rate limiting, and recovery of a previous assignment.
- **Result:** assigned team, optional team link, saved results, and retry/missing-result states.
- **Organizer login:** email and password fields, password visibility, busy state, and accessible error dialog.
- **Workspace:** `/admin` lists the organizer's events; creation opens the new event dashboard immediately. The dashboard provides participant CRUD, duplicate-name warnings, event settings, team editing, invite copying, registration controls, and sign out.

New events collect name and email. Existing database-defined text, email, number, and select fields remain supported. Select fields can define an `options` array.

Passwords are hashed with scrypt. Successful login upgrades legacy plaintext event passwords and assigns an organizer email to older events that do not have one. Signed, expiring HTTP-only cookies protect organizer endpoints; old static authorization cookies are no longer accepted. Public event responses exclude passwords and allocation locks.

Allocation uses a per-event database lease to serialize normal concurrent registrations. The lease expires after 30 seconds if a server crashes; busy requests ask the participant to retry. Email addresses are trimmed and lowercased before checking for duplicates. A server-stored browser token prevents repeat joins from the same browser, the registration endpoint applies a 20-per-hour connection limit per event, and a hidden bot field rejects automated submissions. Existing historical email values are not rewritten automatically.

## Validation

- `npm run typecheck`: TypeScript checks.
- `npm run build`: production build.
- `npm run test:e2e`: integration/browser checks against the existing production build.
- `npm test`: build, then run the full end-to-end suite.
- `npm run format`: format source files.

Tests start a disposable MongoDB instance and a separate Next.js server on port 3100. They never use the configured production database. The first run downloads MongoDB 7.0.14 if it is not cached. Set `MONGOMS_SYSTEM_BINARY` to an existing compatible `mongod` executable to skip the download.

The browser tests use installed Microsoft Edge by default. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. Test screenshots and results are written to `artifacts/` (ignored by Git). The suite covers creation, form validation, login, secret exclusion, forged-cookie rejection, registration, normalized duplicates, concurrent assignment, registration controls, network recovery, sign out, and every page at four viewport widths.

## Routes

| Route                      | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `/`                        | Landing page                                                     |
| `/create`                  | Create event                                                     |
| `/login`                   | Organizer email-and-password login                               |
| `/game/[slug]`             | Public registration                                              |
| `/game/[slug]/result`      | Team result                                                      |
| `/admin`                   | Organizer workspace and event management (`/admin?event=[slug]`) |
| `/game/[slug]/admin/login` | Event-specific email-and-password recovery login                 |
| `/game/[slug]/admin`       | Legacy compatibility redirect to `/admin?event=[slug]`           |

API routes live under `/api/game`. Event creation is `POST /api/game`; per-event endpoints provide public info, registration, login/logout, statistics, and registration status updates.
