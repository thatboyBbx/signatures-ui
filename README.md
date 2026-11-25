# Signatures UI

UI-only repo for the Paramount Signature apps. Logic lives in techdev-sys/signatures. This repo holds the screens, design system and assets to bring into it.

## Contents

| Path | What it is |
|---|---|
| `apps/customer_app/customer-mobile` | Customer app (Expo / React Native, web preview) |
| `apps/driver_app` | Driver app (Expo Router) |
| `apps/branch_dashboard` | Branch dashboard (Vite + React) |
| `docs/` | UI change logs, research, inventory, previews |
| `concept-assets/`, root `*.html` / `*.css` / `*.mjs` | Early concept pages and art |

No backend is included. `sample-data/` and `services/mockApi.ts` in the customer app are preview stand-ins. When porting, replace them with the logic repo's real services.

## Run the customer UI preview

```
cd apps/customer_app/customer-mobile
npm install
EXPO_PUBLIC_UI_PREVIEW=1 npx expo start --web --port 8081
```

Expo needs Node 22.13 or newer.
