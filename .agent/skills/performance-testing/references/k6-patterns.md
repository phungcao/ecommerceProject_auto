# k6 patterns and recipes

Verified on k6 v2.3.0 (snippets were run against a local mock). Read the section you need; this file is a lookup, not a tutorial.

Contents: 1 Run command · 2 Executors · 3 Sizing VUs · 4 Auth · 5 Data · 6 Tags · 7 Negative tests · 8 Custom metrics · 9 Thresholds · 10 Generator efficiency · 11 Outputs · 12 CI gate · 13 k6 v2 notes · 14 TypeScript

## 1. Run command and secrets

```bash
k6 run \
  -e BASE_URL=https://staging.example.com \
  --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
  --summary-export=perf-results/load-$(date -u +%Y%m%dT%H%M%SZ).json \
  perf/load.js
```

- Config comes from `-e` or the shell environment (`__ENV.NAME`; `--include-system-env-vars` is on by default). Put secrets in the shell or CI secret store, never in the script, the repo, the summary file or the report.
- Without `--summary-trend-stats`, the export has no `p(99)`.
- `--no-thresholds` exists for debugging only. A result produced with it has no verdict.
- Exit code `99` means at least one threshold was crossed; `107` is a script exception (missing env, bad config). Use the exit code as the CI gate.

## 2. Choosing an executor

| Goal | Executor | Why |
|---|---|---|
| Smoke / run N iterations exactly | `shared-iterations` | Fixed total work, ends by itself |
| Fixed number of concurrent users | `constant-vus`, `ramping-vus` | Closed model: users wait for the response, so load drops when the system slows |
| Hold a throughput target | `constant-arrival-rate` | Open model: new iterations start on schedule even if the system is slow |
| Staged throughput (ramp, step, spike) | `ramping-arrival-rate` | Same, with stages |
| Each VU does its own fixed work | `per-vu-iterations` | Per-user scripted flows |

Prefer an open model (arrival-rate) when the requirement is expressed as requests or orders per second, or when you test a public system: real users do not slow down their arrival because your server is slow. A closed model hides overload because the generator backs off together with the system. Use a closed model when the requirement is "N concurrent sessions".

`externally-controlled` was removed in k6 v2; model changing load with `ramping-*` stages instead.

## 3. Sizing VUs

For arrival-rate executors: `VUs needed ≈ rate (iterations/s) × average iteration duration (s) × 1.2`. Iteration duration includes think time and the response time under load, so it grows when the system degrades.

- `preAllocatedVUs`: what k6 creates up front (set near the estimate). k6 reserves these per scenario, so `vus_max` is the sum across scenarios.
- `maxVUs`: the cap for on-demand VUs. VUs created mid-test are initialized during the run and can disturb results, so size `preAllocatedVUs` generously.
- If the system is slower than planned and VUs run out, k6 records `dropped_iterations`. The template threshold `count==0` marks that run invalid for the target rate, which is correct: the offered load was not delivered.
- Check the generator, not only the target: keep generator CPU well below saturation (rule of thumb: under about 80%) and watch memory. A saturated generator produces slow and failing requests that blame the wrong system.

## 4. Auth

```js
// A) One token from the environment (simplest; token never in the repo)
export function setup() { return { token: __ENV.AUTH_TOKEN || '' }; }

// B) Log in once per VU: module-level variables are per VU in k6
let vuToken;
export default function (data) {
  if (!vuToken) vuToken = data.tokens[(exec.vu.idInTest - 1) % data.tokens.length];
  // ...
}

// C) Token pool built once in setup() from test accounts (avoid hammering the login endpoint)
export function setup() {
  return { tokens: accounts.map((a) => http.post(`${BASE_URL}/login`, JSON.stringify({ user: a.user, password: a.password }),
    { headers: { 'Content-Type': 'application/json' } }).json('token')) };
}
```

- Log in per iteration only when login itself is the system under test; otherwise you are load-testing the identity provider by accident.
- Refresh tokens that expire during long soak runs (check expiry, re-login in the VU).
- Never print tokens with `console.log`. Redact them in anything you paste into the report.

## 5. Data

```js
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const accounts = new SharedArray('accounts', () => JSON.parse(open('./data/accounts.json'))); // loaded once, shared read-only
const acct = accounts[exec.scenario.iterationInTest % accounts.length];
const uniqueRef = `PERF-${exec.vu.idInTest}-${exec.scenario.iterationInTest}`;                   // unique per write
```

- `open()` only works in the init context (top level), not inside `default`.
- Reading the same record every iteration measures the cache, not the system. Spread reads across a realistic key space.
- Writes need unique data per VU and iteration (use `exec.vu.idInTest` and `exec.scenario.iterationInTest`) and a way to clean up afterwards (prefix such as `PERF-`, a teardown, or an agreed purge job).
- Convert CSV to JSON offline; avoid runtime imports from the internet (they break in locked-down CI and are unpinned supply-chain risk). If you must import a remote jslib module, pin the exact version.

## 6. Tags

