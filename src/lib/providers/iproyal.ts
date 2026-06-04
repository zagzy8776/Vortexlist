type IPRoyalPlan = {
  id?: number;
  name?: string;
  price?: number;
  min_quantity?: number;
  max_quantity?: number;
};

type IPRoyalLocation = {
  id?: number;
  name?: string;
  out_of_stock?: boolean;
  available_proxies_count?: number;
  child_locations?: IPRoyalLocation[];
};

type IPRoyalProduct = {
  id?: number;
  name?: string;
  plans?: IPRoyalPlan[];
  locations?: IPRoyalLocation[];
};

type IPRoyalProductsResponse = {
  data?: IPRoyalProduct[];
};

type IPRoyalError = {
  message?: string;
};

type IPRoyalOrderResponse = {
  data?: IPRoyalOrder;
  id?: number;
  errors?: IPRoyalError[];
};

type IPRoyalProxyData = {
  ports?: unknown;
  proxies?: Array<Record<string, unknown>>;
};

type IPRoyalOrder = {
  id?: number;
  note?: string | null;
  product_name?: string;
  plan_name?: string;
  expire_date?: string;
  status?: string;
  location?: string;
  locations?: unknown;
  quantity?: number;
  questions_answers?: unknown;
  proxy_data?: IPRoyalProxyData;
  auto_extend_settings?: unknown;
  extended_history?: unknown;
};

type SafeIPRoyalDelivery = {
  id: string;
  supplierOrderId: number | undefined;
  orderNumber: string | undefined;
  proxyHost: string | undefined;
  httpPort: number | undefined;
  socksPort: number | undefined;
  username: string | undefined;
  password: string | undefined;
  country: string | undefined;
  expiresAt: string | undefined;
  status: string | undefined;
};

export class IPRoyalPublicError extends Error {
  constructor(message = "Proxy supply is temporarily unavailable.") {
    super(message);
    this.name = "IPRoyalPublicError";
  }
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const countryNameToAlpha2: Record<string, string> = {
  australia: "AU",
  brazil: "BR",
  canada: "CA",
  france: "FR",
  germany: "DE",
  india: "IN",
  italy: "IT",
  japan: "JP",
  netherlands: "NL",
  nigeria: "NG",
  poland: "PL",
  south_africa: "ZA",
  spain: "ES",
  turkey: "TR",
  united_arab_emirates: "AE",
  united_kingdom: "GB",
  united_states: "US",
};

function getIPRoyalApiKey() {
  return process.env.IPROYAL_API_KEY;
}

function getIPRoyalQuantity() {
  const quantity = Number(process.env.IPROYAL_PROXY_QUANTITY ?? "1");

  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
}

function getIPRoyalDefaultQuestionAnswer() {
  return process.env.IPROYAL_PROXY_TARGET_NAME?.trim() || "General browsing";
}

function getIPRoyalErrorMessage(errors?: IPRoyalError[]) {
  return errors?.map((error) => error.message).filter(Boolean).join(" ") || "Proxy supplier request failed.";
}

async function ipRoyalFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const apiKey = getIPRoyalApiKey();

  if (!apiKey) {
    throw new Error("IPRoyal is not configured.");
  }

