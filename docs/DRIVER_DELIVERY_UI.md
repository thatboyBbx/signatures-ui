# Driver app — UI change log

Research and rules: `docs/DRIVER_UI_RESEARCH.md`. Screenshots: `docs/previews/driver/`.
Backup of the previous UI: `apps/driver_app/.cache/ui-polish-backup/`. Work is local and uncommitted.

## Preview

```
cd apps/driver_app
EXPO_PUBLIC_UI_PREVIEW=1 npx expo start --web --port 8082
```

Preview mode starts signed in with sample requests and history (`src/operations/preview.ts`); every action changes local state only and never calls the API. Without the flag the app uses the live API exactly as before.

## 2026-11-22 — Redesign

**Structure**
- Tabs 4 → 3, text only: **Shift · Earnings · Profile**. `deliveries` route kept as a redirect to Shift.
- Shift switches between: Offline → Online with requests → Active job → Done.
- Repeated brand header, "Driver operations" eyebrow, subtitle sentences and the Refresh button removed from every screen. Data still refreshes every 15 s, on focus and after every action.

**Backend coverage (nothing dropped)**
- Sign in / sign out, session restore and expiry.
- Online/offline (`PATCH /driver/profile is_online`) on Shift and in Profile.
- Available requests → `POST /accept`; active job → each `PATCH /status` step: arrived_at_restaurant, picked_up, on_the_way, delivered with `cashCollected: true`.
- Completed deliveries and earnings: today, week and all-time.
- Profile edit (name, phone), driver code, branch name, address and phone, email.
- Newly shown (they were already returned by the API): distance_km, estimated_minutes, order notes, customer phone, delivered_at times.

**Added beyond the backend (UI only)**
- Swipe to accept and swipe "order in hand"; hold to confirm cash collected + delivered. Every other step is a single tap.
- Job stepper: Collect → Deliver → Hand over.
- Call branch / Call customer / Open in Maps on the address rows.
- Bag checklist at the restaurant (local ticks).
- Hand-over screen: large cash amount plus change helper (Exact or the next note values).
- "Problem with this order?" sheet: reason list → Call branch, plus Call customer for customer-related reasons. It doesn't send a report; there's no endpoint for that yet.
- Decline hides a request on this device only.
- Done screen: amount earned, cash collected, today's total.
- Earnings: cash collected for orders shown separately from earnings; trip list grouped by day.
- Connection banner when the API can't be reached.

**Design system**
- `src/theme/theme.ts` now uses the customer app's tokens (cream, espresso, DM Serif / DM Sans). Gold is used on espresso only, because gold on cream is 1.8:1.
- Fonts 500/600/700 and Serif Italic copied in from the customer app.
- Touch targets ≥ 48 pt; main actions 56–60 pt, at the bottom of the screen.

**Checks**
- `tsc --noEmit` clean; `expo lint` clean. One `react-hooks/refs` line is disabled in `ui.tsx` (a false positive: the ref is only read inside gesture callbacks).
- Full flow run in a web preview: accept → arrived → order in hand → start → at door → hold → done → offline → earnings → profile → sign out. No console errors.

## Open
- No haptics or keep-awake yet (`expo-haptics`, `expo-keep-awake` aren't installed).
- Offline queueing of steps isn't built; the banner only reports a lost connection.
- No backend for request expiry, so requests show their age ("2 min ago") instead of a countdown.
- Problem reports and declines aren't stored on the server.
- Not tested on a phone yet.
