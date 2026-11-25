# Branch dashboard — UI research & workflow

Groundwork for the branch dashboard redesign. It uses the same design system as the customer and driver apps, but it's built for a counter screen in a busy kitchen. Every view answers one question: **which order needs a hand right now?**

## 0. What we're designing against (current build)

**What the backend allows (staff role, `backend/src/modules/operations`):**

| Endpoint | What it does |
|---|---|
| `GET /operations/me` | Staff identity + branch record |
| `GET /operations/overview` | Count of active orders per status |
| `GET /operations/orders` | Active or history (`history=1`), filter by status, search by order number, date range (history), 25 per page. Includes items, delivery + driver, and every status event with time and actor |
| `PATCH /operations/orders/:number/status` | `confirmed → preparing / rejected`, `preparing → ready / cancelled`, `ready (pickup) → completed` (needs `cashCollected`) |
| `POST /operations/orders/:number/dispatch` | `ready (delivery) → awaiting_driver`. Creates the delivery and offers it to **every online driver** at the branch |
| `GET / POST /operations/menu` | List / create / edit items (Food or Drinks, category, price, up to 20 options, available on/off). No delete |
| `GET /operations/drivers` | Branch drivers (online, available/busy, phone) + active deliveries |
| `PATCH /operations/branch` | Phone, collection address, **accepting orders** on/off. Fees, `is_open` and accounts stay with the admin |

**The full order life, end to end:**

```
Customer places order ─► confirmed
  Branch:  confirmed ─► preparing ─► ready
           confirmed ─► rejected      preparing ─► cancelled
  Pickup:  ready ─► completed (cash confirmed at counter)
  Delivery: ready ─► [Request driver] ─► awaiting_driver
  Driver:  accepts ─► driver_assigned      (delivery: heading_to_restaurant)
           arrives ─► still driver_assigned (delivery: arrived_at_restaurant)
           picks up ─► still driver_assigned (delivery: picked_up)
           leaves   ─► on_the_way
           hands over + cash ─► delivered
```

Every step writes an `order_events` row with a timestamp. That gives us **order age, prep time and driver wait time without any backend change.**

**Pilot limits:** cash only, no push or sockets (the dashboard polls every 15 s), no printing, no prep-time or ETA fields, no rejection reasons, no manual driver assignment.

**Current UI:** sidebar with Overview / Orders / History / Menu / Drivers / Branch. Orders is a table. Every action happens inside a modal. Each page has a slogan heading ("The service, at a glance.") plus an intro sentence. There's no sound for new orders, no timers and no sense of what's late. `src/features/*` (≈3,100 lines) is an older version that `App.tsx` no longer imports.

## 1. Core principles

1. **The board is the app.** One live screen in columns, like a ticket rail. Everything else (menu, drivers, history, branch) is secondary.
2. **Readable from a step back.** Order codes, timers and counts are big enough to read at arm's length on a counter tablet. Size type for the real viewing distance, not for the laptop it was designed on.
3. **Age is the priority signal.** Each ticket shows how long it has sat in its stage. The colour shifts once it's late, so nobody has to read times to know what's urgent.
4. **New orders cannot be missed.** A sound plays and **keeps repeating** until someone opens the order. A clear banner shows when the screen has lost connection.
5. **One tap per step, on the card.** No modal needed for the common path. Deliberate confirmation only where money or a customer is affected (reject, cancel, cash handover).
6. **Calm.** Flat colours, no gradients, no pulsing, no decorative icons, no slogans. Colour is reserved for state.

## 2. Workflow → screen (the core of the redesign)

**Main screen: Service board.** It has four columns that follow the backend states exactly:

| Column | Backend status | What the ticket shows | The one action |
|---|---|---|---|
| **New** | `confirmed` | Code, age, Delivery/Pickup, item count, note flag | **Accept** (→ preparing) · Reject |
| **Preparing** | `preparing` | Code, time in prep, items | **Ready** |
| **Ready** | `ready` | Pickup: customer name · Delivery: "No driver yet" | Pickup: **Hand over** (confirm cash) · Delivery: **Request driver** |
| **Driver** | `awaiting_driver`, `driver_assigned` | Searching (time) → Driver name + "coming" → "**Here · 4 min**" → "Collected" | Call driver · open order |

- An order leaves the board when it reaches `on_the_way`, `completed`, `rejected` or `cancelled`. It then lives in **History**.
- Opening a ticket shows a **side panel, not a modal**: items with options, customer note (highlighted), phone (tap to call), address, the status timeline and the same action button.
- **Top bar:** branch name · **Accepting orders** switch · connection/last-updated · sound on/off.
- **Secondary views:** Menu · Drivers · History · Branch.

**Menu during service:** a fast list with an **available switch per item**. Running out of something mid-shift takes one tap, which is how the big platforms handle it. The full editor stays for name, price and options. This is UI-only: the switch re-saves the item with `available: false`.

**Drivers:** online / busy / offline at the top, and each active delivery with its stage and wait time. Read-only, because the backend has no assign or reassign.

**Handover check:** the ticket and the driver app show the same **short code** (the last 4 characters of the order number) in large type. The counter matches the code before handing over the bag. Big platforms do this with a QR code or order number on the receipt to stop wrong-bag pickups. Ours is a visual match only, so no backend change is needed.

## 3. Checklists

**Every ticket**
- [ ] Short code large, full number in the panel
- [ ] Time in current stage, counting up; colour shifts at thresholds (suggested: New 2 min, Preparing 20 min, Driver waiting 5 min)
- [ ] Delivery / Pickup written as a word
- [ ] Item count; notes flagged
- [ ] One primary action button

