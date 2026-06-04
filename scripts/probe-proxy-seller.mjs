import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const apiKey = env.PROXY_SELLER_API_KEY;
const paths = ["reference/list/ipv4", "order/list", "proxy/list"];

function summarize(value, depth = 0) {
  if (depth > 3) return typeof value;
  if (Array.isArray(value)) {
    return { type: "array", count: value.length, first: value.length > 0 ? summarize(value[0], depth + 1) : null };
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 12)
        .map(([key, item]) => [key, /pass|login|user|host|address/i.test(key) ? typeof item : summarize(item, depth + 1)]),
    );
  }
  return typeof value;
}

if (!apiKey) {
  console.log("PROXY_SELLER_API_KEY missing");
  process.exit(0);
}

for (const path of paths) {
  try {
    const response = await fetch(`https://proxy-seller.com/personal/api/v1/${encodeURIComponent(apiKey)}/${path}`, { cache: "no-store" });
    const text = await response.text();
    let shape = "";

    try {
      const json = JSON.parse(text);
      shape = JSON.stringify({ status: json.status, data: summarize(json.data), errorCount: Array.isArray(json.errors) ? json.errors.length : undefined });
    } catch {
      shape = `non-json ${text.slice(0, 80).replace(/\s+/g, " ")}`;
    }

    console.log(`${path} => HTTP ${response.status} ${shape}`);
  } catch (error) {
    console.log(`${path} => ERR ${error instanceof Error ? error.name : "Error"}`);
  }
}