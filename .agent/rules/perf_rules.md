# Performance Testing Rules (load · stress · spike · soak)

Load this file when the project's `Application Under Test` includes Performance. It adds to `AGENTS.md`; it does not replace it. The Approval Gate, the Truth Anchor and Vietnamese reporting from `AGENTS.md` still apply. The step-by-step procedure lives in the `performance-testing` skill; this file holds the constraints that must hold no matter which procedure is followed.

Default tool is **k6**. The principles in §1–§4 and §6–§9 are tool-agnostic. Keep this file in English; write reports to the user in Vietnamese.

**Differences from functional-test rules**
- `sleep()` is allowed in performance scripts for think time between user steps. The "no hard waits" rule is about UI synchronization, not about modeling users.
- A failing threshold is a result, not a script bug. Never "fix" it by moving the threshold.

---

## 1. Safety gate (highest priority)

A load test is traffic the target did not ask for. Treat it like a change to production.

1. **Authorization.** Run only against an environment the user has named and for which they confirm the owner approves load. Never run against production, shared staging, third-party services, or public sites you do not own, even a demo site, unless the owner has authorized it in writing.
2. **Declare before running.** Before any run above smoke, state: test type, target and owner, peak load (iterations/s, approx. requests/s, max VUs), duration, estimated total requests, data created or modified and the cleanup plan, third-party dependencies, kill-switch, and the load generator used. Then wait for an explicit "go" for that exact profile. A "go" for one profile is not a "go" for a heavier one.
3. **Escalate in steps.** Smoke (1 VU, a couple of iterations) → average load → stress, spike, soak or breakpoint. Never start with stress. Stress, spike, soak and breakpoint are never launched on the agent's own initiative: print the command, wait for "go".
4. **Hard caps in the script.** Every script has an upper bound on rate and VUs, a finite duration, and a kill-switch (`abortOnFail` on the error rate). The approved peak is an input to the script and the script refuses to exceed it. No unbounded loops or open-ended durations.
5. **Isolate third parties.** Payment, SMS, e-mail, captcha, analytics and similar services are stubbed or pointed at their sandbox. Never send load to them.
6. **Data safety.** Write traffic uses disposable, clearly marked test data (for example a `PERF-` prefix), never real customer data, real e-mail addresses, phone numbers or payment details. A cleanup path exists before the first write.
7. **Secrets.** Credentials and tokens come from environment variables or the CI secret store. They never appear in scripts, `AGENTS.md`, the Decision Log, results, logs, or reports.
8. **Notify and observe.** The owners know the window; monitoring on the target is available. If no server-side monitoring exists, say so in the report because it limits what can be concluded.
9. **Stop means stop.** If the kill-switch fires, errors spike unexpectedly, or the owner asks, stop the run. Never restart with a lowered threshold or a different target to "get a clean result".

---

## 2. Define "pass" before scripting

- Obtain the SLA from the system owner: latency percentiles, error rate, throughput target, and the load at which they must hold. If none exists, propose defaults (p95 < 500 ms, p99 < 1000 ms, error rate < 1%) and label them **assumed** in the script comment, the declaration and the report. Never present assumed numbers as agreed.
- Capture critical journeys and their traffic mix from analytics or logs, not from guesses.
- Record how the test environment differs from production (hardware, data volume, configuration, caches, third parties). A difference limits what the result proves.

---

## 3. Test types

| Type | Question | Shape |
|---|---|---|
| Smoke | Does the script work and the system answer? | 1 VU, a few iterations |
| Average load | Does the system meet the SLA at expected traffic? | Ramp up → steady → ramp down |
| Stress | Where does it start to break? | Stepped rates above baseline; aborts on first breach |
| Spike | Does it survive a sudden surge and recover? | Baseline → surge → baseline; recovery is judged |
| Soak | Does it degrade over hours? | Average load for a long time |
| Breakpoint | What is the maximum sustainable rate? | Rising rate until the abort threshold; owner sign-off |

---

## 4. Workload modeling

- **Open vs closed.** Use an arrival-rate executor when the requirement is a rate ("N orders/s") or for public-facing traffic: real users keep arriving when the system slows down. VU-based (closed) executors back off with the system and hide overload; use them only when the requirement is "N concurrent sessions".
- **Phases.** Every run has a ramp-up, a steady state and a ramp-down (or recovery). The SLA verdict is computed on the steady state only (or the "before" and "after" phases of a spike), never on the ramps.
- **Think time.** Model it between steps with a realistic range. Zero think time is a deliberate "hammer" test and needs separate approval.
- **Data realism.** Parameterize inputs. Spread reads across a realistic key space (otherwise you measure the cache). Make writes unique per VU and iteration.
- **Traffic mix.** Use weights taken from real traffic, not an even split.
- **Sizing.** `VUs ≈ rate × average iteration seconds × 1.2`. If the generator cannot deliver the rate (`dropped_iterations` > 0) the run is invalid for that target.

---

## 5. Script rules (k6)

- Structure: `options` → init (data loading) → `setup()` (auth once, returns shared data) → default function (the journey, with `check()` per request) → optional `teardown()` for cleanup.
- Configuration (`BASE_URL`, rates, durations, SLA numbers) comes from environment variables. Load numbers are **required** inputs with no silent defaults, so the script cannot run a profile nobody approved.
- Endpoints, headers and payloads come from Swagger, a HAR, or a verified request. Never guess them.
- **Always** pair `check()` with a `checks` threshold: a failing check alone does not change the exit code.
- Tag requests with dynamic URLs using `tags: { name: 'GET /items/:id' }`. Avoid high-cardinality tag values.
- Log in once (in `setup()` or once per VU), not every iteration, unless login is the system under test.
- Negative tests (expected 4xx) run in their own scenario with declared expected statuses so they do not pollute the error rate.
- Keep the generator cheap: `discardResponseBodies` when bodies are unused, no heavy per-iteration JavaScript.
- Pin the k6 version (CI image tag or installed version) and pin or vendor any remote imports. k6 v2 removed the `externally-controlled` executor, `--no-summary`, `options.ext.loadimpact` and `k6/experimental/redis`; check the migration guide before upgrading across a major version.
- Never leave debug output that prints tokens, payloads or personal data.

