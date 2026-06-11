const API_BASE = process.env.API_BASE ?? "http://localhost:4000/api/v1";
const VUS = Number(process.env.VUS ?? 20);
const REQUESTS = Number(process.env.REQUESTS ?? 100);

const results = [];
let errors = 0;

await runPool(VUS, REQUESTS, async () => {
  const startedAt = performance.now();
  const response = await fetch(`${API_BASE}/listings`);
  const durationMs = performance.now() - startedAt;
  results.push(durationMs);
  if (!response.ok) {
    errors += 1;
  } else {
    await response.arrayBuffer();
  }
});

report("catalogue", results, errors);

async function runPool(concurrency, total, job) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < total) {
      index += 1;
      await job();
    }
  });
  await Promise.all(workers);
}

function report(label, durations, errors) {
  const sorted = [...durations].sort((left, right) => left - right);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const avg = sorted.reduce((sum, value) => sum + value, 0) / Math.max(sorted.length, 1);

  console.log(JSON.stringify({
    label,
    totalRequests: sorted.length,
    errors,
    averageMs: round(avg),
    p50Ms: round(p50),
    p95Ms: round(p95),
  }, null, 2));
}

function percentile(sorted, target) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value) {
  return Math.round(value * 100) / 100;
}
