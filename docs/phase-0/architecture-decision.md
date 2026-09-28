# ADR: prepare transit data outside user requests

Date: 15 September 2026. Status: accepted direction for Phase 1; production sizing and deployment remain unqualified.

## Decision

Keep the Vercel frontend and read API. Move national static preparation and token-limited realtime collection into a single separately hosted worker. Publish versioned static artifacts and shared realtime snapshots to object storage. No production service is provisioned in Phase 0.

Use **Cloudflare R2 Standard** as the Phase 1 object-storage target and **a Render background worker** as the ingestion target. Keep reads on Vercel, fetching only necessary prepared shards. A persistent Node read backend is the fallback if a production-sized shard cannot meet the read budget. The small local snapshot experiment cannot prove that national artifacts fit function memory.

The Phase 0 `evidence.json` records three cold trials, warm reads, two independent readers, restart and refresh-failure results. Interpret its limitations below before using the numbers for sizing.

### Measured results

Evidence: [recorded aggregates](evidence.json), Windows x64, Node 24.21.0, 15 September 2026.

| Experiment | Observed result |
| --- | --- |
| Archive download | 101,667,086 bytes in 4.79 seconds |
| Coverage indexing | 86.20 seconds; 6,650,174 stop-time rows |
| Current loader, three fresh trials | All hit the 120-second total-series deadline after two completed stops and 60 warm reads each |
| Completed current-path cold stop work | 39.18–41.07 seconds per stop, after initial index/stop-option loading |
| Current-path memory | Approximately 1.86–1.89 GiB at the last completed checkpoint; true process peak before termination may be higher |
| Bulk selected-stop preparation | 129.60 seconds internally; 129.85 seconds including process startup; peak 1,063,480 KiB (about 1.01 GiB) |
| Prepared artifact | 2,274,901 bytes for 20 selected snapshots |
| Two concurrent independent readers | 600 reads each; load 26.27/26.29 ms; warm p95 1.78/1.89 ms; approximately 101 MiB peak memory |
| Restarted reader | 600 reads; load 18.97 ms; identical payload checksum |
| Invalid replacement and failed refresh | Rejected; previous artifact unchanged and readable for another 600 reads |

`experimentCompleted=true`, `preparedPassed=true`, `currentLoaderMeetsBudget=false`; the combined verification command exits 1 because the current-loader performance gate failed. This is an observed failing baseline, not an unexplained test-harness failure. It does not imply the prepared production API is already built.

## Experiment and interpretation

The input is the actual realtime-aligned NTA static ZIP. Coverage preparation parses agency, route, trip, stop, calendar, calendar exception and stop-time data. The benchmark reuses the existing production GTFS functions against a local HTTP server serving that same archive, avoiding repeated national downloads.

The current path targets stop options, services and one representative trip context per selected stop, followed by 30 warm lookups per stop. After an initial attempt exceeded 10 minutes, the repeatable harness uses three fresh process/cache trials with a 120-second total workflow budget, matching the app's longest request deadline. Timed-out trials report only completed checkpoints; they do not establish full 20-stop baseline timings. This total-series budget is an experiment limit, not a claim that an individual stop request took 120 seconds.

The prepared path scans the national tables in bulk, builds the 20 selected stop snapshots once, then has two independent processes read and serialize them; a third process represents restart. Readers run 30 lookups per stop and compare payload checksums against the published snapshot. A five-city synthetic fixture checks bulk service/context results against the existing production functions. Full real-data parity remains unverified if the current-loader trials time out.

**This is a frozen 20-stop snapshot experiment.** It does not preprocess all national stop boards, recompute arrivals at query time, include every live candidate trip, implement the proposed arrival API or measure network time to cloud storage. Warm read times compare existing computation with reading already-computed answers. Its valid conclusion is that preparation can remove expensive parsing from interactive requests; its speed ratio cannot be generalized to a full production arrival service. `experimentCompleted` describes whether the comparison and recovery checks ran; `passed` also requires the current path to meet its budget and can correctly be false.

