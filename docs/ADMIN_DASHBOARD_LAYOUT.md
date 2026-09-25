# Organizer dashboard

The responsive dashboard at `/game/[slug]/admin` contains:

- Event name, refresh action, and link to the public registration page.
- Three summary cards: total participants, team count, and registration status.
- Per-team participant counts and distribution bars.
- A participant invite link with clipboard copying and a manual-copy fallback.
- Explicit open/close registration controls.
- Sign out.

Data is loaded from the authenticated stats endpoint. An expired or invalid session redirects to login. Loading, no-participant, failed-load, refresh, save, copy, and logout states all have dedicated feedback. Failed status updates preserve the last confirmed server state.

At desktop widths, distribution and organizer controls occupy two columns. On mobile they stack, and header actions wrap. Custom team colors appear in bars; names and percentages remain readable independently of color.
