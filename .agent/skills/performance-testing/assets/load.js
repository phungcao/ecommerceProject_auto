// load.js — average-load test, open model (arrival rate). Ramp-up -> steady -> ramp-down.
// SLA is judged on the STEADY phase only: ramps are warm-up/cool-down and would blur the verdict.
// Required env: BASE_URL, TARGET_RPS (iterations/s at steady state), PRE_ALLOCATED_VUS, MAX_VUS, RAMP_UP, STEADY, RAMP_DOWN
// Sizing: VUs needed ~= TARGET_RPS x average iteration seconds x 1.2 (iteration time includes think time).
// Note: k6 reserves VUs per scenario, so vus_max = 3 x PRE_ALLOCATED_VUS here.
// Run:
//   k6 run -e BASE_URL=... -e TARGET_RPS=20 -e PRE_ALLOCATED_VUS=30 -e MAX_VUS=60 \
//          -e RAMP_UP=2m -e STEADY=10m -e RAMP_DOWN=1m --summary-export=perf-results/load.json load.js
import { journey } from './lib/journey.js';
import { setupAuth, requireEnv, requireNum, addDurations, slaThresholds, guardThresholds } from './lib/common.js';

const RATE = requireNum('TARGET_RPS');
const PRE = requireNum('PRE_ALLOCATED_VUS');
const MAX = requireNum('MAX_VUS');
const RAMP_UP = requireEnv('RAMP_UP');
const STEADY = requireEnv('STEADY');
const RAMP_DOWN = requireEnv('RAMP_DOWN');

const base = { timeUnit: '1s', preAllocatedVUs: PRE, maxVUs: MAX };

export const options = {
  scenarios: {
    ramp_up: { ...base, executor: 'ramping-arrival-rate', startRate: 1, stages: [{ target: RATE, duration: RAMP_UP }] },
    steady: { ...base, executor: 'constant-arrival-rate', rate: RATE, duration: STEADY, startTime: addDurations(RAMP_UP) },
    ramp_down: {
      ...base,
      executor: 'ramping-arrival-rate',
      startRate: RATE,
      startTime: addDurations(RAMP_UP, STEADY),
      stages: [{ target: 1, duration: RAMP_DOWN }],
    },
  },
  thresholds: { ...slaThresholds('steady'), ...guardThresholds() },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  journey(data);
}
