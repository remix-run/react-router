---
"react-router": patch
---

Improve route matching performance in Framework/Data Mode

- Avoiding unnecessary calls to `matchRoutes` in data router scenarios
  - This includes adding back the optimization that was removed in `7.6.0` ([#13562](https://github.com/remix-run/react-router/pull/13562))
  - The issues that prompted the revert have been addressed by using the available router `matches` but always updating `match.route` to the latest route in the `manifest`
- Leverage pre-computed pre-computing flattened/cached route branches during client side route matching
- This builds on top of prior server optimizations and provides an additional set of gains (~30%):
  - Original server optimizations branch
    - Throughput: 952.7 req/s
    - Latency mean: 8.716ms
    - Latency p50: 9.452ms
    - Latency p95: 11.610ms
    - Latency p99: 12.544ms
    - Latency min: 1.656ms
    - Latency max: 15.936ms
  - This branch
    - Throughput: 1235.3 req/s
    - Latency mean: 6.095ms
    - Latency p50: 6.655ms
    - Latency p95: 8.327ms
    - Latency p99: 12.133ms
    - Latency min: 1.066ms
    - Latency max: 19.056ms
