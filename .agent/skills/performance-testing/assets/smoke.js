// smoke.js — 1 VU, 2 iterations. Proves the script works and the system answers; says nothing about performance.
// Always run this first. Run:
//   k6 run -e BASE_URL=https://staging.example.com -e PROBE_PATH=/health smoke.js
// Required env: BASE_URL (+ PROBE_PATH while the placeholder journey is in use). Optional: AUTH_TOKEN.
import { journey } from './lib/journey.js';
import { setupAuth } from './lib/common.js';

export const options = {
  scenarios: {
    smoke: { executor: 'shared-iterations', vus: 1, iterations: 2, maxDuration: '1m' },
  },
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
  },
};

export function setup() {
  return setupAuth(false); // smoke does not judge the SLA
}

export default function (data) {
  journey(data);
}
