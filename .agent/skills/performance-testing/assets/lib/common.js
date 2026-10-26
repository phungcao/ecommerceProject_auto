// lib/common.js — shared helpers for the k6 templates in this folder.
// Keep this file free of project-specific endpoints; those belong in lib/journey.js.
import { sleep } from 'k6';

// ---------------------------------------------------------------------------
// Env helpers. Load numbers are REQUIRED (no silent defaults) so that nobody can
// start a big run by accident: every number must come from the approved plan.
// ---------------------------------------------------------------------------
export function requireEnv(name) {
  const v = __ENV[name];
  if (v === undefined || v === '') {
    throw new Error(`Missing required env var ${name}. Declare it explicitly from the approved test plan (see docs/qa/perf.md).`);
  }
  return v;
}

export function requireNum(name) {
  const n = Number(requireEnv(name));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Env var ${name} must be a positive number, got "${__ENV[name]}".`);
  }
  return n;
}

export function optNum(name, fallback) {
  const raw = __ENV[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} must be a number, got "${raw}".`);
  return n;
}

export const BASE_URL = requireEnv('BASE_URL').replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// Durations: k6 wants strings like '30s' / '2m' / '1h30m'. Scenario start times must be
// computed by adding the previous phases, so keep one helper that does it correctly.
// ---------------------------------------------------------------------------
export function toSeconds(d) {
  const text = String(d);
  const re = /(\d+)(h|m|s)/g;
  const unit = { h: 3600, m: 60, s: 1 };
  let total = 0;
  let consumed = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    total += Number(m[1]) * unit[m[2]];
    consumed += m[0].length;
  }
  if (total <= 0 || consumed !== text.length) {
    throw new Error(`Bad duration "${d}". Use forms like 30s, 2m, 1h30m.`);
  }
  return total;
}

export function addDurations(...ds) {
  return `${ds.reduce((sum, d) => sum + toSeconds(d), 0)}s`;
}

// Hard ceiling from the approved plan (iterations/s). Refuse to start above it.
export function assertCeiling(peak, label = 'peak rate') {
  const max = requireNum('MAX_RPS');
  if (peak > max) {
    throw new Error(`${label} ${peak}/s exceeds the approved ceiling MAX_RPS=${max}/s. Lower the load or get the plan re-approved.`);
  }
}

// ---------------------------------------------------------------------------
// SLA thresholds. The defaults are ASSUMPTIONS until the system owner confirms them.
// ---------------------------------------------------------------------------
export const SLA = {
  p95Ms: optNum('SLA_P95_MS', 500),
  p99Ms: optNum('SLA_P99_MS', 1000),
  errorRate: optNum('SLA_ERROR_RATE', 0.01),
  guardErrorRate: optNum('GUARD_ERROR_RATE', 0.1), // kill-switch, deliberately looser than the SLA
};

function warnAssumedSla() {
  const assumed = ['SLA_P95_MS', 'SLA_P99_MS', 'SLA_ERROR_RATE'].filter((k) => __ENV[k] === undefined || __ENV[k] === '');
  if (assumed.length > 0) {
    console.warn(`ASSUMED SLA defaults in use for: ${assumed.join(', ')}. Confirm with the system owner before reporting pass/fail.`);
  }
}

// Pass/fail gate for ONE scenario (use the steady-state scenario, never the ramps).
// Latency is judged on successful responses only: failures are usually fast and would flatter the percentiles.
export function slaThresholds(scenario, { abortOnFail = false } = {}) {
  const s = `scenario:${scenario}`;
  const wrap = (expr) => (abortOnFail ? { threshold: expr, abortOnFail: true, delayAbortEval: '30s' } : expr);
  return {
    [`http_req_failed{${s}}`]: [wrap(`rate<${SLA.errorRate}`)],
    [`http_req_duration{${s},expected_response:true}`]: [wrap(`p(95)<${SLA.p95Ms}`), wrap(`p(99)<${SLA.p99Ms}`)],
    [`checks{${s}}`]: ['rate>0.99'],
    // Arrival-rate scenarios drop iterations when VUs run out: the offered load was NOT delivered, so the run is invalid.
    [`dropped_iterations{${s}}`]: ['count==0'],
  };
}

// Kill-switch for the whole run: stop hammering a system that is clearly failing.
export function guardThresholds() {
  return {
    http_req_failed: [{ threshold: `rate<${SLA.guardErrorRate}`, abortOnFail: true, delayAbortEval: '30s' }],
  };
}

// ---------------------------------------------------------------------------
// Auth + pacing helpers
// ---------------------------------------------------------------------------
// Tokens come from the environment (AUTH_TOKEN) or from a login call you add here; never hard-code them.
export function setupAuth(warnSla = true) {
  if (warnSla) warnAssumedSla();
  return { token: __ENV.AUTH_TOKEN || '' };
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const THINK_MIN_S = optNum('THINK_MIN_S', 1);
const THINK_MAX_S = optNum('THINK_MAX_S', 3);

// Think time BETWEEN steps of a journey (not after the last step: arrival-rate executors set the pace).
export function think() {
  sleep(THINK_MIN_S + Math.random() * Math.max(0, THINK_MAX_S - THINK_MIN_S));
}