  const response = await fetch(`https://apid.iproyal.com/v1/reseller${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": apiKey,
      ...init?.headers,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    data: (await response.json()) as T,
  };
}

function normalizeLocationCode(name?: string) {
  const normalizedName = name?.trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");

  if (!normalizedName) {
    return undefined;
  }

  return countryNameToAlpha2[normalizedName];
}

function cleanProxyType(name?: string) {
  const cleanedName = name?.replace(/proxy|proxies/gi, "").trim();

  return cleanedName || "Proxy";
}

function flattenLocations(locations: IPRoyalLocation[] = []): IPRoyalLocation[] {
  return locations.flatMap((location) => [location, ...flattenLocations(location.child_locations)]);
}

function pickPlan(plans: IPRoyalPlan[] = []) {
  return plans
    .filter((plan): plan is IPRoyalPlan & { id: number } => Boolean(plan.id))
    .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))[0];
}

export async function getSafeIPRoyalCatalog() {
  const apiKey = getIPRoyalApiKey();

  if (!apiKey) {
    return {
      ok: false,
      message: "Additional proxy catalog source is not configured.",
      countries: [],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://apid.iproyal.com/v1/reseller/products", {
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": apiKey,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json()) as IPRoyalProductsResponse;

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        message: "Additional proxy catalog source is temporarily unavailable.",
        countries: [],
      };
    }

    const countries = (data.data ?? []).flatMap((product) => {
      const proxyType = cleanProxyType(product.name);
      const plan = pickPlan(product.plans);

      return flattenLocations(product.locations)
        .filter((location) => product.id && plan?.id && location.id && location.name && !location.out_of_stock)
        .map((location) => {
          const code = normalizeLocationCode(location.name);

          return code
            ? {
                sourceId: `${product.id}-${plan!.id}-${location.id}`,
                code,
                country: regionNames.of(code) ?? location.name!,
                proxyType,
                count: Number(location.available_proxies_count) || 1,
              }
            : null;
        })
        .filter((item): item is { sourceId: string; code: string; country: string; proxyType: string; count: number } => Boolean(item));
    });

    return {
      ok: true,
      statusCode: response.status,
      message: countries.length > 0 ? "Additional proxy catalog is available." : "No additional proxy catalog entries are currently available.",
      countries,
    };
  } catch {
    return {
      ok: false,
      message: "Additional proxy catalog source is temporarily unavailable.",
      countries: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function isIPRoyalProductId(productId: string) {
  return productId.startsWith("proxy-extra-");
}

export function getIPRoyalOrderPartsFromProductId(productId: string) {
  const [productIdValue, productPlanId, productLocationId] = productId.replace("proxy-extra-", "").split("-").map(Number);

  if (![productIdValue, productPlanId, productLocationId].every((value) => Number.isInteger(value) && value > 0)) {
    return null;
  }

  return {
    productId: productIdValue,
    productPlanId,
    productLocationId,
  };
}

export async function createIPRoyalOrder(input: { productId: number; productPlanId: number; productLocationId: number }) {
  const quantity = getIPRoyalQuantity();
  const body = {
    product_id: input.productId,
    product_plan_id: input.productPlanId,
    auto_extend: false,
    product_question_answers: {
      question_id_1: getIPRoyalDefaultQuestionAnswer(),
    },
    selection: {
      locations: [
        {
          product_location_id: input.productLocationId,
          quantity,
        },
      ],
    },
  };

  const response = await ipRoyalFetch<IPRoyalOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const order = response.data.data ?? response.data;

  if (!response.ok || !order?.id) {
    console.error("IPRoyal order failed", getIPRoyalErrorMessage(response.data.errors));
    throw new IPRoyalPublicError();
  }

  return order;
}

export async function getIPRoyalOrder(orderId: number) {
  const response = await ipRoyalFetch<IPRoyalOrderResponse>(`/orders/${encodeURIComponent(String(orderId))}`);
  const order = response.data.data ?? response.data;

  if (!response.ok || !order?.id) {
    console.error("IPRoyal order refresh failed", getIPRoyalErrorMessage(response.data.errors));
    throw new IPRoyalPublicError("Unable to refresh proxy delivery right now.");
  }

  return order;
}

export function getIPRoyalDelivery(order: IPRoyalOrder) {
  const proxies = order.proxy_data?.proxies ?? [];

  return proxies.length > 0
    ? proxies.map((proxy, index) => ({
        id: String(proxy.id ?? proxy.proxy_id ?? `${order.id}-${index}`),
        supplierOrderId: order.id,
        orderNumber: order.id ? String(order.id) : undefined,
        proxyHost: stringValue(proxy.ip ?? proxy.host ?? proxy.hostname ?? proxy.proxy),
        httpPort: numberValue(proxy.port_http ?? proxy.http_port ?? proxy.port),
        socksPort: numberValue(proxy.port_socks ?? proxy.socks_port),
        username: stringValue(proxy.username ?? proxy.login),
        password: stringValue(proxy.password),
        country: order.location,
        expiresAt: order.expire_date,
        status: order.status,
      })).filter((delivery): delivery is SafeIPRoyalDelivery => Boolean(delivery.proxyHost))
    : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}