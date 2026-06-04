const startedAt = new Date();
const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
const workerRunUrl = process.env.WORKER_RUN_URL;
const workerSecret = process.env.WORKER_SECRET;

console.log(`[worker] VortexList worker started at ${startedAt.toISOString()}`);
console.log(`[worker] Interval: ${intervalMs}ms`);

async function runWorkerTick() {
  const now = new Date().toISOString();

  if (!workerRunUrl || !workerSecret) {
    console.log(`[worker] heartbeat ${now}; WORKER_RUN_URL/WORKER_SECRET not configured`);
    return;
  }

  const response = await fetch(workerRunUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": workerSecret,
    },
    body: JSON.stringify({ startedAt: now }),
  });

  const body = await response.text();
  console.log(`[worker] tick ${now}; status=${response.status}; body=${body}`);
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