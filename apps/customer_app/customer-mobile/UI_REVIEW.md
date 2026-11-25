# Hosted-reference customer UI review — 1 November 2026

## Venue title-only ETRIXO treatment — 7 November 2026

- Removed the venue-card subtitle, storefront icon and decorative arrow. The full-width title is centered, bold and uppercase, using ETRIXO Demo only in UI preview mode and only on this card.
- Title size follows measured card width; the default label uses two lines below 500 points and one line on wider cards. Selected venue names remain uppercase and can wrap without clipping. The existing Venue navigation action and selected-venue state are preserved.
- The original ETRIXO demo license is retained with the asset and documented in SOURCES.md. Normal builds use DM Sans Heavy; ETRIXO requires a licensed app font for commercial release. The normal web export was verified to omit the demo asset.
- Browser review confirmed EtrixoDemo is the computed font on this card, checked 320px/393px and desktop layouts, and verified the card still opens Venue. At 320px, scrollWidth equals clientWidth (280px). TypeScript, whitespace and normal web export checks pass.

## Prominent venue selection and lighter wordmark/header — 7 November 2026

- Added a large walnut venue card as the first action in the Home content panel, separate from the smaller delivery-address row. Replaced the compact letter-spaced header text with a larger serif Paramount / italic Signature wordmark.
- Header wood grain and tinted layers are substantially lighter. Wordmark, chilli and tray switch to dark ink over the light scrolled content and other tabs to preserve contrast. Existing smoke, ember and photo motion remain.
- Added a Venue screen consuming the existing public GET /api/branches contract, with loading, empty, error/retry and selected states. Closed or non-accepting venues cannot be selected for orders. No fabricated venues or fallback locations are inserted.
- Checkout uses the selected venue code instead of the former hard-coded SIG-CHT-001, shows the selected venue and requires an eligible venue before enabling order submission. Venue choice is retained after checkout reset. Menus still use the existing sample data; branch-specific menus remain a separate integration task.
- Browser verified the new prominent card, readable wordmark and lighter header at 393px. The card opens the Venue screen; the live endpoint is unavailable in this local preview, so the error/retry state was verified. Real venue selection and real order submission remain unverified.
- Venue API contract checks pass for valid/closed rows, empty results, missing optional address, failed HTTP/API responses, malformed data and AbortSignal forwarding. TypeScript and whitespace checks pass.
- Android/iOS/web exports pass. Browser layouts were reviewed at 320px and 393px. Venue selection and checkout against a live backend remain pending.

## Simplified controls, copy and glossy wood — 7 November 2026

- All four Home shortcuts now use the same cream material and dark icon tone, with short Order/Search/Orders/Address labels. Existing destinations are retained.
- Removed the header pause button as requested. Reduced-motion preference, background and offscreen playback safeguards remain.
- Home feature cards now read Menu and Delivery without secondary slogans. Removed two decorative section headings and duplicate category-section link; shortened address/search copy and the Popular section heading. Food names, prices and route actions remain visible.
- Header walnut now has lighter translucent layers and a reflective gloss gradient. Replaced the oval smoke shapes with a generated alpha smoke overlay moving in two staggered wisps. Asset provenance and full prompt are in `assets/paramount/SOURCES.md`.
- Browser review at 393×852 confirms the matching shortcut style, shorter cards and absent pause control. Physical-device verification remains skipped by request.
- Menu and Delivery cards still open their existing destinations. Hero video verified at readyState 4 with playback active. Final TypeScript, whitespace checks and Android/iOS/web exports pass.

## Hero playback and braai motion correction — 7 November 2026