---

## 6. Thresholds and SLA

Threshold syntax is `metric{tag:value,tag2:value2}: ['aggregation<limit']`; the braces hold tag filters only.

```js
thresholds: {
  'http_req_failed{scenario:steady}': ['rate<0.01'],
  'http_req_duration{scenario:steady,expected_response:true}': ['p(95)<500', 'p(99)<1000'],
  'checks{scenario:steady}': ['rate>0.99'],
  'dropped_iterations{scenario:steady}': ['count==0'],
  http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' }], // kill-switch
}
```

- Notation such as `http_req_duration{p95: <500ms}` is **not** valid k6 syntax. k6 accepts it without an error, it matches no samples, and the threshold passes forever. Verify that every threshold shows data in the summary.
- Judge latency on successful responses (`expected_response:true`) and always report the error rate beside it; failures are fast and flatter the percentiles.
- Judge one scenario per verdict (the steady state). Add one threshold per critical endpoint using the `name` tag.
- The kill-switch threshold is deliberately looser than the SLA; its job is to stop a failing system from being hammered, not to produce the verdict.
- Thresholds are the gate: the exit code (`99` = a threshold crossed) is what CI trusts.
- Derive SLA numbers from a baseline taken from at least three runs plus the owner's requirement. Never from a single run.
- **Truth anchor.** If a threshold fails, report it. Do not loosen a threshold, shorten the steady state, lower the load, or exclude samples to get green. Changing an agreed SLA needs the owner's approval and is recorded in the report and the Decision Log.

---

## 7. Execution discipline

- Same environment, data volume, build and k6 version when comparing runs; otherwise say what differs.
- Warm up before measuring (ramp-up exists for this). Do not judge the first minutes.
- Baselines: at least three runs; report the median and the spread. A difference inside the noise is not a finding.
- Do not run two load tests against the same system at the same time, and do not run alongside other heavy jobs on the generator.
- Watch the generator: keep CPU comfortably below saturation (rule of thumb: under about 80%), watch memory and network. A saturated generator invalidates the run. Prefer a dedicated runner close to the target; avoid a laptop on Wi-Fi beyond smoke.
- Record for every run: UTC start and end, build or git SHA, environment, k6 version, full command, plan parameters, data volume. Server-side graphs can only be lined up with these.
- Run `--summary-export` with `--summary-trend-stats="avg,min,med,p(90),p(95),p(99),max"`. Raw per-sample outputs (`-o json=`, `-o csv=`) are for short diagnostic runs; never paste them into a conversation.

---

## 8. Analysis and claims

Order of analysis: **validity → errors → latency distribution → throughput → trend over time → server-side correlation → verdict.** Stop at the first failed step.

- A run is invalid if the planned load was not delivered (`dropped_iterations` > 0, achieved rate below plan), the generator was saturated, the run was aborted unexpectedly, or the environment differed from the plan. Rerun; do not interpret.
- Report p50, p90, p95, p99 and max. The average is never the headline. Do not average percentiles across runs or instances.
- **Symptom vs cause.** Do not name a root cause (database, GC, thread pool, network) without server-side evidence such as APM, logs or resource metrics. Without it, write "hypothesis" and name the measurement that would confirm it.
- Distinguish observation (a number from the run) from hypothesis (an unconfirmed explanation) from recommendation. Keep them in separate parts of the report.
- A single run is an anecdote. State the number of runs behind every claim.

---

## 9. Reporting (Vietnamese)

Deliver the standard post-task report from `AGENTS.md`, plus a performance section containing: verdict (PASS/FAIL) with the main reason; environment and its differences from production; load model and plan parameters; SLA with its source (confirmed or assumed); results against each threshold; run validity; observations; hypotheses; limitations and risks; recommendations; artifact paths (script, summary JSON, command, k6 version, UTC times). Use the templates in the `performance-testing` skill. File an application defect with the performance issue template only after the test itself has been ruled out.

---

## 10. Repository hygiene

- Suggested layout: `perf/` (scripts), `perf/lib/` (shared helpers and the journey), `perf/data/` (test data without secrets), `perf-results/` (outputs, git-ignored).
- Result files are git-ignored. Do not commit files that contain tokens, personal data, or very large raw outputs.
- Delete temporary files the agent created during the session (scratch scripts, raw dumps). Do not delete files you did not create.
- Record durable decisions (agreed SLA, approved load ceilings per environment, known environment limits) in the Decision Log of `AGENTS.md`. Do not record secrets or copied web content there.

---

## 11. Hard "Never" list

- Never run load without the declaration and an explicit "go" for that exact profile.
- Never target production, third parties, or systems the user does not own or has no authority over.
- Never start with stress, and never launch stress, spike, soak or breakpoint on your own initiative.
- Never run a script without a finite duration, a rate/VU ceiling and a kill-switch.
- Never hard-code or print secrets, tokens or personal data; never use real customer data for write traffic.
- Never loosen a threshold, cut the steady state, lower the load or drop samples to make a run pass.
- Never claim a root cause without server-side evidence.
- Never headline an average, or compare runs that differ in environment, data or build without saying so.
- Never trust a threshold that has not been seen to receive samples.
- Never rely on a run in which the generator was saturated or iterations were dropped.
