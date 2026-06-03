type WebshareProxy = {
  id?: string;
  country_code?: string | null;
  valid?: boolean;
  proxy_address?: string;
  port?: number;
  username?: string;
  password?: string;
};

type WebshareProxyListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: WebshareProxy[];
};

export type SafeProxyAvailabilityResult = {
  ok: boolean;
  statusCode?: number;
  message: string;
  countries: Array<{
    code: string;
    country: string;
    count: number;
  }>;
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryNameFromCode(code: string) {
  return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
}

export async function getSafeProxyAvailabilityFromWebshare(): Promise<SafeProxyAvailabilityResult> {
  const apiKey = process.env.WEBSHARE_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      message: "Proxy supply is not configured.",
      countries: [],
    };
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
      return {
        ok: false,
        statusCode: response.status,
        message: "Proxy supply is temporarily unavailable.",
        countries: [],
      };
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

    return {
      ok: true,
      statusCode: response.status,
      message: countries.size > 0 ? "Proxy supply is available." : "No proxy supply is currently available.",
      countries: Array.from(countries.entries()).map(([code, count]) => ({
        code,
        country: countryNameFromCode(code),
        count,
      })),
    };
  } catch {
    console.error("Proxy availability request failed");
    return {
      ok: false,
      message: "Proxy supply is temporarily unavailable.",
      countries: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}