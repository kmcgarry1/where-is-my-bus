# Phase 0: baseline and coverage

Assessment: 15 September 2026. Product: BusTime, bus-only. Geography: Dublin, Cork, Galway, Limerick and Waterford. Frontend hosting remains Vercel.

## Status and boundaries

Phase 0 tooling is implemented. Local static processing, an exploratory live observation and architecture experiments are recorded in [evidence.json](evidence.json) alongside this document. This is not a production qualification or a claim of nationwide coverage. The requested weekday morning and midday three-observation series remain pending because the implementation session was outside both windows. Participant sessions and cloud deployment qualification are also pending.

Verification: **30 automated tests pass** (22 existing and 8 Phase 0 tests), the production build passes, and the controlled Chromium desktop/mobile smoke passes. The bulk-preparation fixture is compared with the existing service/context functions. The actual current-loader benchmark deliberately returns a failure status: all three deadline trials were incomplete. Prepared readers, restart and refresh recovery passed; see the [architecture decision](architecture-decision.md).

The final exploratory snapshot contained **1,411 national vehicle entities and 3,489 TripUpdates**, including 81 cancelled trips, 1,432 skipped-stop updates and 2,549 multi-stop updates. Every selected outer-area stop had scheduled trips on the sample date but no matching update at observation time. This does not establish missing service: those trips may operate at other times, and update coverage must be assessed against the actual departure horizon. It does establish that a live-vehicle-only board needs explicit scheduled/unavailable states.

The dedicated `/gtfsr/v2/ServiceAlerts` candidate failed in the exploratory observation. A separate follow-up to the application's first-choice combined `/gtfsr/v2/gtfsr?format=json` endpoint returned HTTP 200 with 3,434 TripUpdate entities and zero alert entities at 15:45 UTC. This establishes fetch/parse health, **not that the endpoint supplies alerts or that no disruptions exist**. The checker now follows the app's combined-feed default and labels missing alert capability explicitly. The account owner must establish the supported alert endpoint/capability.

Raw realtime feeds are processed in memory, never written to the repository. Downloaded static ZIPs and prepared benchmark snapshots are temporary under ignored `.phase0/raw/` and removed after normal completion. User-supplied `--archive` files are read-only inputs and are not deleted. The startup retention sweep removes expired flat raw files after seven days; after a forced process termination, clean up the interrupted run before leaving the evaluation machine unattended. There is no background retention service or cloud lifecycle policy installed.

## Reproduce

Use the existing `.env.local` server-only configuration. Environment variables override that file. Never place NTA keys in `VITE_*` variables. Node 24 was used for evaluation; tests use Node's built-in TypeScript support.

```sh
npm run test:phase0
npm run test:eta
npm run test:history
npm run test:transit
npm run build

# Static preparation and required live-check status; no realtime requests by default.
# A skipped required live check gives exit code 1, deliberately.
npm run verify:baseline

# One exploratory observation; three national requests, spaced at least 61 seconds.
npm run verify:baseline -- --live

# Reuse one download for static coverage and the full architecture benchmark.
npm run verify:baseline -- --live --benchmark

# Optional application stop lookup, against BUSTIME_VERIFY_URL.
npm run verify:baseline -- --live --app

# Static-only experiment, independent of NTA realtime credentials.
npm run benchmark:phase0

# Publish aggregate evidence and the selected-stop table after both reports exist.
npm run report:phase0

# Start these within the named weekday window, allowing time for static preparation.
npm run verify:baseline -- --live --window=morning-peak
npm run verify:baseline -- --live --window=midday

# Terminal 1
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
# Terminal 2: controlled transit responses; no proof of live feed coverage.
npm run smoke
```

For strictly machine-readable stdout, invoke `node scripts/phase0/baseline.mjs --live`; npm itself adds script banners unless run silently. Progress goes to stderr. Results are `.phase0/baseline.json`, individual aggregate `observation-*.json`, and `.phase0/benchmark.json`. `BUSTIME_VERIFY_URL` is the canonical app base URL, with legacy `ATLASOPS_VERIFY_URL` and `ATLASOPS_SMOKE_URL` aliases. `BUSTIME_ARTIFACT_DIR` overrides the smoke screenshot directory; default `.phase0/screenshots` keeps tracked screenshots untouched.

Requests have explicit deadlines: realtime 30 seconds, static download 180 seconds and optional application reads 120 seconds. Endpoint redirects are rejected and there are no automatic retries. A local lock and persisted last-request timestamp prevent overlapping evaluation runs and enforce the token-wide interval. This does not coordinate other applications using the same token: pause those collectors for the sampling session. After an interrupted run, first verify no evaluation process is running before removing a stale `.phase0/realtime.lock`.

