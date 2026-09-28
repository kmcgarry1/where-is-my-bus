# Working in BusTime

BusTime is a Vue + TypeScript bus arrival app for Ireland. Start with
[docs/code-map.md](docs/code-map.md) for file responsibilities and request flow.

## Entry points

- `src/main.ts` mounts `src/App.vue`; `useTransit.ts` owns transit state and polling.
- `src/components/TransitMap.vue` renders the active map.
- `vite.config.ts` registers local and preview API middleware.
- `api/_handler.ts` registers the same middleware for production.
- `server/providers/ntaGtfsRealtime/` owns upstream realtime and static GTFS data.
- `server/transport/` owns vehicle observations and prediction history.

## Working conventions

- Preserve unrelated working-tree changes. Planning documents and scripts may be in progress.
- Edit source, not `api/index.cjs`, `dist/`, or `dist-no-token/`; these are generated.
- Keep browser code in `src/` and upstream credentials in `server/`. Only public
  configuration belongs in `VITE_*` environment variables.
- Use descriptive names, explicit units for timings/distances, and small domain helpers.
  Comments should explain constraints and reasons, rather than repeat the code.
- Preserve request cancellation and version checks when changing async state.
- Keep national GTFS indexes on the server and return bounded, scoped results.
- Preserve the distinction between fixtures, live data, unavailable data, and inferred delays.
- Legacy operations/environmental modules remain in the repository. They are not
  mounted by the current app; check imports before changing or deleting them.

## Validation

- `npm test`: all Node test suites, including the Phase 0 tooling tests.
- `npm run build`: bundles the API, checks Vue/TypeScript, and builds the frontend.
- `npm run format:check`: checks maintained source and configuration formatting.
- `npm run format`: applies the repository's formatting rules.
- UI changes: start `npm run dev -- --host 127.0.0.1 --port 5174`, then run
  `npm run smoke` in another terminal. It uses controlled NTA responses.
- Live verification is separate: `npm run verify:nta` requires configured upstream access.

Tests import TypeScript directly; use a Node version that supports TypeScript type stripping.
Read `package.json` for focused tests and Phase 0 reporting commands.
