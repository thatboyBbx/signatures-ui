# Driver app — UI research & rules

Groundwork for the driver app redesign. Same design system as the customer app, but the opposite priority: the customer app is cinematic, the driver app is a tool. Every screen answers one question: **what do I do next?**

## 0. What we're designing against (current build)

- Flow already in the backend: **Accept → Heading to restaurant → Arrived → Picked up → On the way → Delivered** (with cash confirmation).
- Pilot limits: no GPS tracking, no push notifications, no payouts, **cash only**, data refreshes every 15 s + after every action.
- Current screens: Sign in, Home (online toggle, today's earnings, current job, 3 requests), Deliveries (Available / Active / Completed), Earnings (today / week), Profile.
- Current problems: every screen repeats the brand block + "DRIVER OPERATIONS" + a subtitle sentence + a Refresh button; the active job is a card among cards; order details are hidden behind a toggle; one confirm modal style for every step; no countdown or distance on requests; nothing tells the driver what the *next* step is at a glance.

## 1. Core principles

1. **One screen, one job, one big button.** The next action is the largest thing on screen and sits in the bottom third (thumb zone).
2. **Glance, don't read.** The driver is on a motorbike, in sun, one hand. Numbers and names over sentences. If it needs a paragraph, it's wrong.
3. **The active delivery owns the app.** While a job is live, Home *is* the job. No feeds, no stats competing with it.
4. **Deliberate where it costs money.** Accept and Complete (cash) can't fire by a bump: swipe or press-and-hold, not a tap. Everything else is a plain tap.
5. **Never lie about state.** Online/offline, "saved", "waiting for signal" must always be visible and true.
6. **Calm.** Flat colour, no gradients, no pulsing, no decorative icons (house rule from the customer app).

## 2. Workflow → screens

| Stage | Screen | The one action |
|---|---|---|
| Off shift | **Home · Offline** | Go online |
| Waiting | **Home · Online** (requests list, quiet) | Open a request |
| Request | **Request sheet** — earning, pickup → drop-off, distances, items count, cash total, timer | Swipe to accept / Decline |
| To restaurant | **Job · Collect** — branch name, address, call branch, open in Maps | I've arrived |
| At restaurant | **Job · Collect** — order number large, item checklist | Swipe: Order collected |
| To customer | **Job · Deliver** — customer name, address + landmark note, call, Maps | I've arrived (optional) / Start |
| Hand-over | **Job · Hand over** — **CASH TO COLLECT $xx.xx** huge, change hint | Hold: Cash collected · Delivered |
| Done | **Done** — earned, next | Back to requests |
| Issue | **Problem sheet** — reason list (can't reach customer, wrong address, order not ready, other) | Report |
| Records | **Earnings** — today / week, list of trips, cash handled | — |
| Account | **Profile** — name, phone, branch, sign out | — |

Tabs drop from 4 to **3: Shift · Earnings · Profile**. "Deliveries" merges into Shift (requests + active job) and Earnings (completed history).

## 3. Checklists

**Every screen**
- [ ] Primary action ≥ 56 pt tall, full width, bottom of screen, above the tab bar
- [ ] All touch targets ≥ 48 pt with ≥ 8 pt spacing (Apple 44 pt / Material 48 dp are the floor, not the goal)
- [ ] Body text ≥ 15 pt, key values (amount, order no., address) ≥ 20 pt
- [ ] Contrast ≥ 4.5:1 for all text; prefer 7:1 for primary values (sunlight)
- [ ] Online/offline + connection state visible without scrolling
- [ ] "Last updated" only when stale (> 30 s), not always
- [ ] No more than one card style per screen; no nested cards
- [ ] Loading = skeleton of the same layout, not a spinner in empty space
- [ ] Error text says what to do ("No signal — we'll retry. Your step is saved."), never raw messages

**Request card**
- [ ] Earning first and biggest
- [ ] Pickup → drop-off as a two-stop line with area/landmark names
- [ ] Distance to branch + trip distance (when available)
- [ ] Item count and cash total (driver needs to know they'll carry $XX)
- [ ] Visible countdown, not just a timeout
- [ ] Same fields in the same place on every request
- [ ] Decline is secondary and never adjacent to Accept at the same size

**Active job**
- [ ] Stepper with the current stage (Collect → Deliver → Hand over); past steps quiet, future steps muted
- [ ] Call and Maps as plain text buttons on the address row
- [ ] Customer delivery note shown in full, never truncated
- [ ] Cash amount impossible to miss at hand-over
- [ ] Problem link always reachable, never a primary button

**Done / Earnings**
- [ ] Earned amount + trip count; cash handled shown **separately** from earnings
- [ ] Plain list, newest first; no charts until there's real data to justify one

## 4. Common mistakes (seen in other apps, avoid)

- Cluttered home that buries the next action under stats and promo cards.
- Small targets and tap-to-complete that fire by accident on a bumpy road.
- Low contrast pastel UI that washes out in sun (our gold `#C6A77E` on cream is **1.8:1** — gold is for dark surfaces only).
- Assuming constant signal — screen goes blank or step is lost in a dead zone.
- Hiding the full drop-off address or payout until after accepting.
- Too little time to read an offer while riding.
- Showing cash collected as if it were earnings (confuses the driver's own money with the restaurant's).
- Confirm modals for everything → drivers stop reading them. Use deliberate gestures for the 2 risky steps, nothing for the rest.
- Asking drivers to confirm pickup before the order is in their hands — label it "Order in hand", not "Picked up".
- Chat-first support. Drivers on bikes need **Call branch** / **Call customer**, one tap.

## 5. Unwritten frontend rules for driver apps

- Bottom-heavy layout: info top, action bottom. Nothing important in the top-left corner (hardest to reach one-handed).
- Status words are verbs for the *next* step on buttons ("I've arrived"), nouns for the *current* state in labels ("At restaurant").
- Money always with currency and 2 decimals (`$2.50`), tabular numerals so amounts don't jump.
- Order number in big type on the collect screen — staff ask for it.
- Phone numbers are buttons, not text.
- Addresses: area first (Avondale), then street. Harare addresses rely on landmarks — keep the note field prominent.
- Never auto-advance a step without the driver's action; never block an action behind a toast.
- Optimistic UI: show the next step immediately, sync in background, mark "Saving…" until confirmed.
- Haptic tick on every confirmed step (native only).
- Night use matters (Hatfield runs to 05:00): don't ship bright white surfaces at full luminance.
- Keep the screen awake on the active job screen.

## 6. Design system carry-over

From `customer-mobile/src/theme/theme.ts`, unchanged: DM Serif Display (headings, amounts), DM Sans (everything else), cream `#EAE3D6` background, surface `#F4EEE3`, text `#30251C`, espresso CTA `#2B1E14`, gold `#C6A77E` (on espresso only), radius 2–14.

Driver-specific adjustments:
- **Contrast checked:** text on cream 11.7:1 ✓; secondary `#78604A` on cream 4.6:1 (body ok, not for small captions) ✓; cream text on espresso 14.8:1 ✓; gold on espresso 7.1:1 ✓; gold on cream 1.8:1 ✗.
- **Status colours** (flat, text-safe on surface): success `#466338` 5.9:1, warning `#8C5F20` 4.8:1, error `#A53D28` 5.5:1.
- Bigger type scale: key value 28–34 serif, label 13 semibold caps-free.
- No video heroes, no photography. The brand shows up only in type and colour.
- Online = espresso bar with gold text; Offline = cream with outline. State is colour + word, never colour alone.

## 7. Take / skip from the Pinterest reference

Take: the single full-width accept button with the countdown inside it; the two-stop pickup → drop-off line with distances; earnings as one big number; Online/Offline pill; the radio-list reason sheet for problems.
Skip: green palette, the bar chart (no data yet), in-app chat (no backend, unsafe on a bike), map-first screens (no GPS in this pilot).

## Sources

- vp0.com — Delivery Driver Route App UI: Built for One Hand
- Baymard Institute — Handling accidental taps on touch devices
- Postmates Fleet redesign case study (UX Collective / Bootcamp)
- arXiv 2406.10768 — worker-generated design improvements for gig driver apps
- Uber Engineering — Optimistic Mode; Scaling cash payments in Uber Eats; Uber cash delivery help pages
- DoorDash — reduced notifications / one-tap messaging while driving (TechCrunch)
- Grab — delivery guide (accept window), driver timeout
- Google / Android for Cars — visual principles (glanceability, 4.5:1 contrast, touch targets)
- Qt — Embedded UX: design for the conditions of use (glare, gloves, divided attention)
