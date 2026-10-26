// lib/journey.js — the user journey under test. >>> REPLACE the placeholder below. <<<
//
// Rules for a real journey:
//  - Endpoints, payloads and status codes come from Swagger / HAR / a manual curl, never from guesses.
//  - Tag every request that has a dynamic URL with `tags: { name: 'GET /items/:id' }`
//    (otherwise each distinct URL becomes its own metric series and the summary explodes).
//  - Add at least one check() per request; thresholds only see checks that exist.
//  - Call think() between steps to model a human; do not call it after the last step.
import http from 'k6/http';
import { check, group } from 'k6';
import { BASE_URL, authHeaders, requireEnv } from './common.js';

const PROBE_PATH = requireEnv('PROBE_PATH'); // placeholder only: remove together with the placeholder journey

export function journey(data) {
  const params = { headers: authHeaders(data.token), tags: { name: `GET ${PROBE_PATH}` } };
  group('placeholder: probe', () => {
    const res = http.get(`${BASE_URL}${PROBE_PATH}`, params);
    check(res, { 'status is 2xx': (r) => r.status >= 200 && r.status < 300 });
  });
}
