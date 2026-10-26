// spike.js — sudden surge, then back to normal. Question answered: does the system survive AND recover?
// Phases: before (baseline) -> spike (ramp up, hold, ramp down) -> after (baseline again).
// The SLA gate applies to `before` and `after`; during the spike only the kill-switch applies.
// REQUIRES explicit approval for the exact profile.
// Required env: BASE_URL, BASELINE_RPS, SPIKE_RPS, MAX_RPS (approved ceiling), PRE_ALLOCATED_VUS, MAX_VUS,
//               BASELINE_HOLD, SPIKE_RAMP, SPIKE_HOLD, RECOVERY
// Run:
//   k6 run -e BASE_URL=... -e BASELINE_RPS=10 -e SPIKE_RPS=50 -e MAX_RPS=60 -e PRE_ALLOCATED_VUS=30 -e MAX_VUS=100 \
//          -e BASELINE_HOLD=2m -e SPIKE_RAMP=10s -e SPIKE_HOLD=2m -e RECOVERY=5m --summary-export=perf-results/spike.json spike.js
import { journey } from './lib/journey.js';
import { setupAuth, requireEnv, requireNum, assertCeiling, addDurations, slaThresholds, guardThresholds } from './lib/common.js';

const BASELINE = requireNum('BASELINE_RPS');
const SPIKE = requireNum('SPIKE_RPS');
const PRE = requireNum('PRE_ALLOCATED_VUS');
const MAX = requireNum('MAX_VUS');
const BASELINE_HOLD = requireEnv('BASELINE_HOLD');
const SPIKE_RAMP = requireEnv('SPIKE_RAMP');
const SPIKE_HOLD = requireEnv('SPIKE_HOLD');
const RECOVERY = requireEnv('RECOVERY');
assertCeiling(SPIKE, 'spike peak');

const base = { timeUnit: '1s', preAllocatedVUs: PRE, maxVUs: MAX };
const spikeStart = addDurations(BASELINE_HOLD);
const afterStart = addDurations(BASELINE_HOLD, SPIKE_RAMP, SPIKE_HOLD, SPIKE_RAMP);

export const options = {
  scenarios: {
    before: { ...base, executor: 'constant-arrival-rate', rate: BASELINE, duration: BASELINE_HOLD },
    spike: {
      ...base,
      executor: 'ramping-arrival-rate',
      startRate: BASELINE,
      startTime: spikeStart,
      stages: [
        { target: SPIKE, duration: SPIKE_RAMP },
        { target: SPIKE, duration: SPIKE_HOLD },
        { target: BASELINE, duration: SPIKE_RAMP },
      ],
    },
    after: { ...base, executor: 'constant-arrival-rate', rate: BASELINE, duration: RECOVERY, startTime: afterStart },
  },
  thresholds: { ...slaThresholds('before'), ...slaThresholds('after'), ...guardThresholds() },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  journey(data);
}