## Sampling protocol

- Morning peak: 07:00–09:00; midday: 12:00–14:00, weekdays in Europe/Dublin.
- Three observations start at least five minutes apart. Each observation fetches the national feeds sequentially, once each, and reuses them for every city. Feed timestamps/start times preserve the approximately two-minute within-observation skew.
- A run outside the requested window fails; it does not silently substitute an exploratory observation. Start by 08:40 or 13:40 after allowing for static preparation. A window crossed during collection is flagged.
- Central stop candidate: most distinct route IDs within 1.2 km of the named city centre. Outer stop: farthest bus stop within the existing city bounds. Opposite pair: separate stops within 250 m with opposing single direction IDs on a shared route.
- These are deterministic candidate selections, not a claim that route-ID counts uniquely identify a real interchange. The product owner reviews the selected street locations and interchange suitability before recruitment.
- Aggregate metrics include bus vehicle counts, unknown route counts, observed timestamp-age distributions, static trip matches, city/operator TripUpdates, unmatched exact vehicle instances, alert parse health and raw GTFS semantic counts.
- Vehicle city scope uses the reported position. TripUpdate city scope uses routes serving stops in that city, so a trip may occur in more than one city's update count. Exact instance mismatches also include missing start-date/start-time fields; they are not all missing-GPS cases.
- A valid empty feed is reported separately from HTTP, parse, timeout, missing-credential and demonstration states. Unknown metrics use `null`, not zero.
- Usable stop evidence is deliberately conservative: an explicit event in the next hour, matching explicit service date, fresh update, and no cancellation/skipped/no-data flag. Delay-only or undated updates are excluded. Scheduled service counts use calendar exceptions and the observation's Dublin date; they describe that date, not a complete departure board or previous-day overnight service.

## Data access and terms

The production portal publishes a default token limit of one realtime request per 60 seconds and permits NTA to change individual limits. It requires provider attribution, a source link and an as-is statement. The evaluation runner uses a 61-second interval; the product owner must confirm account-specific limits and endpoint entitlement before sustained collection. The existing app's 25-second process cache is not a token-wide quota controller. [NTA production usage policy](https://developer.nationaltransport.ie/usagepolicy)

