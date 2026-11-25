# Paramount Signature customer app

Native Expo SDK 58 / React Native customer app with React Navigation. `App.tsx` opens the native screens; `src/signatureHtml.ts` is an older reference and is not the active UI.

## Run locally

Use Node 22.13+ (or a compatible newer LTS runtime), install dependencies with `npm install`, then run `npx expo start`. Open Android or iOS through Expo Go or an emulator. The configured API must be reachable from the device to use accounts and real orders.

For a browser review without signing in, use PowerShell:

```powershell
$env:EXPO_PUBLIC_UI_PREVIEW = '1'
npx expo start --web --port 8081
```

Choose **Explore UI preview** on the account screen. This existing preview mode uses a local preview identity; it does not provide a working backend or payment provider. Do not submit an order during a visual-only review. Omit this environment variable for normal builds.

## Paramount presentation

The visual source is the hosted **Paramount Signature — Restaurant & Bar**, Site version 12, source commit `06600e59315c6e601db1640067fb45d83ef9525b`, at https://ember-table-operations.panashe-bobojani.chatgpt.site/ . The root `app1` concept is an older, different design.

The customer screens use the sampled warm chalk (`#EAE3D6`), hardware black (`#111110`), walnut (`#795238`) and muted gold (`#C6A77E`) theme. DM Serif Display regular/italic and DM Sans weights are bundled locally, with their OFL licenses, and loaded before the app screens appear. Existing food and restaurant photographs are retained.

The native `ParamountHero` uses the actual silent grill excerpt and poster from the hosted reference through `expo-video`. The illustration and synthetic flames are removed. The video loops without sound, stops offscreen, on blur/background and for reduced motion, and shows a still image for reduced motion or playback failure. Explore the menu opens the existing Restaurant screen. The prominent Home venue card opens the Venue picker against the existing `/api/branches` endpoint. Checkout uses the selected venue code. Loading, empty and unavailable states are handled; local API access and real ordering still need integration verification. Menus remain sample data.

`ParamountGlass` uses the supplied honey-wood glass capsule for buttons at 18% opacity, with a reflective rim, subtle blur and clear highlights. Navigation retains the hosted reference's dark walnut texture. See `assets/paramount/WOODEN_GLASS_BUTTON.md` for the preparation prompt and asset details. Android uses a translucent textured fallback; exact blur/performance needs device review. Main tabs retain their four destinations and use this material instead of the reference website's sidebar. The header uses the reference chilli mark and a serving-tray button wired to the current cart and quantity count. Restaurant's existing cart entry uses the same tray.

`ParamountPressable` retains existing actions and adds tactile press feedback. Existing food cards gain the reference's image zoom, slight rotation and lift on hover/focus/touch; pointer hover expands fixed-width cards without adding new collection sections. Reduced motion disables extra movement. Profile, Address and Payment content remains scrollable, and the app is centered and limited to 820 points on wide displays.

See `assets/paramount/SOURCES.md` for media provenance. The copied logo is the reference's vector recreation, not a supplied master brand file. These assets are illustrative; the video is not footage of the restaurant.

## Checks

```powershell
npx tsc --noEmit
npx expo export --platform all --output-dir dist
```

See `UI_REVIEW.md` for the observed preview behavior and outstanding device/API checks.
