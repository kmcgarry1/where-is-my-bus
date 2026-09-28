# Phase 1: data and production foundation

Status: implementation-ready sequencing; access and timed coverage gates remain open. Estimated effort: **17–25 engineering days**, before contingency. This replaces the feasibility report's 15–23 day range for this phase because token-wide scheduling and explicit service/calendar validation are now separate deliverables. Re-estimate the overall release after these tasks; do not add this estimate on top of the old phase estimate.

Measured basis: the current loader completed only two selected stops in each 120-second trial; bulk preparation completed all 20 snapshots in 129.6 seconds, then independent readers loaded the artifact in 19–26 ms. Prioritize preparation and versioned reads before UI features. The [ADR](architecture-decision.md) selects a Vercel read frontend/API, Render 4 GB staging worker and R2 artifacts; no services have been purchased or deployed.

## Ordered work packages

| Order | Work | Days | Depends on | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | Endpoint, quota and dataset contract | 1–2 | Product owner's account confirmation | Pin approved endpoints, document shared-token cadence and attribution; missing credentials cause explicit production unavailability |
| 2 | Static preparation pipeline | 4–6 | 1; Phase 0 archive evidence | Ingestion runs outside user requests; required tables and references validated; dated, checksummed shards published only after successful preparation |
| 3 | Versioned storage and rollback | 2–3 | 2; R2 access | Immutable shards plus current manifest; previous version retained; two independent readers and restarted processes use the same version; invalid refresh cannot replace it |
| 4 | Realtime snapshot worker | 3–4 | 1; worker access | One quota controller for all endpoints; no client-triggered national fetching; bounded deadlines and retry budget; preserved feed timestamps and degraded status after failure |
| 5 | Service-instance correctness | 4–5 | 2, 4 | Agency timezone, service date, calendar exceptions, 24+ hour times, cancellation and skipped-stop semantics tested; full ordered stop updates retained |
| 6 | Existing API migration and history removal | 2–3 | 3–5 | Existing stop/route/vehicle/context contracts still work from prepared data; public unused history/prediction writes disabled; session history remains usable |
| 7 | Staging and operational handoff | 1–2 | All above | Read-only runtime passes; cold/restart/outage probes and rollback demonstrated; quotas, data age and failed refreshes monitored |

Tasks 2 and 4 can progress independently after the endpoint contract is established. A single engineer executes them sequentially; this plan does not assume delegated agents or additional staffing.

## Interface requirements

- Internal static manifest: dataset checksum/version, retrieval and validity dates, schema version, shard inventory/checksums and previous version reference. Readers never mix shards from different versions.
- Internal realtime snapshot: original provider timestamp, retrieval/last-success timestamp, source, degraded status and complete relevant vehicle/trip/stop/alert entities. Failed refreshes cannot advance last-success timestamps.
- Trip identity includes service date and start time where supplied; explicitly handle incomplete identities instead of conflating repeated trips across service days.
- External API contracts remain compatible in this phase. The proposed `/api/providers/nta/arrivals?stopId=...` endpoint and the UI departure-board migration belong to Phase 2, after the data foundation passes.
- No history database, notification system, accounts, favorites, shared links or journey planner is added in Phase 1.

## Required verification

1. Existing tests, build and controlled desktop/mobile smoke pass in CI, with screenshots kept in ignored/output storage.
2. Fixtures cover calendars and exceptions, Dublin DST boundaries, UTC versus Dublin hosts, midnight and 25:00 service times, repeated stops, cancelled trips, skipped stops, undated TripUpdates and updates without a vehicle position.
3. Freshness tests start from success, inject failure, verify unchanged data age plus degraded state, expire the permitted stale period, and recover with a genuinely newer snapshot.
4. Publication tests use two independent readers, interrupted upload, corrupt shard, invalid manifest and worker restart; previous valid data remains readable.
5. Quota tests simulate concurrent demand and retries without real requests; no request bypasses the token-wide limiter. Validate all worker processes share its coordination mechanism.
6. Staging measurements record per-shard sizes, memory, response payloads and cold/warm durations. Pass the agreed p95 1-second warm/3-second cold read budget before public rollout, or apply the ADR's persistent-backend fallback.

## Owners and open gates

| Gate | Owner | Required action |
| --- | --- | --- |
| NTA account-specific limits and endpoint entitlement | Product owner/user | Confirm subscription details without sharing secret values in documents |
| Alert capability | Product owner + engineer | Resolve dedicated endpoint failure and confirm whether the combined feed can contain alerts; zero observed alerts alone is insufficient |
| Timed five-city coverage | Implementing engineer | Run both planned windows and attach aggregate evidence |
| Stop candidate review and pilot recruitment | Product owner/user | Review 20 candidates; distribute the interview invitation |
| Cloud credentials and spending ceiling | Product owner/user | Supply normal deployment access and establish budget before provisioning |
| Linux/cloud experiment and monitoring | Implementing engineer | Validate the ADR's sizing and operational assumptions in staging |
| Product interviews | Product owner/user | Recruit 8–12 participants; record actual task results before claiming validation |

Proceed with local pipeline and fixture work while external gates remain open. Do not mark production qualification or the complete Phase 0 sampling programme passed until the missing evidence exists.
