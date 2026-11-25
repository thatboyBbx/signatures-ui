# Branch dashboard — UI/UX redesign

Built from `docs/BRANCH_UI_RESEARCH.md`. UI only: every call still goes to the same Express endpoints, with the same bodies. Screenshots are in `docs/previews/branch/`.

## What changed

**One live Service board** replaces Overview + Orders. There are four columns that follow the backend states:

| Column | Order status | Card action |
|---|---|---|
| New | `confirmed` | **Accept** (→ preparing). Reject is in the panel, behind a confirm |
| Preparing | `preparing` | **Ready**. On delivery orders this also requests a driver (`PATCH ready` then `POST dispatch`) |
| Ready | `ready` | Pickup: **hold to confirm** "handed over, cash in" (→ completed). Delivery: **Request driver** (only if the automatic request failed) |
| Driver | `awaiting_driver`, `driver_assigned` | None. Shows Finding a driver → *Name* coming → *Name* is here → *Name* has it |

- Orders leave the board at `on_the_way` (shown under Drivers) or when closed (shown under History).
- **Each card:** a 4-character code (last 4 of the order number) in large serif type, a timer for the current stage, delivery/pickup, item count and the customer note.
- **Timer colours:** amber, then red with a red border, once a stage runs long. Limits in minutes: New 1/3, Preparing 15/25, Ready 10/20, Finding a driver 5/10, Driver at the counter 3/6. They're set in `thresholds` in `src/ui/lib.ts`.
- **Oldest first** in every column.
- **New orders cannot be missed.** An unopened order is a dark espresso card, it plays a two-tone chime, and the chime **repeats every 8 s** until someone opens or accepts it. The tab title shows the count. The board stays mounted, so the chime also works from Menu, Drivers and the other views. Browsers only allow sound after a tap: the top bar says "Tap for sound" until then.
- **Side panel** (not a modal) shows:
  - customer and Call link, address, the note in a highlighted box, items, totals and cash status
  - the driver block with a Call link, plus "Match the code with the driver" when the driver is at the counter
  - the status timeline, a print ticket button (small 72 mm bag ticket) and Reject/Cancel in a separate two-step confirm
- **Top bar (espresso):** branch name ("CBD", not the full brand), text-only tabs, Live/Offline, Sound on/off, and a **Taking orders** switch.
  - When paused, a full-width banner shows with a **Resume** button.
  - If refresh fails, a banner says "Connection lost, showing the board from hh:mm" and actions are disabled until it reconnects.
- **Refresh rates:** the board refreshes every 5 s (was 15 s) and reads every page of active orders (the API pages by 25). Actions update the card straight away and roll back with the backend's message if they fail.

**Menu:** items grouped by category, each with an **Available / Sold out switch** (one tap, re-saves the item). There's a Sold out filter with a count. The full editor opens in the side panel.

**Drivers:** a "Waiting for a driver" list, then On a job (code, stage, time), Free and Offline, each with a tap-to-call phone number.

**History:** search by order number, status, date range (defaults to today), 25 per page. Tap a row for the read-only panel.

**Branch:** phone and collection address, test the sound, sign out.

**Sign in:** espresso brand panel + plain form. Driver accounts are refused with a message pointing to the driver app.

**Layouts:**
- Landscape tablet / desktop: 4 columns
- Under 860 px: the nav moves to a second row, and the board turns into stage tabs (New · Preparing · Ready · Driver, with counts) showing one column at a time

## Files

- `src/App.tsx`: shell (sign-in, top bar, banners, view switch)
- `src/App.css`: new stylesheet (tokens shared with the driver app)
- `src/ui/Board.tsx`: Service board, ticket, order panel
- `src/ui/Views.tsx`: Sign in, Menu, Drivers, History, Branch
- `src/ui/controls.tsx`: hold button, switch, side panel, two-step confirm
- `src/ui/actions.ts`: card actions mapped to API calls
- `src/ui/lib.ts`: timers, thresholds, polling hook, chime
- `src/operations/api.ts`: types extended (`deliveries`, timestamps) and a preview hook
- `src/operations/preview.ts`: preview data only (see below)
- Old files are backed up in `apps/branch_dashboard/.cache/ui-polish-backup/`.
- `src/features/*` and `src/services/*` are untouched. They're an older version that nothing imports.

## Preview without the backend

```powershell
cd apps\branch_dashboard
$env:VITE_UI_PREVIEW=1; npm.cmd run dev
```

Any email and password signs in. The data follows the backend's status rules, a new order arrives about every 75 s, and a free driver accepts requested deliveries after ~1.5 min. The preview data isn't included in the normal build.

## Not done (needs the backend, see research §5)

- Cancel or retry an order stuck in `awaiting_driver`; cancel a `ready` pickup no-show
- Request a driver while still `preparing`
- Rejection / cancel reasons; timed pause; manual driver assignment
- The driver app should show the same 4-character code large at pickup. Right now it shows the full order number.
