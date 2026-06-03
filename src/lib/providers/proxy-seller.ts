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

type ProxySellerError = {
  message?: string;
  field?: string;
};

type ProxySellerCalcResponse = {
  status?: string;
  data?: {
    warning?: string | null;
    balance?: number;
    total?: number;
    quantity?: number;
    currency?: string;
    price?: number;
  };
  errors?: ProxySellerError[];
};

type ProxySellerBalanceResponse = {
  status?: string;
  data?: {
    summ?: number;
  };
  errors?: ProxySellerError[];
};

type ProxySellerMakeResponse = {
  status?: string;
  data?: {
    orderId?: number;
    total?: number;
    balance?: number;
  };
  errors?: ProxySellerError[];
};

type ProxySellerProxy = {
  id?: number;
  order_id?: number;
  order_number?: string;
  ip?: string;
  port_http?: number;
  port_socks?: number;
  login?: string;
  password?: string;
  country?: string;
  date_start?: string;
  date_end?: string;
  status?: string;
};

type ProxySellerProxyListResponse = {
  status?: string;
  data?: {
    items?: ProxySellerProxy[];
    ipv4?: ProxySellerProxy[];
  };
  errors?: ProxySellerError[];
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const PROXY_SELLER_PROXY_TYPE = "ipv4";

function getProxySellerApiKey() {
  return process.env.PROXY_SELLER_API_KEY;
}

function getProxySellerPeriodId() {
  return process.env.PROXY_SELLER_IPV4_PERIOD_ID ?? "1m";
}

function getProxySellerQuantity() {
  const quantity = Number(process.env.PROXY_SELLER_IPV4_QUANTITY ?? "1");

  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
}

function getProxySellerErrorMessage(errors?: ProxySellerError[]) {
  return errors?.map((error) => error.message).filter(Boolean).join(" ") || "Proxy supplier request failed.";
}

async function proxySellerFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const apiKey = getProxySellerApiKey();

  if (!apiKey) {
    throw new Error("Proxy Seller is not configured.");
  }

  const response = await fetch(`https://proxy-seller.com/personal/api/v1/${encodeURIComponent(apiKey)}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    data: (await response.json()) as T,
  };
}

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
  HKG: "HK",
  CZE: "CZ",
  ARM: "AM",
  BGD: "BD",
  BEL: "BE",
  BGR: "BG",
  CHN: "CN",
  FIN: "FI",
  GEO: "GE",
  IDN: "ID",
  KAZ: "KZ",
  LVA: "LV",
  LTU: "LT",
  MYS: "MY",
};

function normalizeAlpha2(alpha3?: string) {
  if (!alpha3) {
    return undefined;
  }

  return alpha3ToAlpha2[alpha3.toUpperCase()] ?? alpha3.slice(0, 2).toUpperCase();
}

function cleanProviderCountryLabel(name?: string) {
  return name
    ?.replace(/^Proxy of\s+/i, "")
    .replace(/^Buy\s+/i, "")
    .replace(/\s+Proxy$/i, "")
    .trim();
}

function cleanCountryName(name?: string, alpha3?: string): string {
  const alpha2 = normalizeAlpha2(alpha3);

  if (alpha2) {
    return regionNames.of(alpha2) ?? cleanProviderCountryLabel(name) ?? alpha3 ?? "Unknown";
  }

  return cleanProviderCountryLabel(name) ?? alpha3 ?? "Unknown";
}

export async function getSafeProxySellerCatalog() {
  const apiKey = getProxySellerApiKey();

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
        code: normalizeAlpha2(item.alpha3) ?? item.alpha3,
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

export function isProxySellerProductId(productId: string) {
  return productId.startsWith("proxy-catalog-");
}

export function getProxySellerCountryIdFromProductId(productId: string) {
  const id = Number(productId.replace("proxy-catalog-", ""));

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function calculateProxySellerOrder(countryId: number) {
  const body = {
    countryId,
    periodId: getProxySellerPeriodId(),
    quantity: getProxySellerQuantity(),
  };

  const response = await proxySellerFetch<ProxySellerCalcResponse>("/order/calc", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok || response.data.status !== "success" || !response.data.data) {
    throw new Error(getProxySellerErrorMessage(response.data.errors));
  }

  if (response.data.data.warning) {
    throw new Error(response.data.data.warning);
  }

  return response.data.data;
}

export async function getProxySellerBalanceUsd() {
  const response = await proxySellerFetch<ProxySellerBalanceResponse>("/balance/get");

  if (!response.ok || response.data.status !== "success") {
    throw new Error(getProxySellerErrorMessage(response.data.errors));
  }

  const balance = Number(response.data.data?.summ);

  return Number.isFinite(balance) ? balance : 0;
}

export async function assertProxySellerCanFundOrder(totalUsd: number) {
  const balanceUsd = await getProxySellerBalanceUsd();

  if (balanceUsd < totalUsd) {
    throw new Error("Proxy supply is temporarily unavailable.");
  }

  return balanceUsd;
}

export async function createProxySellerOrder(countryId: number) {
  const body = {
    countryId,
    periodId: getProxySellerPeriodId(),
    quantity: getProxySellerQuantity(),
  };

  const response = await proxySellerFetch<ProxySellerMakeResponse>("/order/make", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok || response.data.status !== "success" || !response.data.data?.orderId) {
    throw new Error(getProxySellerErrorMessage(response.data.errors));
  }

  return response.data.data;
}

export async function getProxySellerDelivery(orderId: number) {
  const response = await proxySellerFetch<ProxySellerProxyListResponse>(`/proxy/list/${PROXY_SELLER_PROXY_TYPE}?orderId=${encodeURIComponent(String(orderId))}`);

  if (!response.ok || response.data.status !== "success") {
    return [];
  }

  const proxies = response.data.data?.items ?? response.data.data?.ipv4 ?? [];

  return proxies.map((proxy) => ({
    id: proxy.id,
    supplierOrderId: proxy.order_id,
    orderNumber: proxy.order_number,
    proxyHost: proxy.ip,
    httpPort: proxy.port_http,
    socksPort: proxy.port_socks,
    username: proxy.login,
    password: proxy.password,
    country: proxy.country,
    startsAt: proxy.date_start,
    expiresAt: proxy.date_end,
    status: proxy.status,
  }));
}