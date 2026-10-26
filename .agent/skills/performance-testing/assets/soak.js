// soak.js — average load for a LONG time to expose leaks, pool exhaustion, log/disk growth and slow degradation.
// Client-side numbers alone cannot show the cause: watch server memory, connections, disk and GC at the same time.
// REQUIRES explicit approval (long run on a shared environment). Schedule it and tell the system owners.
// Required env: BASE_URL, TARGET_RPS, PRE_ALLOCATED_VUS, MAX_VUS, RAMP_UP, SOAK_DURATION
// Run:
//   k6 run -e BASE_URL=... -e TARGET_RPS=15 -e PRE_ALLOCATED_VUS=25 -e MAX_VUS=50 -e RAMP_UP=5m -e SOAK_DURATION=4h \
//          --summary-export=perf-results/soak.json soak.js
import { journey } from './lib/journey.js';
import { setupAuth, requireEnv, requireNum, addDurations, slaThresholds, guardThresholds } from './lib/common.js';

const RATE = requireNum('TARGET_RPS');
const PRE = requireNum('PRE_ALLOCATED_VUS');
const MAX = requireNum('MAX_VUS');
const RAMP_UP = requireEnv('RAMP_UP');
const SOAK_DURATION = requireEnv('SOAK_DURATION');

const base = { timeUnit: '1s', preAllocatedVUs: PRE, maxVUs: MAX };

export const options = {
  scenarios: {
    ramp_up: { ...base, executor: 'ramping-arrival-rate', startRate: 1, stages: [{ target: RATE, duration: RAMP_UP }] },
    soak: { ...base, executor: 'constant-arrival-rate', rate: RATE, duration: SOAK_DURATION, startTime: addDurations(RAMP_UP) },
  },
  thresholds: { ...slaThresholds('soak'), ...guardThresholds() },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  journey(data);
}