- `tags: { name: 'GET /items/:id' }` on requests with dynamic URLs. Without it, every distinct URL becomes a separate series and summaries and dashboards explode.
- The `scenario` tag is added automatically, and `expected_response` is set on every HTTP sample. Both can be used in threshold selectors: `http_req_duration{scenario:steady,expected_response:true}`.
- Add your own tags sparingly (journey step, endpoint group). High-cardinality tag values (user IDs, timestamps) create the same explosion as untagged URLs.

## 7. Negative tests (expected 4xx)

By default any status outside 200–399 counts as failed, which pollutes `http_req_failed`. Put expected errors in their own scenario and declare them:

```js
const expect404 = http.expectedStatuses({ min: 200, max: 299 }, 404);
http.get(url, { responseCallback: expect404, tags: { name: 'GET /missing (expected 404)' } });
```

Judge the SLA only on the scenario that models real traffic.

## 8. Custom metrics

```js
import { Counter, Rate, Trend } from 'k6/metrics';
const checkoutTime = new Trend('checkout_duration', true); // true = values are times (ms)
const bizOk = new Rate('business_success');
const orders = new Counter('orders_created');
```

Use them for business transactions that span several requests (checkout, search-to-booking) and give them thresholds like built-in metrics: `checkout_duration: ['p(95)<800']`, `business_success: ['rate>0.99']`. A passing HTTP status does not prove the business outcome; assert the outcome in a `check()` and feed the `Rate`.

## 9. Thresholds cheat sheet

```js
thresholds: {
  http_req_failed: ['rate<0.01'],                                         // error rate
  http_req_duration: ['p(95)<500', 'p(99)<1000'],                         // ms; whole run (ramps included)
  'http_req_duration{scenario:steady,expected_response:true}': ['p(95)<500'], // steady phase, successful only
  checks: ['rate>0.99'],                                                  // check() never fails the run by itself
  'http_req_duration{name:POST /orders}': ['p(95)<800'],                  // one endpoint (needs the name tag)
  http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' }], // kill-switch
}
```

- Syntax is `metric{tag:value,tag2:value2}: ['aggregation<limit']`. The braces hold tag filters only. A key such as `http_req_duration{p95: <500ms}` is accepted without any error, matches no samples, and therefore passes forever (verified on v2.3.0). This is the most dangerous kind of threshold bug because the run stays green.
- `check()` results are only recorded; without a `checks` threshold a failing check does not change the exit code.
- `abortOnFail` stops the run when the threshold is crossed; `delayAbortEval` gives the system time to warm up before the first evaluation.
- A threshold on a metric that never receives samples cannot fail: confirm every threshold shows data in the summary.

## 10. Keep the generator cheap

- `discardResponseBodies: true` in `options` (or `responseType: 'none'` per request) when bodies are not parsed.
- Avoid heavy JS per iteration (large JSON parsing, regex over big bodies, building huge strings).
- `http.batch()` for requests a browser would send in parallel; keep the connection reuse that k6 does by default.
- Do not run the generator on a laptop on Wi-Fi for anything above smoke: network and CPU noise end up in your latency numbers.

## 11. Outputs

- Always: `--summary-export=file.json` plus the console summary; read it with `scripts/summarize.py`.
- Raw per-sample files: `-o json=perf-results/raw.json` or `-o csv=perf-results/raw.csv`. They grow quickly (megabytes per minute at high rates); use for short diagnostic runs only and never paste them into a chat.
- For time-series dashboards (needed to see trends in soak tests and to line up with server metrics) use a streaming output such as Prometheus remote-write or OpenTelemetry. Output names change between k6 versions, so look up the current name in the docs for the pinned version.
- Record UTC start and end time of every run so server-side graphs can be lined up with the test.

## 12. CI gate

```yaml
# GitHub Actions example: pin the k6 image to an exact tag
- name: k6 smoke
  run: |
    docker run --rm -v "$PWD:/work" -w /work \
      -e BASE_URL=${{ vars.PERF_BASE_URL }} -e AUTH_TOKEN=${{ secrets.PERF_TOKEN }} -e PROBE_PATH=/health \
      grafana/k6:2.3.0 run perf/smoke.js
```

- Run `smoke.js` on every pull request (cheap, catches broken scripts and dead environments).
- Run load, stress, spike and soak on a schedule or on manual trigger against an approved environment, never on every commit.
- The job fails on exit code `99` (threshold crossed). Upload the summary JSON as an artifact.

## 13. k6 v2 notes

Removed in v2 (migration guide): the `externally-controlled` executor and the `k6 pause/resume/scale/status` commands; `--no-summary` (use `--summary-mode=disabled`; modes are `compact`, `full`, `disabled`); `--summary-mode=legacy`; `options.ext.loadimpact` (use `options.cloud`); `k6 login` and the positional `k6 cloud script.js` form; `k6/experimental/redis`; the `browser_web_vital_fid` metric. The REST API server no longer starts by default (`--address` enables it). Pin the k6 version in CI and review the migration guide before upgrading across a major version.

## 14. TypeScript

k6 runs `.ts` files directly (verified on v2.3.0): `k6 run script.ts`. Type annotations are stripped, not checked, so run `tsc --noEmit` in CI if you want type safety. Use the `k6` type definitions package for editor support. Keep imports from `k6/...` modules as usual.
