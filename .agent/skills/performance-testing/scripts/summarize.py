#!/usr/bin/env python3
"""Summarize a k6 `--summary-export` JSON file as a compact Markdown table.

Why this exists: the raw JSON is long and easy to misread. This prints only what the verdict needs
(latency percentiles, error rate, delivered load, dropped iterations, threshold results) so it can be
pasted into the report without dumping the whole file into the conversation.

Usage:
    python summarize.py perf-results/load.json --scenario steady

Run k6 with --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" or p(99) will be missing.
Validated against the k6 v2.3.0 summary-export format (flat metric objects; `thresholds` maps
expression -> true when the threshold was CROSSED). If a future version changes the format, read
the raw file instead of trusting this script.
"""
import argparse
import json
import sys


def find(metrics, base, scenario=None, expected=False):
    """Return (key, data) for the most specific sub-metric available, falling back to the global one."""
    candidates = []
    if scenario and expected:
        candidates.append(f"{base}{{scenario:{scenario},expected_response:true}}")
    if scenario:
        candidates.append(f"{base}{{scenario:{scenario}}}")
    if expected:
        candidates.append(f"{base}{{expected_response:true}}")
    candidates.append(base)
    for key in candidates:
        if key in metrics:
            return key, metrics[key]
    return None, {}


def fmt_ms(value):
    return "-" if value is None else f"{value:.1f}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("summary", help="path to the JSON written by `k6 run --summary-export=...`")
    ap.add_argument("--scenario", help="scenario to judge (e.g. steady). Defaults to whole-run metrics.")
    args = ap.parse_args()

    try:
        with open(args.summary, encoding="utf-8") as fh:
            metrics = json.load(fh)["metrics"]
    except (OSError, KeyError, json.JSONDecodeError) as exc:
        sys.exit(f"Cannot read a k6 summary-export file from {args.summary}: {exc}")

    lat_key, lat = find(metrics, "http_req_duration", args.scenario, expected=True)
    err_key, err = find(metrics, "http_req_failed", args.scenario)
    chk_key, chk = find(metrics, "checks", args.scenario)
    drop_key, drop = find(metrics, "dropped_iterations", args.scenario)
    reqs = metrics.get("http_reqs", {})
    iters = metrics.get("iterations", {})
    vus_max = metrics.get("vus_max", {})

    scope = f"scenario `{args.scenario}`" if args.scenario else "whole run"
    print(f"### k6 result summary ({scope})\n")

    print(f"Latency source: `{lat_key}` (successful responses only when the `expected_response` filter is present)\n")
    print("| avg ms | med ms | p90 ms | p95 ms | p99 ms | max ms |")
    print("|---|---|---|---|---|---|")
    print("| " + " | ".join(fmt_ms(lat.get(k)) for k in ("avg", "med", "p(90)", "p(95)", "p(99)", "max")) + " |")
    print()

    err_rate = err.get("value")
    failed = err.get("passes")  # for http_req_failed, a "pass" sample means the request FAILED
    total = (err.get("passes") or 0) + (err.get("fails") or 0)
    print("| Item | Value | Source |")
    print("|---|---|---|")
    print(f"| Error rate | {'-' if err_rate is None else f'{err_rate * 100:.2f}%'} ({failed} of {total} requests) | `{err_key}` |")
    if chk:
        total_checks = (chk.get("passes") or 0) + (chk.get("fails") or 0)
        print(f"| Checks passed | {(chk.get('value') or 0) * 100:.2f}% ({chk.get('passes')} of {total_checks}) | `{chk_key}` |")
    print(f"| Requests (whole run, incl. ramps) | {reqs.get('count', '-')} at {reqs.get('rate', 0):.2f}/s | `http_reqs` |")
    print(f"| Iterations (whole run) | {iters.get('count', '-')} at {iters.get('rate', 0):.2f}/s | `iterations` |")
    print(f"| Dropped iterations | {drop.get('count', 0)} | `{drop_key}` |")
    print(f"| VUs reserved (max) | {vus_max.get('max', vus_max.get('value', '-'))} | `vus_max` |")
    print()

    rows = []
    for name, data in metrics.items():
        for expr, crossed in (data.get("thresholds") or {}).items():
            rows.append((name, expr, bool(crossed)))
    if rows:
        print("| Threshold | Expression | Result |")
        print("|---|---|---|")
        for name, expr, crossed in rows:
            print(f"| `{name}` | `{expr}` | {'**FAIL**' if crossed else 'pass'} |")
        print()
    crossed_n = sum(1 for _, _, c in rows if c)
    print(f"**Verdict: {'ALL THRESHOLDS PASSED' if rows and not crossed_n else f'{crossed_n} THRESHOLD(S) CROSSED' if rows else 'NO THRESHOLDS DEFINED'}**\n")

    warnings = []
    if (drop.get("count") or 0) > 0:
        warnings.append("Dropped iterations > 0: the planned load was NOT delivered (too few VUs or a slow system). Do not treat this run as valid for the target rate.")
    if (err_rate or 0) > 0:
        warnings.append("Errors present: failed requests are usually fast, so latency above covers successful responses only. Look at the error breakdown first.")
    if lat and lat.get("p(99)") is None:
        warnings.append('p(99) missing: rerun with --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max".')
    if not rows:
        warnings.append("No thresholds were defined, so there is no automatic pass/fail. Define thresholds before reporting a verdict.")
    for w in warnings:
        print(f"- WARNING: {w}")


if __name__ == "__main__":
    main()
