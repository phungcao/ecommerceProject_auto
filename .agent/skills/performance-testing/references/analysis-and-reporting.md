# Analyzing results and writing the report

Contents: 1 Analysis order · 2 Metric glossary · 3 Symptom to hypothesis · 4 Comparing runs · 5 Result report template (Vietnamese) · 6 Performance issue template (Vietnamese)

## 1. Analysis order

Work top to bottom and stop at the first problem: a later step is meaningless if an earlier one fails.

1. **Was the run valid?** Check that the planned load was delivered (`dropped_iterations` is 0, achieved request rate matches the plan), the generator was not saturated (CPU, memory, network), the run was not aborted early, the environment and data matched the plan, and no one else was loading the system.
2. **Errors first.** Error rate, status code distribution, error types (timeouts, connection refused or reset, 429, 5xx). Failed requests are usually fast, so a high error rate makes the latency numbers look better than reality. Judge latency on successful responses (`expected_response:true`) and always report the error rate next to it.
3. **Latency distribution.** Report p50, p90, p95, p99 and max. Never headline the average: it hides the slow tail that users feel. Look at the steady phase only, not the ramps.
4. **Throughput.** Delivered requests per second against the target, and whether it plateaus while latency climbs (saturation).
5. **Trend over time.** Flat, climbing or sawtooth? In soak tests the shape matters more than the average. This needs a time-series output or a raw file; the end-of-test summary cannot show it.
6. **Correlate with the server side.** CPU, memory, GC, thread and connection pools, DB queries and locks, queue depth, cache hit rate, upstream latency, logs. Without it you can describe symptoms but cannot name a cause.
7. **Verdict.** Compare each SLA threshold with the measured value and say pass or fail per threshold. State the assumptions (assumed SLA numbers, environment differences from production).

Never claim a root cause that was not confirmed by server-side evidence. Write "hypothesis" and name the measurement that would confirm it.

## 2. Metric glossary (k6)

| Metric | Meaning | Note |
|---|---|---|
| `http_req_duration` | sending + waiting + receiving | Excludes DNS, TCP connect and TLS handshake |
| `http_req_waiting` | Time to first byte after the request was sent | Mostly server processing time |
| `http_req_sending` / `http_req_receiving` | Upload and download time | Large payloads or slow links show up here |
| `http_req_blocked` | Waiting for a free connection slot (and DNS) | High values point at connection limits or no keep-alive |
| `http_req_connecting` / `http_req_tls_handshaking` | TCP and TLS setup | High under load: new connections per request |
| `http_req_failed` | Rate of failed requests | Counts statuses outside the expected range, plus network errors |
| `http_reqs` | Request count and rate | A journey with several requests multiplies iterations |
| `iterations`, `iteration_duration` | Journey count and time | Includes think time |
| `dropped_iterations` | Iterations k6 could not start on schedule | Arrival-rate only; means offered load was not delivered |
| `vus`, `vus_max` | Active and reserved virtual users | `vus_max` is reserved per scenario |
| `checks` | Pass rate of `check()` calls | Needs a `checks` threshold to affect the exit code |

## 3. Symptom to hypothesis

Every row is a hypothesis to confirm with server-side data, not a diagnosis.

| What the data shows | Likely directions to investigate |
|---|---|
| Latency rises smoothly with load, no errors | Queueing on a saturated resource (CPU, DB connections, thread pool); find the first resource that hits its limit |
| Flat latency, then a sharp knee and errors at a specific rate | Capacity limit reached; pool or connection limit, autoscaling lag, rate limiter |
| Many `429` | Rate limiting or WAF protecting the system; the test measures the limiter, not the application |
| `connection refused`, resets, `i/o timeout` | Connection or file-descriptor limits on the server, load balancer limits, or a saturated generator |
| High `http_req_blocked` / `connecting` / TLS time | New connection per request (keep-alive off), TLS cost, DNS, or exhausted ephemeral ports on the generator |
| High `http_req_waiting` with low CPU on the app | Waiting on a downstream: database, third party, lock contention |
| High `http_req_receiving` | Large responses, no compression, slow link |
| Latency creeps up over hours (soak) | Memory leak, pool leak, growing tables or logs, cache churn |
| Regular spikes at fixed intervals | Garbage collection, scheduled jobs, cache expiry |
| Two distinct latency bands | Cache hit versus miss, or two instances with different performance |
| Good steady state but long recovery after a spike | Backlog draining, autoscaling lag, circuit breakers staying open |
| `dropped_iterations` > 0 | Not enough VUs for the rate, or the system slowed down; raise VUs or lower the rate and rerun |

