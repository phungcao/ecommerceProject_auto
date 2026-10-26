// stress.js — step the arrival rate above the baseline to find where the system starts to break.
// REQUIRES explicit approval for the exact profile. The first SLA breach ABORTS the run (abortOnFail), so a degrading
// system is not hammered further; exit code 99 therefore means "breakpoint reached", not "script broken".
// Required env: BASE_URL, BASELINE_RPS, MAX_RPS (approved ceiling), PRE_ALLOCATED_VUS, MAX_VUS, STEP_DURATION
// Optional env: STEP_MULTIPLIERS (default "1,1.5,2"), STEP_RAMP (default "30s")
// Run:
//   k6 run -e BASE_URL=... -e BASELINE_RPS=20 -e MAX_RPS=60 -e PRE_ALLOCATED_VUS=40 -e MAX_VUS=120 \
//          -e STEP_DURATION=5m --summary-export=perf-results/stress.json stress.js
import { journey } from './lib/journey.js';
import { setupAuth, requireEnv, requireNum, assertCeiling, slaThresholds, guardThresholds } from './lib/common.js';

const BASELINE = requireNum('BASELINE_RPS');
const PRE = requireNum('PRE_ALLOCATED_VUS');
const MAX = requireNum('MAX_VUS');
const STEP_DURATION = requireEnv('STEP_DURATION');
const STEP_RAMP = __ENV.STEP_RAMP || '30s';
const MULTIPLIERS = (__ENV.STEP_MULTIPLIERS || '1,1.5,2').split(',').map((x) => Number(x.trim()));
if (MULTIPLIERS.some((m) => !Number.isFinite(m) || m <= 0)) throw new Error('STEP_MULTIPLIERS must be positive numbers, e.g. "1,1.5,2".');

const targets = MULTIPLIERS.map((m) => Math.max(1, Math.round(BASELINE * m)));
assertCeiling(Math.max(...targets), 'stress peak');

const stages = targets.flatMap((t) => [
  { target: t, duration: STEP_RAMP },
  { target: t, duration: STEP_DURATION },
]);

export const options = {
  scenarios: {
    stress: { executor: 'ramping-arrival-rate', timeUnit: '1s', startRate: 1, preAllocatedVUs: PRE, maxVUs: MAX, stages },
  },
  thresholds: { ...slaThresholds('stress', { abortOnFail: true }), ...guardThresholds() },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  journey(data);
}
