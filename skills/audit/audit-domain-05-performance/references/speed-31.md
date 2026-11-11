# Speed-31: app speed checklist

Source: a 31-prompt app-speed checklist (nxtlvl), paraphrased and regrouped here. Numbering follows
the original list so it can be cross-checked. "Audited by" says which inventory of this skill detects
the item; "Q7" is the speed-leak block in `SKILL.md`. Prompts 1-5 were flagged by the original list as
the biggest wins; 5 is the one most often skipped.

| # | Leak to check | Audited by | Fix |
|---|---------------|------------|-----|
| 1 | Queries run once per list row (N+1) | Q1/Q4 inventory, FM-2 | batch or join so a list costs a fixed number of queries |
| 2 | Filtered, sorted or joined columns without an index | Q1 | add indexes, list which query each speeds up |
| 3 | Hot data recomputed on every request | Q2 cache inventory | cache with expiry and invalidate on write |
| 4 | Below-the-fold images eager, no fixed size | domain 6 / `impeccable optimize` | lazy-load, set width/height |
| 5 | UI waits for the server on likes, toggles, saves | domain 6 Q8 `optimistic` | update first, roll back with an error message |
| 6 | Blank page or spinner while loading | domain 6 Q1-Q3 | skeletons |
| 7 | Components re-render without need | manual (React Profiler) / `impeccable optimize` | memoize, split state |
| 8 | Long lists render every row | frontend list files | virtualize |
| 9 | AI reply shown only when complete | Q7 streaming rows | stream tokens |
| 10 | Slow first load from client-only rendering | manual | server-render or pre-render the entry pages |
| 11 | Same data fetched twice | Q7 dedupe rows | one cache layer (react-query/SWR) |
| 12 | Search fires a request per keystroke | manual: `rg -n "onChange.*fetch"` | debounce |
| 13 | Endpoint returns everything | Q1/Q4 pagination | paginate server-side |
| 14 | Independent requests awaited one after another | Q7 parallel rows | `Promise.all` / `gather` |
| 15 | External calls with no timeout | audit-domain-07 Q1/Q6 (external call timeout inventory) | set timeouts |
| 16 | Responses sent uncompressed | manual: response headers | enable Brotli or gzip |
| 17 | Slow work done inside the request | FM-9/B16 | move to a job queue |
| 18 | Queries fetch more columns than used | Q7 select row | select named columns |
| 19 | New DB connection per request | playbook L11 | connection pooling |
| 20 | App servers far from the database | playbook L10/FM-18 | co-locate or add read replicas |
| 21 | Slow backend requests invisible | Q7 OTel row | trace with OpenTelemetry, list slowest |
| 22 | Heavy image formats | manual: asset sizes | serve WebP/AVIF |
| 23 | Static files served from the origin | infra check | put a CDN in front |
| 24 | Static assets re-downloaded each visit | Q2 (`Cache-Control`) | long-lived browser caching with hashed names |
| 25 | One bundle for every page | bundle report | split code per route |
| 26 | Unused dependencies bloat the bundle | `knip`/`depcheck`, bundle report | remove them |
| 27 | Third-party scripts block interaction | Q7 script rows | load after the page is interactive |
| 28 | Fonts from third parties, many weights | manual | self-host, trim weights |
| 29 | One app instance takes all traffic | Q6 single-instance | load balance across instances |
| 30 | No real-user speed data | Q7 RUM row | add a RUM/performance monitor |
| 31 | Never tried on slow phones or networks | battle-test "Perf budget" | Lighthouse mobile with throttling, budget in the stage |