- Browser hero now uses one muted, looping inline video element with load/play callbacks and a visible retry action if playback fails or autoplay is blocked. The native player remains mounted through playback errors and offers a retry action. This replaces the earlier silent, persistent still-image fallback after an error.
- Removed the second video player from the header. Header now uses the existing walnut material with animated ember glow and drifting smoke. It no longer samples the hero poster or footage.
- Hero offscreen suspension now uses measured hero height and header/safe-area dimensions rather than a fixed 390-point threshold.
- Cards now have a gentle continuous photo zoom/rotation drift, including touch-only layouts, alongside the existing hover/focus/press feedback. Ambient drift and smoke suspend when paused, reduced motion is requested, the screen loses focus or the app backgrounds.
- Browser reduced-motion preference is read directly from `matchMedia` with change subscription; native continues to use AccessibilityInfo.
- Browser verification at 393×852: one video element, readyState 4, muted true, paused false and increasing playback time; shared pause stops it and resets idle card transform to scale(1)/rotate(0deg). Resume restarts playback. Card transform also changes without hover before pause.
- Physical-device verification remains skipped at the user's request. This browser check does not establish native-device playback.

## Annotated browser refinements — 7 November 2026

- Header now overlays the Home hero with lighter translucent glass. Once Home scrolls beyond 390 points, its offscreen video pauses and a separate low-opacity instance of the same grill excerpt plays in the header. Separate player surfaces avoid Android's restriction on sharing one player across views.
- A compact header pause/play button controls both surfaces. Reduced motion, screen focus, playback failure and app background state retain static/paused behavior. Browser verified playing header and paused offscreen hero, both paused by the shared control, and both paused on Search.
- Removed the circular hero seal, kicker, supporting slogans and full-width location/motion footer. Retained the main two-line headline, existing grill footage and glass menu action.
- Tray is now a compact outlined serving-dish control with an item-count badge; verified it opens the existing cart.
- Replaced the wide rectangular bottom bar with a centered capsule dock, spring-animated selected pill, preserved four destinations and explicit selected-tab accessibility semantics. Verified Search and Profile navigation.
- Added scroll-linked panel settling and hover/focus spring feedback; existing card photo zoom remains. These effects respect reduced motion.
- Home delivery card uses the generated brown takeaway bag with white branding inside a black circle. Asset and full generation prompt are recorded in `assets/paramount/SOURCES.md`.
- Browser review at 320px and 390px confirmed readable controls and fitting card/dock layouts. Physical-device verification remains skipped by request.
- Final TypeScript, whitespace checks and Android/iOS/web exports pass. Changes remain local and uncommitted.

## Supplied three-screen reference adaptation — 6 November 2026

- Latest visual direction combines the supplied restaurant-app reference with the existing Paramount identity. The current `ParamountHero` component was retained without edits: grill video, wording, entrance motion, pause/background/reduced-motion behavior and glass action remain in place.
- Home now has a rounded cream content panel, circular shortcuts to existing routes, menu/delivery feature cards, search, category links and existing food/restaurant imagery. Shortcuts do not introduce reservations or offers functionality.
- Restaurant now presents the existing three-item sample menu as a two-column image grid (three columns on wide layouts), with category filtering and a rounded content panel. Plus marks open meal customization rather than bypassing size/extras selection.
- Food Details uses a rounded food image, item-specific sample description/rating/preparation time, and a fixed quantity/add-to-cart row. Existing size and extras pricing and cart payload are preserved.
- Browser layouts reviewed at 320px and 390px. Verified two Small Grilled Chicken meals with French fries: $21.00 subtotal and $23.50 including the existing delivery fee; the temporary cart item was removed. No order was submitted.
- TypeScript, whitespace checks and Android/iOS/web exports pass. The initial sandbox denied the existing Hermes compiler; the same export completed with authorized execution outside the sandbox. Physical-device verification remains skipped by request.
- Screenshots: `.cache/ui-review/editorial-home.png`, `editorial-menu.png`, `editorial-detail.png`.

## Discovery interaction pass — 6 November 2026