Attribution for this evaluation: transit data supplied by the [National Transport Authority](https://www.nationaltransport.ie/), provided as is; NTA is not responsible for errors or inaccuracies. Aggregate derived measurements describe this evaluation, not NTA service guarantees.

| Remaining item | Owner | Completion evidence |
| --- | --- | --- |
| Account-specific quota and endpoint entitlement | Product owner/user | Portal subscription limits and approved endpoint list, with secrets excluded |
| Six timed observations per city | Implementing engineer | Three morning plus three midday aggregate reports with correct timestamps |
| Geographic suitability of 20 selected candidates | Product owner/user | Reviewed central/outer/opposite-pair list |
| Coverage decision by operator/city | Product owner + engineer | Sampling gaps reviewed; unsupported coverage excluded from release claims |
| Real ETA accuracy | Later release qualification | Independently checked arrivals, not inferred stop transitions alone |

## Product validation kit

Recruit 8–12 bus users: at least one from every city, a mix of frequent and occasional riders, and at least two assistive-technology users where feasible. Invitations are prepared here; the product owner distributes them. No invitations were sent and no participant feedback has been invented.

**Invitation:** “We’re testing BusTime, a browser-based bus arrival checker. Would you take part in a 20-minute session finding a stop and interpreting bus information? We are looking for people who use buses in Dublin, Cork, Galway, Limerick or Waterford. Participation is optional. Please tell us your city, usual device and any access needs; do not send your home address or precise travel history.”

**Session script:** Explain that the interface is being tested, ask permission before recording, then let the participant work unaided. Use a public stop near a city landmark rather than their home.

1. Find that stop and identify the bus travelling in the intended direction.
2. Explain which displayed time is live, estimated or scheduled and what the data age means.
3. Show a controlled missing-live-data example and ask what they would do next.
4. Show a cancelled/skipped-service concept and check that they do not interpret it as a departing bus.
5. Return to the same stop after leaving the page. Discuss saved stops and sharing as future concepts, clearly distinguishing them from existing features.
6. Ask what would make them return to BusTime and which information they would cross-check elsewhere.

Record anonymous participant ID, city, device, access needs only if volunteered, completion per task, assistance, source-label confusion and a short paraphrased finding. Keep personal contact details outside the repository. Target 80% unaided core-task completion and no repeated live-versus-scheduled confusion. Findings status: **pending recruitment; zero sessions conducted**.

<!-- phase0-evidence:start -->
## Recorded local evidence

Source: [aggregate evidence](evidence.json). Snapshot window: 16:52 Europe/Dublin on 2026-09-15 (outside-planned-window). Age measurements use the start timestamp of each corresponding feed request, excluding sequential request skew.

Static archive: 101,667,086 bytes; SHA-256 `6f38ac3cde0617a4237064e0a2b0e6373d077f45b11f767b6383412a28cde1e3`. Download 4.8 seconds; coverage preparation 86.2 seconds. Counts: 403 routes, 176474 trips, 10184 stops and 6650174 stop-time rows.

| City | Static bus stops | Sample vehicles | Static trip match % | Age p50 / p95 (s) | Route-scoped TripUpdates |
| --- | --- | --- | --- | --- | --- |
| dublin | 3803 | 860 | 99.9 | 20.5 / 146.5 | 2093 |
| cork | 815 | 91 | 100.0 | 29.5 / 276.5 | 339 |
| galway | 291 | 43 | 100.0 | 29.5 / 38.5 | 162 |
| limerick | 346 | 53 | 100.0 | 29.5 / 237.5 | 183 |
| waterford | 145 | 22 | 100.0 | 9.5 / 47.5 | 91 |

These are one-observation counts, not fleet coverage percentages. Full operator and stop-update breakdowns are in the aggregate JSON. The required timed sampling series is pending.

### Selected stop candidates

Route labels below are deduplicated; full route IDs are in the evidence. Central candidates and geographic suitability still require product review.

| City | Role | Stop ID | Name | Served route labels |
| --- | --- | --- | --- | --- |
| dublin | central-interchange-candidate | 8220DB002810 | Clare Street | 126E, 126U, 126X, 130, 120A, 120E, 120F, 39X, 41X, 44, 44D, 51D, 77X, 82, X1, X2, X25, X26, X27, X28, X30, X31, X32, 142, 15A, 15B, 15D, 32X, 33X |
| dublin | outer-area | 8250DB003548 | Shanganagh Cliffs | 45B |
| dublin | opposite-direction-1 | 8220DB000279 | O'Connell St Upr | 120, 122, F1, F2, F3 |
| dublin | opposite-direction-2 | 8220DB000270 | O'Connell St Upr | 13, F1, F2, F3, 16, 16D |
| cork | central-interchange-candidate | 8370B2550201 | Cork Bus Stn | 40, 233, 235, 236, 237, 239, 240, 241, 243, 245, 245X, 248, 260, 261, 31, 51, 519 |
| cork | outer-area | 8380B245541 | Raheens East | 223 |
| cork | opposite-direction-1 | 8370B2406901 | Daunt's Square | 203, 205, 207, 208, 214 |
| cork | opposite-direction-2 | 8370B2405001 | Daunt's Square | 203, 205, 207, 208, 209A, 213, 214, 215 |
| galway | central-interchange-candidate | 8460B5550401 | Galway Ceannt | 424, 350, 417, 419, 425, 425A, 429, 434, 456, 51, 64, 65 |
| galway | outer-area | 8470B531651 | Ogúil | 419 |
| galway | opposite-direction-1 | 8460B522331 | Eyre Square | 401 |
| galway | opposite-direction-2 | 8460B523201 | Eyre Square | 401 |
| limerick | central-interchange-candidate | 8400B635041 | Limerick Colbert | 13, 343, 14, 314, 317, 317A, 320, 321, 323, 323X, 328, 329, 330X, 332, 345, 347, 51, 55, 72 |
| limerick | outer-area | 8410B3329401 | Ballyanrahan | 320, 321 |
| limerick | opposite-direction-1 | 8400B6078301 | Sarsfield St | 304, 310 |
| limerick | opposite-direction-2 | 8400B610031 | Sarsfield St | 302, 306, 310 |
| waterford | central-interchange-candidate | 8440B352051 | Parnell Street | W1, W3, W5, 354, 355, 360, 360A, 362, 370, 40 |
| waterford | outer-area | 8450B255601 | Ballinkina | 354 |
| waterford | opposite-direction-1 | 8440B352541 | Parnell Street | W3, W5, W2, 40, 354, 360, 360A, 362 |
| waterford | opposite-direction-2 | 8440B352271 | John Street | W3, W5 |
<!-- phase0-evidence:end -->
