# UI inventory and journey

## Shared design

Chalk surfaces, walnut/brass accents, dark operational controls, DM Sans body copy and DM Serif headings. Fonts are bundled with their OFL licences. Customer imagery and motion remain in the customer app; staff and driver screens have no decorative video or continuous animation. Status labels, USD prices and Harare timestamps are consistent. Actions include pending, failure and retry states; menu/profile/settings drafts survive failed saves.

## Branch dashboard

| Destination | Before | Implemented data/actions |
| --- | --- | --- |
| Sign-in | No staff gate | Invited account, role check, expiry and sign-out |
| Overview | Sample counts and queue | Status counts, active orders, links into filtered Orders |
| Orders | Unauthenticated API operations | Branch-scoped search/filter/detail, preparation, rejection/cancellation, dispatch and cash-confirmed pickup |
| Menu | In-memory edits | Persisted Food/Drinks categories, prices, availability and stable variants |
| Drivers | Sample roster/assignments | Branch roster, availability, active and unclaimed requests |
| History | Placeholder | Paginated terminal orders, date/status/number filters and status events |
| Settings | Placeholder | Branch contact/address and accepting-orders control |

Desktop sidebar becomes a mobile drawer. Orders switch from rows to compact cards on narrow screens. Dialogs use native modal focus containment and Escape handling.

## Driver app

| Destination | Before | Implemented data/actions |
| --- | --- | --- |
| Sign-in | Hard-coded driver identity | Authenticated Expo Router gate and SecureStore on native |
| Home | Partial API, local availability | Account identity, persisted availability, current job and branch requests |
| Deliveries | Code-based calls | Available/active/completed jobs, detail, confirmation, valid next actions, external maps |
| Earnings | Real deliveries plus invented history | Server totals from completed jobs; earned versus payout distinction |
| Profile | Alert-only actions/local switches | Persisted contact details, branch information, availability and sign-out |

## Customer integration

Home/Search/Restaurant use the selected venue menu in connected mode. Food detail uses stored options, item/variant IDs and the selected branch. Venue changes clear the previous cart. Checkout supports delivery or pickup, cash only, authoritative-price checks and safe retries. UI preview retains sample food customization and explicitly blocks order creation. The visual Bar catalogue remains illustrative and has no purchase action.

## Primary journeys

Delivery: customer signs in → selects venue → reviews menu/options → cart → address/cash → submits → staff prepares → marks ready → requests driver → driver accepts → arrives → collects → travels → confirms delivery/cash → customer tracking and staff history show completion → driver earnings update.

Pickup: customer selects venue/menu → cart → branch collection/cash → submits → staff prepares → marks ready → confirms handover/cash → customer and staff history show completion. No delivery request or driver earning is created.

## Ownership and interface boundaries

UI code owns presentation, input, navigation, accessible controls and request feedback. Express owns authenticated identity and branch scoping. PostgreSQL owns prices, valid transitions, idempotency, claim uniqueness and transaction consistency. Credentials and role assignment remain administrative/server responsibilities.
