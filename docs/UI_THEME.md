# Gamehouse UI

The app uses a shared visual system in `app/globals.css` and reusable controls in `app/components/ui.tsx`.

| Token | Value   | Use                       |
| ----- | ------- | ------------------------- |
| Paper | #f7f8f2 | Page background           |
| Ink   | #182c27 | Main text                 |
| Muted | #65716b | Supporting text           |
| Green | #244d3b | Primary actions           |
| Lime  | #d6ef85 | Emphasis on dark surfaces |
| Line  | #dfe4da | Borders                   |
| Error | #ad332b | Validation feedback       |

Use Arial/Helvetica for the interface and Georgia italic for the landing headline accent. Cards use a subtle border, restrained shadows, and generous spacing. Event colors appear as accents, while text and primary buttons retain reliable contrast.

Forms use visible associated labels, inline validation, persistent input values after failure, password visibility controls, Caps Lock hints, and clear busy/disabled states. Request failures use an accessible native dialog with focus restoration and Escape dismissal. Page-level failures use a recovery panel with a retry or navigation action.

Layouts adapt from 320px to desktop. The landing illustration is built in HTML/CSS. Motion respects the reduced-motion preference. Controls have visible keyboard focus and a skip-to-content link.
