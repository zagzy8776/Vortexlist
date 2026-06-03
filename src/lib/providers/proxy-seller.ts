type ProxySellerReferenceResponse = {
  status?: string;
  data?: {
    items?: {
      country?: Array<{
        id?: number;
        name?: string;
        alpha3?: string;
      }>;
    };
  };
  errors?: unknown[];
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const alpha3ToAlpha2: Record<string, string> = {
  USA: "US",
  GBR: "GB",
  CAN: "CA",
  AUS: "AU",
  DEU: "DE",
  FRA: "FR",
  NGA: "NG",
  ZAF: "ZA",
  BRA: "BR",
  IND: "IN",
  JPN: "JP",
  TUR: "TR",
  ARE: "AE",
  NLD: "NL",
  ESP: "ES",
  ITA: "IT",
  POL: "PL",
};

function cleanCountryName(name?: string, alpha3?: string): string {
  const alpha2 = alpha3 ? alpha3ToAlpha2[alpha3.toUpperCase()] : undefined;

  if (alpha2) {
    return regionNames.of(alpha2) ?? name?.replace(/^Proxy of\s+/i, "") ?? alpha3 ?? "Unknown";
  }

  return name?.replace(/^Proxy of\s+/i, "") ?? alpha3 ?? "Unknown";
}

export async function getSafeProxySellerCatalog() {
  const apiKey = process.env.PROXY_SELLER_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      message: "Proxy catalog source is not configured.",
      countries: [],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://proxy-seller.com/personal/api/v1/${encodeURIComponent(apiKey)}/reference/list/ipv4`, {
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json()) as ProxySellerReferenceResponse;

    if (!response.ok || data.status !== "success") {
      return {
        ok: false,
        statusCode: response.status,
        message: "Proxy catalog source is temporarily unavailable.",
        countries: [],
      };
    }

    const countries = (data.data?.items?.country ?? [])
      .filter((item): item is { id: number; name?: string; alpha3: string } => Boolean(item.id && item.alpha3))
      .map((item) => ({
        sourceId: String(item.id),
        code: item.alpha3,
        country: cleanCountryName(item.name, item.alpha3),
      }));

    return {
      ok: true,
      statusCode: response.status,
      message: countries.length > 0 ? "Proxy catalog is available." : "No proxy catalog entries are currently available.",
      countries,
    };
  } catch {
    return {
      ok: false,
      message: "Proxy catalog source is temporarily unavailable.",
      countries: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}