## 4. Comparing runs

- Compare like with like: same environment, same data volume, same build or an explicitly named different one, same load profile, same k6 version.
- A single run is an anecdote. For baselines run at least three times and report the median with the spread. Ignore differences inside the run-to-run noise.
- Do not average percentiles across runs or instances; report each run, or merge raw samples.
- Record with every result: build or git SHA, environment, k6 version, command line, plan parameters, UTC start and end, data volume.

## 5. Result report template (Vietnamese)

Write the report in Vietnamese; keep metric names and code in English.

```md
## Báo cáo kiểm thử hiệu năng
- **Tóm tắt kết luận:** PASS / FAIL (một câu, kèm lý do chính)
- **Mục tiêu & phạm vi:** loại test (smoke/load/stress/spike/soak), hệ thống, các luồng nghiệp vụ được test
- **Môi trường:** URL, phiên bản/build, cấu hình so với production (khác biệt nếu có), máy phát tải
- **Mô hình tải:** executor, tốc độ/số VU, thời lượng, tỷ lệ luồng, think time, dữ liệu test
- **SLA áp dụng:** nguồn (chủ hệ thống xác nhận / GIẢ ĐỊNH), p95, p99, tỷ lệ lỗi
- **Kết quả so với SLA:**

| Chỉ số | Mục tiêu | Thực tế | Kết quả |
|---|---|---|---|
| p95 (ms, response thành công) | | | |
| p99 (ms) | | | |
| Tỷ lệ lỗi | | | |
| Throughput (req/s) | | | |
| Iterations bị bỏ (dropped) | 0 | | |

- **Tính hợp lệ của lần chạy:** tải thực tế có đạt kế hoạch không, máy phát tải có quá tải không, có bị dừng sớm không
- **Quan sát (có số liệu):** những gì dữ liệu cho thấy
- **Giả thuyết (chưa xác nhận):** nguyên nhân có thể, kèm số liệu phía server cần đo để xác nhận
- **Hạn chế & rủi ro:** khác biệt môi trường, dữ liệu, số lần chạy, SLA giả định
- **Khuyến nghị:** hành động tiếp theo, ưu tiên
- **Artifacts:** đường dẫn script, file kết quả JSON, lệnh chạy, phiên bản k6, thời gian chạy (UTC)
```

## 6. Performance issue template (Vietnamese)

Use when a system fails its SLA and the cause is in the application, not in the test.

```md
### [Hiệu năng][Module] Mô tả ngắn gọn vấn đề
- **Mức độ (Severity / Priority):** Critical/Major/Minor | P0/P1/P2
- **Điều kiện xảy ra:** tải (req/s hoặc VU), thời lượng, luồng, dữ liệu, môi trường, build
- **Hiện tượng (Actual):** số liệu đo được (p95/p99, tỷ lệ lỗi, mã lỗi) và thời điểm bắt đầu suy giảm
- **Mong đợi (Expected):** SLA hoặc baseline, nguồn của nó
- **Khả năng tái hiện:** số lần chạy lại và kết quả; lệnh k6 để chạy lại
- **Bằng chứng:** file summary JSON, biểu đồ, log, số liệu phía server nếu có
- **Giả thuyết nguyên nhân (chưa xác nhận):** ...
```
