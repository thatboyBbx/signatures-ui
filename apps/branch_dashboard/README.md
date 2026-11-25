# Paramount Branch Operations

Responsive React/Vite dashboard for invited branch staff. Overview, Orders, Menu, Drivers, History and Settings use authenticated, branch-scoped API requests.

Use Node 22.13+; run `npm ci`, configure `VITE_API_URL` from `.env.example`, then `npm run dev`. Operational sessions remain in memory; refreshing the browser requires signing in again. Backend outages display retry states and never substitute sample records.

Checks: `npm run build` and `npm run lint`.

See [shared setup and API contracts](../../docs/OPERATIONS.md) and [the screen inventory](../../docs/UI_INVENTORY.md). The disposable local preview uses explicitly labelled test data; it is separate from hosted Supabase verification.
