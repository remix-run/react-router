/**
 * Server-side route matching benchmark.
 *
 * Usage:
 *   1. Build and start the server:
 *        pnpm build && pnpm start
 *   2. In another terminal, run this script:
 *        node scripts/bench.mjs [baseUrl] [requests] [concurrency]
 *
 * Examples:
 *   node scripts/bench.mjs
 *   node scripts/bench.mjs http://localhost:3000 5000 20
 */

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const TOTAL_REQUESTS = parseInt(process.argv[3] ?? "3000", 10);
const CONCURRENCY = parseInt(process.argv[4] ?? "10", 10);

// A representative sample of routes to exercise: static, dynamic (shallow),
// dynamic (deep), and a 404 path that must traverse the whole tree.
const ROUTES = [
  "/",
  "/about",
  "/pricing",
  "/login",
  "/account/settings",
  "/settings/profile",
  "/dashboard/overview",
  "/admin/dashboard",
  "/admin/analytics/content",
  "/admin/settings/security",
  "/products",
  "/search",
  "/posts/new",
  "/docs/getting-started",
  "/docs/api",
  "/notifications",
  "/users/user-42",
  "/users/user-42/profile",
  "/users/user-42/posts",
  "/users/user-42/followers",
  "/posts/post-99",
  "/posts/post-99/comments",
  "/posts/post-99/comments/comment-7",
  "/users/user-1/posts/post-2",
  "/categories/tech/posts",
  "/tags/javascript/posts",
  "/blog/my-first-post",
  "/blog/tag/webdev",
  "/products/widget-x/reviews",
  "/products/widget-x/reviews/review-5",
  "/orders/order-100/tracking",
  "/admin/users/admin-1/edit",
  "/admin/posts/post-50/edit",
  "/admin/comments/comment-3/delete",
  "/docs/api/authentication",
  "/messages/conv-42",
  "/settings/integrations/stripe",
  // 404 — must check all 100 routes before giving up
  "/this-path-does-not-exist-at-all",
];

function pickRoute(i) {
  return ROUTES[i % ROUTES.length];
}

function formatMs(ms) {
  return ms.toFixed(3) + "ms";
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runBatch(batchSize, baseUrl, routeOffset) {
  const latencies = [];
  const promises = [];

  for (let i = 0; i < batchSize; i++) {
    const url = baseUrl + pickRoute(routeOffset + i);
    const start = performance.now();
    promises.push(
      fetch(url, { signal: AbortSignal.timeout(5000) })
        .then(() => {
          latencies.push(performance.now() - start);
        })
        .catch(() => {
          latencies.push(performance.now() - start);
        })
    );
  }

  await Promise.all(promises);
  return latencies;
}

async function warmup(baseUrl, count = 50) {
  process.stdout.write("Warming up...");
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      fetch(baseUrl + pickRoute(i), { signal: AbortSignal.timeout(5000) }).catch(
        () => {}
      )
    );
  }
  await Promise.all(promises);
  process.stdout.write(" done\n");
}

async function main() {
  console.log(`\nReact Router server benchmark`);
  console.log(`  Base URL:    ${BASE_URL}`);
  console.log(`  Requests:    ${TOTAL_REQUESTS}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Routes pool: ${ROUTES.length} distinct paths\n`);

  // Verify server is reachable
  try {
    await fetch(BASE_URL + "/", { signal: AbortSignal.timeout(3000) });
  } catch {
    console.error(`Error: cannot reach ${BASE_URL}`);
    console.error("Make sure the server is running: pnpm build && pnpm start");
    process.exit(1);
  }

  await warmup(BASE_URL);

  const allLatencies = [];
  let completed = 0;
  const wallStart = performance.now();

  while (completed < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - completed);
    const latencies = await runBatch(batchSize, BASE_URL, completed);
    allLatencies.push(...latencies);
    completed += batchSize;
  }

  const wallElapsed = performance.now() - wallStart;
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const mean = allLatencies.reduce((s, v) => s + v, 0) / allLatencies.length;

  console.log("Results:");
  console.log(`  Total requests : ${completed}`);
  console.log(`  Wall time      : ${(wallElapsed / 1000).toFixed(2)}s`);
  console.log(
    `  Throughput     : ${((completed / wallElapsed) * 1000).toFixed(1)} req/s`
  );
  console.log(`  Latency mean   : ${formatMs(mean)}`);
  console.log(`  Latency p50    : ${formatMs(percentile(sorted, 50))}`);
  console.log(`  Latency p95    : ${formatMs(percentile(sorted, 95))}`);
  console.log(`  Latency p99    : ${formatMs(percentile(sorted, 99))}`);
  console.log(`  Latency min    : ${formatMs(sorted[0])}`);
  console.log(`  Latency max    : ${formatMs(sorted[sorted.length - 1])}`);
}

main();
