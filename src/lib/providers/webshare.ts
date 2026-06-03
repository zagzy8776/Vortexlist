type WebshareProxy = {
  id?: string;
  country_code?: string | null;
  valid?: boolean;
};

type WebshareProxyListResponse = {
  results?: WebshareProxy[];
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryNameFromCode(code: string) {
  return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
}

export async function getSafeProxyAvailabilityFromWebshare() {
  const apiKey = process.env.WEBSHARE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch("https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=100", {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("Proxy availability request failed", response.status);
      return [];
    }

    const data = (await response.json()) as WebshareProxyListResponse;
    const countries = new Map<string, number>();

    for (const proxy of data.results ?? []) {
      const code = proxy.country_code?.toUpperCase();

      if (!code || proxy.valid === false) {
        continue;
      }

      countries.set(code, (countries.get(code) ?? 0) + 1);
    }

    return Array.from(countries.entries()).map(([code, count]) => ({
      code,
      country: countryNameFromCode(code),
      count,
    }));
  } catch {
    console.error("Proxy availability request failed");
    return [];
  } finally {
    clearTimeout(timeout);
  }
}