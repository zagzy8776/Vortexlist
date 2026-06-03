const startedAt = new Date();
const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

console.log(`[worker] VortexList worker started at ${startedAt.toISOString()}`);
console.log(`[worker] Interval: ${intervalMs}ms`);

async function runWorkerTick() {
  const now = new Date().toISOString();

  // Placeholder for upcoming background jobs:
  // - Sync Webshare products/prices
  // - Check provider balances
  // - Retry failed orders
  // - Monitor provider API health
  // - Process wallet/deposit follow-up jobs
  console.log(`[worker] heartbeat ${now}`);
}

const timer = setInterval(() => {
  runWorkerTick().catch((error) => {
    console.error("[worker] tick failed", error);
  });
}, intervalMs);

runWorkerTick().catch((error) => {
  console.error("[worker] initial tick failed", error);
});

function shutdown(signal) {
  console.log(`[worker] received ${signal}; shutting down gracefully`);
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);