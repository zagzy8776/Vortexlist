type SmsManApplication = {
  id?: number | string;
  application_id?: number | string;
  name?: string;
  title?: string;
  service?: string;
};

type SmsManPrice = {
  cost?: number | string;
  price?: number | string;
  count?: number | string;
  quantity?: number | string;
  available?: number | string;
};

type SmsManOrder = {
  request_id?: number | string;
  id?: number | string;
  number?: string;
  phone?: string;
  sms_code?: string;
  code?: string;
  sms?: string;
  message?: string;
  status?: string;
  error_code?: string;
  error_msg?: string;
  success?: boolean;
};

export type SafeSmsManCatalogItem = {
  sourceId: string;
  countryCode: string;
  country: string;
  countryId: number;
  applicationId: number;
  service: string;
  count: number;
  supplierPrice: number | undefined;
};

export type SafeSmsManDelivery = {
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

export class SmsManPublicError extends Error {
  constructor(message = "Phone number supply is temporarily unavailable.") {
    super(message);
    this.name = "SmsManPublicError";
  }
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const defaultCountries = ["US", "GB", "NG", "DE", "FR", "CA", "IN", "ES", "PL", "BR"];
const defaultServices = ["telegram", "whatsapp", "google", "instagram", "facebook", "twitter", "tiktok", "discord"];

const countryCodeToSmsManId: Record<string, number> = {
  RU: 1,
  UA: 2,
  KZ: 3,
  CN: 4,
  PH: 5,
  MM: 6,
  ID: 7,
  MY: 8,
  KE: 9,
  TZ: 10,
  VN: 10,
  KG: 11,
  US: 12,
  IL: 13,
  HK: 14,
  PL: 15,
  GB: 16,
  MG: 17,
  CD: 18,
  NG: 19,
  MO: 20,
  EG: 21,
  IN: 22,
  IE: 23,
  KH: 24,
  LA: 25,
  HT: 26,
  CI: 27,
  GM: 28,
  RS: 29,
  YE: 30,
  ZA: 31,
  RO: 32,
  CO: 33,
  EE: 34,
  AZ: 35,
  CA: 36,
  MA: 37,
  GH: 38,
  AR: 39,
  UZ: 40,
  CM: 41,
  TD: 42,
  DE: 43,
  LT: 44,
  HR: 45,
  SE: 46,
  IQ: 47,
  NL: 48,
  LV: 49,
  AT: 50,
  BY: 51,
  TH: 52,
  SA: 53,
  MX: 54,
  TW: 55,
  ES: 56,
  IR: 57,
  DZ: 58,
  SI: 59,
  BD: 60,
  SN: 61,
  TR: 62,
  CZ: 63,
  LK: 64,
  PE: 65,
  PK: 66,
  NZ: 67,
  GN: 68,
  ML: 69,
  VE: 70,
  ET: 71,
  MN: 72,
  BR: 73,
  AF: 74,
  UG: 75,
  AO: 76,
  CY: 77,
  FR: 78,
};

const serviceAliases: Record<string, string[]> = {
  telegram: ["telegram", "tg"],
  whatsapp: ["whatsapp", "wa"],
  google: ["google", "go", "gmail"],
  instagram: ["instagram", "ig"],
  facebook: ["facebook", "fb"],
  twitter: ["twitter", "x"],
  tiktok: ["tiktok", "tk"],
  discord: ["discord", "ds"],
};

function getSmsManApiKey() {
  return process.env.SMS_MAN_API_KEY ?? process.env.SMSMAN_API_KEY ?? process.env.SMS_MAN_TOKEN ?? process.env.SMSMAN_TOKEN;
}

function parseCsv(value: string | undefined, fallback: string[]) {
  const items = value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

  return items.length > 0 ? items : fallback;
}

function titleCase(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["data", "items", "countries", "applications", "list"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
    return Object.values(record).filter((item) => item && typeof item === "object") as T[];
  }

  return [];
}

async function smsManFetch<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const token = getSmsManApiKey();

  if (!token) {
    throw new SmsManPublicError("Phone number ordering is not configured yet.");
  }

  const url = new URL(`https://api.sms-man.com/control/${path}`);
  url.searchParams.set("token", token);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as T & { success?: boolean; error_code?: string; error_msg?: string };

  if (!response.ok || data.success === false) {
    console.error("SMS-MAN request failed", path, data.error_code, data.error_msg);
    throw new SmsManPublicError(data.error_code === "wrong_token" ? "Phone number provider key is invalid." : undefined);
  }

  return data;
}

function countryIdFromCode(code: string) {
  return countryCodeToSmsManId[code.toUpperCase()];
}

function countryCodeFromId(id: number) {
  return Object.entries(countryCodeToSmsManId).find(([, value]) => value === id)?.[0];
}

function applicationMatches(application: SmsManApplication, service: string) {
  const haystack = [application.name, application.title, application.service, application.id, application.application_id].map((item) => String(item ?? "").toLowerCase());
  const aliases = serviceAliases[service.toLowerCase()] ?? [service.toLowerCase()];

  return aliases.some((alias) => haystack.some((value) => value === alias || value.includes(alias)));
}

function priceFor(data: unknown, countryId: number, applicationId: number): SmsManPrice | null {
  const record = data as Record<string, unknown>;
  const candidates = [
    record[String(countryId)],
    record[countryId],
    record[String(applicationId)],
    record[applicationId],
    record.data,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      const byApp = nested[String(applicationId)] ?? nested[applicationId];
      if (byApp && typeof byApp === "object") return byApp as SmsManPrice;
      if ("cost" in nested || "price" in nested || "count" in nested) return nested as SmsManPrice;
    }
  }

  if ("cost" in record || "price" in record || "count" in record) return record as SmsManPrice;

  return null;
}

