# Paramount visual sources

## Borrowdale preview menu — 22 November 2026

- `src/sample-data/menu.ts` transcribes the 57 dishes, descriptions and USD prices displayed for Signatures Restaurant, 72 Ridgeway North, Borrowdale, on https://menus.co.zw/restaurants/harare/signatures-restaurant/signatures-restaurant . This is a UI-preview transcription, not a live menu, availability assertion or ordering contract.
- That directory has no per-dish pictures. The preview currently uses an existing Unsplash category photo as a clearly non-literal fallback for each group; it must be replaced by approved dish photography or generated illustrative dish art before it is presented as an item-specific image.

## Visual Bar selection — 7 November 2026

- The 16-image local selection uses Zimbabwe drink listings: https://menus.co.zw/restaurants/harare/liquor-supplies/liquor-supplies-borrowdale and https://elixirafrica.com/shop . No supplier prices or live inventory are imported into the app.
- Image-by-image source URLs are retained in `bar-products/SOURCES.json`. Beer packshots are from Delta's public brand pages; Hunter's Dry/Gold are official manufacturer images; selected spirits and wines use Elixir Africa's public catalogue photographs. Stella uses a matching photograph from the 50 Friends restaurant menu. Mint/lime photography is by Hernan Gonzalez on Unsplash: https://unsplash.com/photos/a-glass-jar-with-a-plant-inside-WLUnyJib5OU .
- Packaging was visually checked against labels. The supplier's Jameson image depicts Original, so the UI says Jameson rather than Black Barrel. Incorrectly mapped Lion/Eagle packshots and opaque checkerboard previews were rejected and removed.
- These supplier/brand photographs are for the local design demonstration; confirm commercial reuse permissions before publication. No generated brand packaging is used. The visible preview notices were removed at the user's request; integration and rights notes stay in this documentation.

## The Bar demonstration — 7 November 2026

- `bar-cocktail.mp4` and `bar-cocktail.jpg`: Mixkit, "Bartender preparing a cocktail", item 4173, https://mixkit.co/free-stock-video/bartender-preparing-a-cocktail-4173/ . The item page identifies commercial and personal use under the Mixkit Stock Video Free License: https://mixkit.co/license/#videoFree . Retrieved 7 November 2026. This is illustrative stock footage, not footage of Paramount or AI-generated video.
- Video URL: https://assets.mixkit.co/videos/4173/4173-720.mp4 ; poster: https://assets.mixkit.co/videos/4173/4173-thumb-720-0.jpg . Replace these two bundled files to change the demonstration footage; the bar player is selected with `variant="bar"`.
- `bar-drinks.jpg`: reused from the existing reference's `/assets/cocktails.jpg` through its authenticated page asset export. Illustrative reference photography, not a claim of actual Paramount drinks.
- Bar drink names and ingredient descriptions are explicitly labelled sample content. No prices, purchase buttons or live availability claims are introduced.
- The main landing hero remains the grill video. Venue-specific photo heroes are a future requested change, not implemented in this revision.

## ETRIXO venue-card typography — 7 November 2026

- `Etrixo-DEMO.ttf`: Ragam Kata Studio's Etrixo DEMO Regular, downloaded from https://st.1001fonts.net/download/font/etrixo-demo.regular.ttf via https://www.1001fonts.com/etrixo-demo-font.html . Original terms are retained in `Etrixo-DEMO-LICENSE.txt`.
- Loaded and used only when `EXPO_PUBLIC_UI_PREVIEW=1`, only for the Home venue-card title. The demo is personal-use-only. A licensed app font must replace it before commercial use/release; author: https://ragamkatastudio.com/etrixo-font/ .
- Normal builds use the existing DM Sans Heavy fallback. A web export with `EXPO_PUBLIC_UI_PREVIEW=0` was inspected and contains no Etrixo font asset.

## Header smoke overlay — 7 November 2026

`wood-smoke.png` was generated with the built-in image tool as a transparent smoke overlay. It is layered at low opacity over the existing walnut texture and moved in two staggered wisps; it does not replace the hero footage.

Final generation prompt:

> Create a photorealistic smoke overlay asset with a genuinely transparent background and preserved soft alpha, for the narrow header of a premium braai restaurant mobile app. Only delicate wisps of pale warm grey wood smoke, very thin translucent curling filaments with irregular turbulent feathery edges, natural rising and unfurling smoke, broadly distributed from left to right as a shallow horizontal veil. No solid clouds, no circular blobs, no hard outlines. Empty transparent space between wisps. Fine photographic vapor detail. No wood, fire, embers, objects, background, lettering, frames or watermark. Wide landscape composition, smoke kept subtle and light so it can be composited at low opacity over dark glossy walnut.

Reference: https://ember-table-operations.panashe-bobojani.chatgpt.site/ , version 12, commit 06600e59315c6e601db1640067fb45d83ef9525b. Media copied locally for this customer-app adaptation; no hosted Site changes or deployment were performed.

- `paramount-grill.mp4`: the reference's compressed silent illustrative stock excerpt. Upstream source recorded by that project: https://www.pexels.com/video/person-grilling-meat-4781575/ . This is not footage of Paramount Signature.
- `grill.jpg`: reference's locally bundled illustrative Unsplash grill photograph, used as the video poster/fallback.
- `walnut-grain.webp`: reference's generated walnut texture. Source prompt: flat front-on continuous dark American walnut grain, long softly undulating horizontal grain lines, dark chocolate and warm chestnut variations, matte oiled finish; evenly lit, no planks, seams, knots, scratches, metal, rust, objects, text, frames or vignette.
- `paramount-mark.svg`: white chilli recreation already used by the reference. It is not an original master logo supplied by the business. `ParamountMark.tsx` embeds the same SVG paths for native rendering.
- DM Serif Display regular and italic: https://github.com/google/fonts/tree/main/ofl/dmserifdisplay . License: `DMSerifDisplay-OFL.txt`.
- DM Sans variable source: https://github.com/google/fonts/tree/main/ofl/dmsans . Static weight instances 400/500/600/700/800 at optical size 14 were made with fontTools for consistent native loading. License: `DMSans-OFL.txt`.

Existing customer menu/restaurant photographs retain their original URLs and are not replaced by the reference images.

## Delivery packaging image — 7 November 2026

`delivery-bag.png` was generated with the built-in image tool for the Home delivery card. This illustrative packaging image replaces that card's former restaurant/food photograph; existing menu photos are preserved. The generated chilli is an illustrative rendition, not a master brand asset.

Final generation prompt:

> Use case: product-mockup. Generate a photorealistic premium restaurant delivery packaging photograph for a small mobile app card. Landscape 3:2 composition. A single warm brown kraft paper takeaway bag with twisted paper handles on a light warm cream stone tabletop, soft walnut brown out-of-focus background, warm natural side lighting, tasteful restaurant editorial photography. Large black circular label centered on bag, white lettering inside black circle exactly 'PARAMOUNT' on first line and 'SIGNATURE' beneath in smaller widely spaced letters. A simple white curved chilli-pepper silhouette above the lettering. The bag should immediately communicate food takeaway delivery. Entire bag with handles visible and generous safe space around it so it remains legible in a wide shallow crop. No people, hands, food plates, delivery vehicles, extra slogans, watermarks or UI. Realistic kraft paper texture, refined minimal composition, warm cream/brown/black/white palette.

## Delivery packing footage — 8 November 2026

- `delivery-packing.mp4`: Mikhail Nilov, "Packing Delivery Food", Pexels video 6613037. Source: https://www.pexels.com/video/packing-delivery-food-6613037/ . Download: https://videos.pexels.com/video-files/6613037/6613037-hd_1080_1920_25fps.mp4 .
- `delivery-packing.jpg`: same clip's Pexels poster, https://images.pexels.com/videos/6613037/away-business-cafeteria-chef-6613037.jpeg .
- Pexels license: https://www.pexels.com/license/ . Illustrative takeaway-packing footage, not footage of Paramount staff or facilities. Bundled for the Delivery screen; Home and Bar retain their existing footage.

## menu-dishes.mp4 / menu-dishes.jpg
Rendered locally on 22 November 2026 from the project's own concept cut-outs (concept-assets/burger, chicken, full, fries) on the walnut texture with wood-smoke.png, a code-drawn ember glow and sparks. 1280x720, 30 fps, 14.4 s loop (4 x 3.6 s, dips to dark between dishes). Re-render with .cache/menu-dishes-render.py.