- Phone verification was skipped at the user's request; it remains pending. The attempted tunnel did not connect, and review continued using the local browser preview.
- Home search submits to Search; Home category links and section links open their existing destinations. Home meal cards now open Food Details.
- Search filters the existing three-item illustrative menu by query and category, sorts by rating or price, and shows a reset action for no matches. Home, Restaurant and Search share one sample menu source; this is not live availability or pricing.
- Restaurant category selection filters its menu and handles empty categories.
- Home location opens the existing Address screen and reflects the checkout address selection. Profile Saved addresses and Payment methods open their existing screens. Existing address/payment data and checkout behavior remain unchanged.
- Browser verification covered a burger search from Home, ascending price ordering, empty Drinks results and reset, meal details navigation, Home category navigation, restaurant category filtering, address selection reflected on Home, and both Profile links.
- TypeScript and whitespace checks pass. Favourites, notifications, personal details, settings, address creation and real API/order verification remain outstanding.

Branch: `Vibe_Cod3r/customer-paramount-ui`. Work remains local and uncommitted. Existing uncommitted authentication preview work is preserved. No GitHub push or Site deployment was performed.

## Requested reference and implementation

The correct source is the hosted Paramount Site version 12, source commit `06600e59315c6e601db1640067fb45d83ef9525b`. The earlier local `app1` concept was a different design.

| Marked element | Native adaptation |
| --- | --- |
| Filmed grill hero | Original locally bundled grill video/poster, shaded typography overlay, pause/play |
| Chilli logo | Same SVG paths in the account screen, header and hero seal |
| Glass buttons | Original walnut texture, translucent layers, native blur where supported |
| Serving tray | Same serving-dish icon, labelled tray, real cart quantity, existing Cart route |
| Visit typography | Bundled DM Serif Display regular/italic and DM Sans weights across all 13 screens |
| Collection motion | Photo zoom/rotation, hover/focus/touch lift and pointer expansion on existing cards |
| Navigation material | Dark textured glass applied to the existing bottom tabs and header |
| Visit background | Sampled chalk `#EAE3D6` throughout customer screen backgrounds |

The four main tabs, existing screens, food/restaurant photos, data, API calls and checkout rules are retained. A second branch-discovery action and new collection sections were not added.

## Evidence

- TypeScript checking and final Android, iOS and web exports pass. git diff --check passes.
- Existing photograph URLs and the checkout request handler are unchanged by static comparison.
- Browser: video readyState 4, muted true, playing on Home; Pause sets paused true; opening Restaurant pauses the mounted Home video.
- Added one $8.50 meal through existing Food Details → Cart. Total remains $11.00 including the existing $2.50 fee. Restaurant and Home tray labels show 1 item. No order was submitted.
- Narrow phone (320 × 740), standard phone (390 × 844), and wider layouts reviewed. Fixed intrinsic media dimensions that caused the browser to scroll inside the clipped hero; final hero scrollHeight equals its clientHeight and scrollTop is zero.
- Pointer interaction expands the existing 220-point food card to 264 points and lifts it by 5 points; inner photo zoom is clipped to its image frame.
- Exact bundled heading font confirmed in the rendered browser. Assets include open font licenses and provenance in assets/paramount/SOURCES.md.

## Remaining checks

- Native Android/iOS device playback, OS reduced-motion changes, background suspension, system font scaling and touch performance need physical device or emulator verification. Android glass uses the documented translucent fallback.
- Real authentication, order submission, confirmation and live tracking remain outside this styling verification. Preview identity still shows the existing order-loading authentication error.
- Existing placeholder Home/Search/Profile controls remain placeholders.

Local preview: http://localhost:8081 . Choose Explore UI preview; no sign-in or real order is needed for the visual review.

## Supplied wooden glass button revision

Replaced action/selected button and tray surfaces with the supplied honey-wood glass capsule, isolated with the built-in image tool. Following the transparency revision, its wood/image layer renders at 18% opacity with subtle blur and clear rim highlights. Hero labels use a light tone; buttons over chalk use dark labels. Existing handlers and disabled states remain intact.

The subsequent depth revision places reflective glass above recessed label styling, including the tray. TypeScript passes. Light and dark screen previews were reviewed, and the hero action still opens Restaurant through the non-interactive glass coat.

## Dark smoke and metallic navigation perimeter