**Board**
- [ ] Repeating chime + New column count while any order is unopened
- [ ] Offline banner whenever the last refresh failed; actions disabled while offline
- [ ] Faster polling on the board (≈5 s) to keep alerts timely; keep 15 s elsewhere
- [ ] Empty columns say nothing more than "None"
- [ ] Accepting-orders switch always visible; paused state obvious across the whole top bar

**Actions**
- [ ] Reject / Cancel: confirm step, red, never next to the primary button
- [ ] Hand over (pickup): hold to confirm "Cash collected"
- [ ] After any action the card moves immediately (optimistic) and rolls back on error with the backend's message
- [ ] Idempotent: double taps are safe because the backend returns the current state, but still disable the button while busy

**States to design:** first load · empty service · connection lost · branch paused · action failed · signed out / expired session.

## 4. Common mistakes (seen in other platforms, avoid)

- **Silent or quiet new-order alerts.** This is the most common merchant complaint. A single faint beep gets missed during a rush.
- **Alerts only on one page.** Some platforms only ring while the Orders page is open. Our board is the home screen, and the chime must work from any view.
- **Watching two screens / re-keying.** Every order type (delivery and pickup) goes in one queue.
- **Modal for every step.** It slows the line down. Do the action on the card and keep the panel for details.
- **Hidden notes and allergies.** Mods and notes must stand out, not sit in grey small print.
- **Tables for live service.** Rows don't show urgency. Columns plus age do.
- **Small type and low contrast.** Dark-grey-on-grey and fancy scripts fail in kitchen light. Gold on cream is too faint (we already learnt this in the driver app).
- **No undo-safe confirmations.** Reject sitting right next to Accept.

## 5. Gaps between research and backend

Ranked by how much they hurt service. **UI-only** means doable now. **Backend** means it needs a change (for the backend team, not part of the UI work).

| # | Gap | Effect | Fix |
|---|---|---|---|
| 1 | Orders stuck in `awaiting_driver`: no driver accepts and staff can't cancel or retry | Order sits forever | **Backend:** allow cancel/retry from `awaiting_driver` and `ready` |
| 2 | A ready pickup can't be cancelled (no-show) | Board fills with ghosts | **Backend:** allow `ready → cancelled` |
| 3 | Driver can only be requested once the food is ready | Food waits for the driver to travel in | **Backend:** allow dispatch from `preparing` (common practice). UI meanwhile: *Ready* + *Request driver* as one action for delivery orders |
| 4 | No rejection or cancel reason | Customer sees a bare "Rejected" | **Backend:** a reason field. UI: pick a reason (Item out, Too busy, Closing) once it exists |
| 5 | No new-order push; 15 s polling | Late alerts | **UI-only:** 5 s polling on the board + repeating chime |
| 6 | No timed pause / busy mode | Staff forget to switch orders back on | **UI-only:** reminder banner while paused. **Backend:** pause-until time |
| 7 | No prep-time / ETA fields | Customer ETA is a guess | **UI-only:** timers from events. **Backend:** prep minutes per order later |
| 8 | No manual assign / reassign | Can't move a job off a no-show driver | **Backend** (later, maybe admin) |
| 9 | No printing | Bag has no label | **UI-only:** browser print of a small ticket (code, name, items) |
| 10 | Menu items can't be deleted | Menu clutter | Hide with *unavailable* for now; delete is admin territory |

## 6. Design system carry-over

- **Colours:** cream ground, espresso text and surfaces, flat state colours used only for state: new, late, paused, error. No gradients.
- **Type:** DM Serif Display for the branch name and big numbers (codes, counts, timers); DM Sans for everything else. Body text no smaller than 15–16 px on the board.
- **Gold:** only on espresso surfaces (top bar), never on cream.
- **Icons:** none in navigation (text only, like the driver tabs); only where a symbol beats a word (call, sound).
- **Copy:** "CBD", not "Paramount Signature · CBD". No page slogans or intro sentences.
- **Layout:** landscape tablet first (≈1024–1366 px), works on desktop, collapses to a single column with stage tabs on a phone.

## Sources
- Toast KDS overview (age-coloured headers, flash on new/changed): https://doc.toasttab.com/doc/platformguide/platformKDSOverview.html
- DoorDash: What is a KDS — features, workflow, mistakes: https://merchants.doordash.com/en-us/blog/what-is-kds
- Uber Eats Orders app guide (new-order sound/flash, out of stock, delay, courier tracking): https://merchants.ubereats.com/se/en/resources/learning-center/uber-eats-orders-app/
- Uber Eats: automatic pausing & busy mode: https://www.uber.com/nz/en/blog/automatic-pausing-for-merchants
- Square: order timing, pause & busy mode: https://squareup.com/help/us/en/article/8325-manage-order-timing-with-square
- Otter: missed orders, auto-accept, distinct cancel sounds: https://helpdesk.tryotter.com/hc/en-gb/articles/360051897054-How-will-my-order-notifications-appear
- Wix Restaurants: repeating alert until acknowledged: https://support.wix.com/en/article/wix-restaurants-managing-notifications-for-online-orders
- Uber Eats: QR codes on receipts to stop wrong-bag pickups: https://www.uber.com/en-NZ/blog/adding-qr-codes-to-uber-eats-order-receipts
- Yandex Eats: courier handover code: https://yandex.com/support/eats-vendor-ge/en/orders/transfer
- Bank of America / NCR KDS timer thresholds (blue → yellow → red): https://merchanthelp.bankofamerica.com/Kitchen-Display-Order-Management
- Qt: size text for real viewing distance: https://www.qt.io/software-insights/embedded-ux-design-principles-design-for-the-conditions-of-use