export async function getSafeSmsManCatalog() {
  const apiKey = getSmsManApiKey();

  if (!apiKey) {
    return {
      ok: false,
      message: "SMS-MAN phone number provider is not configured.",
      items: [] as SafeSmsManCatalogItem[],
    };
  }

  try {
    const configuredCountries = parseCsv(process.env.NUMBER_COUNTRIES ?? process.env.SMS_MAN_COUNTRIES ?? process.env.SMSMAN_COUNTRIES, defaultCountries);
    const countries = configuredCountries
      .map((item) => item.toUpperCase())
      .map((code) => ({ code, id: countryIdFromCode(code), country: regionNames.of(code) ?? code }))
      .filter((item): item is { code: string; id: number; country: string } => Boolean(item.id));
    const services = parseCsv(process.env.NUMBER_SERVICES ?? process.env.SMS_MAN_SERVICES ?? process.env.SMSMAN_SERVICES, defaultServices).map((item) => item.toLowerCase());
    const applicationsResponse = await smsManFetch<unknown>("applications");
    const applications = unwrapList<SmsManApplication>(applicationsResponse)
      .map((application) => ({
        ...application,
        id: numberValue(application.id ?? application.application_id),
        name: stringValue(application.name ?? application.title ?? application.service),
      }))
      .filter((application): application is SmsManApplication & { id: number; name: string } => Boolean(application.id && application.name));
    const items: SafeSmsManCatalogItem[] = [];

    for (const country of countries) {
      for (const service of services) {
        const application = applications.find((item) => applicationMatches(item, service));

        if (!application?.id) continue;

        let price: SmsManPrice | null = null;

        try {
          price = priceFor(await smsManFetch<unknown>("get-prices", { country_id: country.id, application_id: application.id }), country.id, application.id);
        } catch {
          price = null;
        }

        const count = numberValue(price?.count ?? price?.quantity ?? price?.available) ?? 1;

        if (count <= 0) continue;

        items.push({
          sourceId: `${country.id}-${application.id}`,
          countryCode: country.code,
          country: country.country,
          countryId: country.id,
          applicationId: application.id,
          service: titleCase(service),
          count,
          supplierPrice: numberValue(price?.cost ?? price?.price),
        });
      }
    }

    return {
      ok: items.length > 0,
      message: items.length > 0 ? "Live SMS-MAN phone number catalog is available." : "No SMS-MAN number catalog entries are currently available.",
      items,
    };
  } catch (error) {
    const message = error instanceof SmsManPublicError ? error.message : "SMS-MAN phone number catalog is temporarily unavailable.";

    return {
      ok: false,
      message,
      items: [] as SafeSmsManCatalogItem[],
    };
  }
}

export function isSmsManProductId(productId: string) {
  return productId.startsWith("number-smsman-");
}

export function getSmsManOrderPartsFromProductId(productId: string) {
  const [countryId, applicationId] = productId.replace("number-smsman-", "").split("-").map(Number);

  if (![countryId, applicationId].every((value) => Number.isInteger(value) && value > 0)) {
    return null;
  }

  return { countryId, applicationId };
}

export async function createSmsManOrder(input: { countryId: number; applicationId: number }) {
  const order = await smsManFetch<SmsManOrder>("get-number", {
    country_id: input.countryId,
    application_id: input.applicationId,
  });

  if (!order.request_id && !order.id) {
    throw new SmsManPublicError();
  }

  return order;
}

export async function getSmsManOrder(orderId: number) {
  return smsManFetch<SmsManOrder>("get-sms", { request_id: orderId });
}

export function getSmsManDelivery(order: SmsManOrder, fallback?: { service?: string; countryId?: number }): SafeSmsManDelivery {
  const code = stringValue(order.sms_code ?? order.code);
  const text = stringValue(order.sms ?? order.message);

  return {
    supplierOrderId: numberValue(order.request_id ?? order.id),
    phoneNumber: stringValue(order.number ?? order.phone),
    service: fallback?.service,
    operator: undefined,
    status: order.status ?? (code || text ? "received" : "waiting"),
    expiresAt: undefined,
    sms: code || text ? [{ sender: undefined, text, code, receivedAt: new Date().toISOString() }] : [],
  };
}

export function getSmsManCountryCode(countryId?: number) {
  return countryId ? countryCodeFromId(countryId) : undefined;
}