# Paramount Driver

Authenticated Expo Router driver app: Home, Deliveries, Earnings and Profile.

Use Node 22.13+ and run `npm ci`. Configure `EXPO_PUBLIC_API_URL` from `.env.example` to point to the Express API, including `/api`. Run `npm run web -- --port 8082` for browser review, or the existing Android/iOS start scripts for native development. No device execution is claimed by an export.

The app requires an invited driver account with a branch assignment. Native sessions use SecureStore; web sessions remain in memory. Job acceptance and status changes require server confirmation. Cash collection and earned delivery income are distinct; automated payouts and GPS tracking are not implemented.

Checks: `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform all --output-dir .cache/operations-export`.

See [the shared setup and API guide](../../docs/OPERATIONS.md), including the disposable PostgreSQL preview and test accounts. No live credentials are needed for that preview.
