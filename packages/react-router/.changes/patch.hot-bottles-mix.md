Improve server-side route matching performance by pre-computing flattened/cached route branches ([#14967](https://github.com/remix-run/react-router/pull/14967))

- Performance benchmark
  - 100 route app, 3000 requests @ 10x concurrency across 38 distinct paths
  - `dev` branch
    - Throughput: 826.1 req/s
    - Latency mean: 10.227ms
    - Latency p50: 11.125ms
    - Latency p95: 13.056ms
    - Latency p99: 16.753ms
    - Latency min: 1.739ms
    - Latency max: 20.268ms
  - This branch
    - Throughput: 952.7 req/s (15.3% improvement)
    - Latency mean: 8.716ms (14.8% improvement)
    - Latency p50: 9.452ms
    - Latency p95: 11.610ms
    - Latency p99: 12.544ms
    - Latency min: 1.656ms
    - Latency max: 15.936ms