- Header smoke now uses a near-black tint and stronger alpha while retaining the existing drifting smoke asset and transparent wood treatment.
- Following clarification, the bundled walnut grain sits inside the bottom navigation pill under a dark brown tint and a subtle polished highlight. The separate wood backdrop strip has been removed. The navigation retains its dimensions, position, cream selection, labels, icons and soft shadow.
- A non-interactive two-point perimeter uses the specified platinum/gold stops, a #b6a785 base, 60% conic layer and 3.6-second linear rotation. Web uses a masked CSS conic gradient; native uses clipped, interpolated SVG sectors. Reduced motion renders a static edge; background/inactive navigation suspends animation.
- The restaurant card places its arrow beside the title and cuisine details, removing the otherwise empty third text row.
- TypeScript passes. Browser review at 412×915 and 1224×571 confirmed the layout and perimeter; computed browser styles confirmed 2px masking, 0.6 opacity, linear timing and 3.6s duration, with the angle advancing between observations. Home → Search → Home remains interactive. OS reduced-motion switching and native rendering were not device-tested; phone verification remains skipped.

## The Bar experience — 7 November 2026

The former Home restaurant/menu card is now a dark, sharp-edged Bar entry with existing reference cocktail photography. It opens a separate stack screen, not the food menu. Charcoal/olive-black surfaces, heavy sans typography, thin rules, square controls and muted gold distinguish the Bar from the cream food experience.

The Bar has its own locally bundled Mixkit cocktail-preparation video and poster. Playback reuses the existing muted inline/native player with independent atmosphere state, focus/background suspension, reduced-motion fallback and visible error recovery. The original grill remains the main landing hero. Venue-specific photo heroes are a requested later phase.

Cocktail/mocktail filters, expandable sample drink notes, a scroll-to-drinks hero action, return navigation and venue selection are wired. Sample drinks are clearly labelled; no live drinks menu, price or ordering service is implied. The venue route currently returns the existing backend-unavailable state in local preview.

Validation: TypeScript and Android/iOS/web exports passed. Browser reviewed at desktop and 384×824; bar video had readyState 4, muted=true and paused=false while the mounted grill was paused. Pause/play worked; returning Home resumed the grill when its hero became active. Mocktails reduced the list to two alcohol-free samples and expandable details worked. The Bar → Venue → Bar → Home flow worked. Native device playback and OS reduced-motion switching remain unverified, with phone checks skipped as requested.

Asset sources and replacement instructions are in assets/paramount/SOURCES.md. The demonstration clip is stock footage, not AI-generated or actual Paramount footage.

### Visual-menu revision

The Bar now uses the reference's warm hardware black (#111110), walnut surfaces (#19140F), chalk (#ECE5D8), subdued brass (#C6A77E) and brown outlines (#5D4F3B), checked from the live reference. Flat gold strips, introductory paragraphs, footer slogans, preview labels, disclaimers and the pause control were removed. Square wood controls and the existing metallic wooden navigation dock are retained.

Six beer images, three cider/cooler images, two spirits, two wines, two cocktail examples and one mocktail example form a visual grid. Filter tabs and image-detail dialogs work. Images use the shared slow drift, zoom and touch/hover lift. Manufacturer and retailer image labels were checked visually. The two studio spirits photographs blend into walnut surfaces rather than white product panels. Snacks were left out.

The shared dock now also renders on Bar and returns to the existing Home/Search/Orders/Profile tabs through the stack. The Bar video continues playing while browsing the catalogue; both hero videos keep looping on their active screen rather than stopping merely because the hero scrolled away. Background/focus suspension and OS reduced-motion behavior remain. No purchasing or live inventory flows were added.

Final checks: TypeScript, diff whitespace, and Android/iOS/web exports passed (`.cache/bar-visual-export-final`). Browser checks at 430×932 and 935×571 confirmed two/three-column layouts, loaded product images, and no mobile document-width overflow. The image transform changed during drift and touch zoom; bar video remained readyState 4 and playing below the hero. Cider/bottle/wine filters and image-detail open/close worked. Bar dock → Search, Bar dock → Profile, and Home → Bar were verified. Phone/native rendering, background transitions and live reduced-motion switching remain untested on a device, per the requested phone-verification skip.
