type FiveSimProduct = {
  Category?: string;
  Qty?: number;
  Price?: number;
};

type FiveSimProductsResponse = Record<string, Record<string, FiveSimProduct>>;

type FiveSimOrder = {
  id?: number;
  phone?: string;
  operator?: string;
  product?: string;
  price?: number;
  status?: string;
  expires?: string;
  sms?: Array<{
    created_at?: string;
    date?: string;
    sender?: string;
    text?: string;
    code?: string;
  }>;
};

export type SafeFiveSimCatalogItem = {
  sourceId: string;
  countryCode: string;
  country: string;
  countrySlug: string;
  productSlug: string;
  service: string;
  count: number;
  supplierPrice: number | undefined;
};

export type SafeFiveSimDelivery = {
  supplierOrderId: number | undefined;
  phoneNumber: string | undefined;
  service: string | undefined;
  operator: string | undefined;
  status: string | undefined;
  expiresAt: string | undefined;
  sms: Array<{
    sender: string | undefined;
    text: string | undefined;
    code: string | undefined;
    receivedAt: string | undefined;
  }>;
};

export class FiveSimPublicError extends Error {
  constructor(message = "Phone number supply is temporarily unavailable.") {
    super(message);
    this.name = "FiveSimPublicError";
  }
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const defaultCountries = ["usa", "england", "germany", "france", "nigeria"];
const defaultServices = ["telegram", "whatsapp", "google", "instagram", "facebook"];

const fiveSimCountryCodes: Record<string, string> = {
  australia: "AU",
  brazil: "BR",
  canada: "CA",
  england: "GB",
  france: "FR",
  germany: "DE",
  india: "IN",
  italy: "IT",
  japan: "JP",
  nigeria: "NG",
  poland: "PL",
  spain: "ES",
  turkey: "TR",
  usa: "US",
};

function getFiveSimApiKey() {
  return process.env.FIVESIM_API_KEY;
}

function parseCsv(value: string | undefined, fallback: string[]) {
  const items = value?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) ?? [];

  return items.length > 0 ? items : fallback;
}

function titleCase(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countryCodeFromSlug(slug: string) {
  return fiveSimCountryCodes[slug] ?? slug.slice(0, 2).toUpperCase();
}

function countryNameFromSlug(slug: string) {
  const code = countryCodeFromSlug(slug);

  return countryNames.of(code) ?? titleCase(slug);
}

async function fiveSimFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`https://5sim.net${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    data: (await response.json()) as T,
  };
}

export async function getSafeFiveSimCatalog() {
  const countries = parseCsv(process.env.NUMBER_COUNTRIES, defaultCountries);
  const services = new Set(parseCsv(process.env.NUMBER_SERVICES, defaultServices));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const results = await Promise.all(
      countries.map(async (countrySlug) => {
        const response = await fiveSimFetch<FiveSimProductsResponse>(`/v1/guest/products/${encodeURIComponent(countrySlug)}/any`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return [];
        }

        return Object.entries(response.data)
          .filter(([service, operators]) => services.has(service) && Object.values(operators).some((item) => Number(item.Qty) > 0))
          .map(([service, operators]) => {
            const availableOperators = Object.values(operators).filter((item) => Number(item.Qty) > 0);
            const cheapest = availableOperators.sort((a, b) => (Number(a.Price) || 0) - (Number(b.Price) || 0))[0];
            const count = availableOperators.reduce((total, item) => total + (Number(item.Qty) || 0), 0);
            const countryCode = countryCodeFromSlug(countrySlug);

            return {
              sourceId: `${countrySlug}-${service}`,
              countryCode,
              country: countryNameFromSlug(countrySlug),
              countrySlug,
              productSlug: service,
              service: titleCase(service),
              count,
              supplierPrice: cheapest?.Price,
            } satisfies SafeFiveSimCatalogItem;
          });
      }),
    );

    const items = results.flat();

    return {
      ok: items.length > 0,
      message: items.length > 0 ? "Live phone number catalog is available." : "No phone number catalog entries are currently available.",
      items,
    };
  } catch {
    return {
      ok: false,
      message: "Phone number catalog source is temporarily unavailable.",
      items: [] as SafeFiveSimCatalogItem[],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function isFiveSimProductId(productId: string) {
  return productId.startsWith("number-5sim-");
}

export function getFiveSimOrderPartsFromProductId(productId: string) {
  const [countrySlug, productSlug] = productId.replace("number-5sim-", "").split("-");

  if (!countrySlug || !productSlug) {
    return null;
  }

  return { countrySlug, productSlug };
}

export async function createFiveSimOrder(input: { countrySlug: string; productSlug: string }) {
  const apiKey = getFiveSimApiKey();

  if (!apiKey) {
    throw new FiveSimPublicError("Phone number ordering is not configured yet.");
  }

  const response = await fiveSimFetch<FiveSimOrder>(`/v1/user/buy/activation/${encodeURIComponent(input.countrySlug)}/any/${encodeURIComponent(input.productSlug)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok || !response.data?.id || !response.data?.phone) {
    throw new FiveSimPublicError();
  }

  return response.data;
}

export async function getFiveSimOrder(orderId: number) {
  const apiKey = getFiveSimApiKey();

  if (!apiKey) {
    throw new FiveSimPublicError("Phone number ordering is not configured yet.");
  }

  const response = await fiveSimFetch<FiveSimOrder>(`/v1/user/check/${encodeURIComponent(String(orderId))}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok || !response.data?.id) {
    throw new FiveSimPublicError("Unable to refresh SMS delivery right now.");
  }

  return response.data;
}

export function getFiveSimDelivery(order: FiveSimOrder): SafeFiveSimDelivery {
  return {
    supplierOrderId: order.id,
    phoneNumber: order.phone,
    service: order.product ? titleCase(order.product) : undefined,
    operator: order.operator,
    status: order.status,
    expiresAt: order.expires,
    sms: (order.sms ?? []).map((sms) => ({
      sender: sms.sender,
      text: sms.text,
      code: sms.code,
      receivedAt: sms.created_at ?? sms.date,
    })),
  };
}