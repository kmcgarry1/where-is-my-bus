# Code map

## Active application

The browser starts at `src/main.ts`, mounts `src/App.vue`, and uses
`src/composables/useTransit.ts` for selection, search, arrivals, and polling.
`src/style.css` contains the app-wide layout and themes.

| Responsibility                                                     | Source                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| Search controls, journey details, geolocation, theme               | `src/App.vue`                                           |
| Selection state, scoped requests, cancellation, polling            | `src/composables/useTransit.ts`                         |
| Local NTA API requests and timeout policy                          | `src/data/providers/ntaGtfsRealtime/transitClient.ts`   |
| Map renderer loading, markers, route/trail layers, viewport events | `src/components/TransitMap.vue`                         |
| City bounds and geographic filtering                               | `src/data/moving/transportFilters.ts`                   |
| Arrival prediction and confidence                                  | `src/data/moving/etaPredictor.ts`                       |
| Reported versus inferred delay evidence                            | `src/data/moving/delayAssessment.ts`                    |
| Vehicles, stops, trips, arrivals, observation contracts            | `src/data/movingAsset.types.ts`                         |
| Shared geographic and incident contracts                           | `src/data/atlas.types.ts`, `src/data/incident.types.ts` |

## Request flow

1. `App.vue` invokes actions exposed by `useTransit`.
2. `transitClient.ts` requests `/api/providers/nta/*`; vehicle history uses
   `/api/transport/vehicle-observations`.
3. `vite.config.ts` (development/preview) or `api/_handler.ts` (production)
   dispatches to the same route middleware.
4. NTA routes combine cached realtime snapshots with static GTFS lookups, filter
   on the server, and adapt results into the shared browser contracts.
5. The composable updates visible features and computes selected-trip predictions.
   `App.vue` and `TransitMap.vue` render the results.

Search requests are debounced and aborted when the query changes. Selection and
area versions prevent old detail/live responses from replacing a newer selection.
Visible-page polling refreshes eligible live selections every 15 seconds. Trip
contexts and recent vehicle observations are retained in the composable for ETA work.

## Server modules

| Responsibility                                                  | Source                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| NTA endpoint dispatch and response scoping                      | `server/providers/ntaGtfsRealtime/routes.ts`                      |
| Upstream feeds, retries, fixtures, schedule enrichment          | `server/providers/ntaGtfsRealtime/client.ts`                      |
| GTFS archive/cache, indexes, stop services, shapes, trip timing | `server/providers/ntaGtfsRealtime/staticGtfs.ts`                  |
| Query matching, bounds validation, result limits                | `server/providers/ntaGtfsRealtime/query.ts`                       |
| Shared vehicle/alert feature conversion                         | `server/providers/ntaGtfsRealtime/adapter.ts`, `alertsAdapter.ts` |
| Provider cache and HTTP response helpers                        | `server/providers/cache.ts`, `http.ts`                            |
| Observation/history HTTP API                                    | `server/transport/routes.ts`                                      |
| Observation storage and prediction evaluation                   | `server/transport/historyStore.ts`                                |

Static schedules and realtime feeds are different evidence sources. GTFS times may
extend beyond midnight. Coordinates use longitude, latitude order in GeoJSON and
west, south, east, north order in bounds parameters. Keep units visible in names.
Do not turn a missing feed into a successful live response or infer congestion
from lateness alone.

## Retained legacy modules

`useOperations.ts`, `OperationsMap.vue`, `DetailsPanel.vue`, telemetry components,
environmental providers (OPW, EPA bathing, Sonitus, Dublin Bikes), provider registries,
and replay/interpolation utilities belong to the earlier operations app. They are
retained for reference and possible reuse but are outside the mounted transit UI.
`HelloWorld.vue` and the Vue/Vite artwork are scaffold leftovers. Shared data types
and moving-data helpers can still be used by the active app: follow imports rather
than treating every file in an older directory as dead code.

## Tests, tools, and generated files

- `tests/*.test.mjs`: Node tests for ETA, delay assessment, history, transit queries,
  static GTFS, and Phase 0 tooling. Tests import the source modules directly.
- `scripts/smoke.mjs`: controlled browser checks of the active app, responsive
  layout, and map. Start the local server before running it.
- `scripts/nearby-smoke.mjs`, `scripts/check-live.mjs`: additional browser checks.
- `scripts/verify-nta.mjs`: upstream verification; requires environment setup.
- `scripts/phase0/`: baseline, feed coverage, benchmarking, and evidence tooling.
- `docs/phase-0/` and the release plan: planning and measured evidence, not runtime code.
- `api/index.cjs`: generated by `npm run build:api`; edit `api/_handler.ts` instead.
- `dist/`, `dist-no-token/`, `artifacts/`, `.phase0/`: build or verification outputs.
- `.atlasops-cache/`, `.atlasops-data/`: local provider cache and stored observations.

Formatting covers maintained source, tests, scripts, root configuration, and this
guide. Generated bundles, lockfiles, screenshots, and recorded evidence are excluded.
Run commands and environment setup are documented in the root README and AGENTS.md.