The failed-refresh case injects an unavailable local source before publication. The invalid-replacement case rejects an empty candidate. Both check that the previous artifact remains byte-identical and readable. These are local-file publication tests, not distributed object-store concurrency tests.

Worker memory is peak resident memory reported by Node in KiB; process wall time includes startup, while internal load/read timings exclude module-import startup. Coverage preparation and the benchmark are separate workloads. The first exploratory coverage parser was interrupted for excess buffering, then corrected to feed CSV parsing in bounded chunks; it is not included as a successful benchmark trial.

## Phase 1 topology and rules

- Static worker: fetch a new dataset daily, validate required tables/references/calendar range, build bounded route/stop/trip shards, and publish immutable versioned objects. Publish the current manifest only after every shard validates. Retain the prior version for rollback.
- Realtime worker: one token-wide scheduler, initially no faster than one request per 61 seconds across all endpoints. Store original feed timestamps, retrieval times, source and health. Preserve complete relevant TripUpdates and alert selectors. Confirm the production subscription before changing cadence.
- Read API: read versioned shards and the shared snapshot, with bounded local caches. Do not download or parse the national archive during requests. Set a 1 MiB initial uncompressed per-shard budget; subdivide oversized shards. Measure representative cold and warm requests before widening coverage.
- History: session-only movement history for 1.0. Disable unused server history and prediction-write routes during Phase 1 rather than provisioning a history database.
- Recovery: failed ingestion leaves the previous version in place; failed realtime refresh changes health metadata without refreshing data timestamps. Expired snapshots yield explicit unavailable/degraded responses. Rollback switches the manifest to the preceding valid version.
- Compatibility: keep the existing application endpoint contracts during migration. Correct service-day and stop-update semantics behind those contracts; add the stop-arrivals endpoint in the later arrival-experience work package.

## Service limits and cost assumptions

Vercel currently lists 2 GB maximum function memory on Hobby and 4 GB on Pro, plus a 4.5 MB request/response limit. These limits support using small prepared shards, not national archive processing. Actual project settings and regional cold latency are unverified. [Vercel function limits](https://vercel.com/docs/functions/limitations)

R2 Standard lists $0.015/GB-month storage, $4.50/million Class A operations and $0.36/million Class B operations, with no egress bandwidth charge. For an illustrative 5 GB plus 50,000 writes and one million reads, the gross arithmetic is $0.66/month before free allowances; this excludes all compute, map and other charges. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

For initial staging, select the **Render 2 CPU/4 GB worker class**, listed at $85/month. The measured preparation peak slightly exceeds 1 GiB, so 2 GB provides less than the chosen 2x memory allowance; a 4 GB worker is the conservative starting point. Confirm the applicable worker SKU at provisioning, measure on Linux and reduce the allocation only after demonstrating headroom. This experiment does not authorize purchasing it. [Render pricing](https://render.com/pricing)

Vercel Pro is listed from $20/month, with usage and team charges requiring account-specific review. Keep the original €100–€300 monthly pilot planning envelope and set a spend alert before provisioning. Dollar source prices have not been converted to euros or treated as invoices. [Vercel pricing](https://vercel.com/pricing)

The illustrative infrastructure subtotal is therefore approximately **$105.66/month** for one $85 worker, the $20 Vercel starting price and the R2 scenario above, before map usage, additional workspace/seat charges, usage overages, monitoring, taxes and exchange rates. This is a sizing assumption for review, not a procurement quote.

## Remaining qualification

The implementing engineer owns a Linux/cloud-sized ingestion replay, object-store atomic-manifest/restart checks, read payload/memory budgets and cold API measurements. The product owner owns account access, spending limits and support ownership. If a representative sharded read exceeds p95 1 second warm or 3 seconds cold, investigate shard sizes and caching first; move the read service to persistent Node if that budget remains unmet. No production availability or cost guarantee follows from local results.
