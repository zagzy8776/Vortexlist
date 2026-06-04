type SmsActivatePrice = {
  cost?: number | string;
  count?: number | string;
};

type SmsActivateStatus = {
  id?: number;
  phone?: string;
  service?: string;
  status?: string;
  sms?: string;
  code?: string;
};

export type SafeSmsActivateCatalogItem = {
  sourceId: string;
  countryCode: string;
  country: string;
  countryId: number;
  serviceCode: string;
  service: string;
  count: number;
  supplierPrice: number | undefined;
};

export type SafeSmsActivateDelivery = {
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

export class SmsActivatePublicError extends Error {
  constructor(message = "Phone number supply is temporarily unavailable.") {
    super(message);
    this.name = "SmsActivatePublicError";
  }
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const defaultCountries = ["US", "GB", "NG", "DE", "FR", "CA", "IN", "ES", "PL", "BR"];
const defaultServices = ["telegram", "whatsapp", "google", "instagram", "facebook", "twitter", "tiktok", "discord"];

const countryCodeToSmsActivateId: Record<string, number> = {
  RU: 0,
  UA: 1,
  KZ: 2,
  CN: 3,
  PH: 4,
  MM: 5,
  ID: 6,
  MY: 7,
  KE: 8,
  TZ: 9,
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

const serviceCodeByName: Record<string, string> = {
  telegram: "tg",
  whatsapp: "wa",
  google: "go",
  gmail: "go",
  instagram: "ig",
  facebook: "fb",
  twitter: "tw",
  x: "tw",
  tiktok: "lf",
  discord: "ds",
};

function getSmsActivateApiKey() {
  return process.env.SMS_ACTIVATE_API_KEY ?? process.env.SMSACTIVATE_API_KEY ?? process.env.SMS_ACTIVATE_TOKEN ?? process.env.SMSACTIVATE_TOKEN;
}

export function isSmsActivateConfigured() {
  return Boolean(getSmsActivateApiKey());
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

function getServiceCode(service: string) {
  const normalized = service.trim().toLowerCase().replace(/[^a-z]+/g, "");

  return serviceCodeByName[normalized] ?? normalized;
}

async function smsActivateFetch(action: string, params: Record<string, string | number | undefined> = {}) {
  const apiKey = getSmsActivateApiKey();

  if (!apiKey) {
    throw new SmsActivatePublicError("Phone number ordering is not configured yet.");
  }

  const url = new URL("https://api.sms-activate.org/stubs/handler_api.php");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("action", action);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();

  if (!response.ok || ["BAD_KEY", "NO_BALANCE", "NO_NUMBERS", "BAD_SERVICE", "BAD_ACTION"].some((errorCode) => text.startsWith(errorCode))) {
    throw new SmsActivatePublicError(text.startsWith("BAD_KEY") ? "Phone number provider key is invalid." : undefined);
  }

  return text;
}

export async function getSafeSmsActivateCatalog() {
  if (!isSmsActivateConfigured()) {
    return {
      ok: false,
      message: "SMS-Activate phone number provider is not configured.",
      items: [] as SafeSmsActivateCatalogItem[],
    };
  }

  try {
    const configuredCountries = parseCsv(process.env.NUMBER_COUNTRIES ?? process.env.SMS_ACTIVATE_COUNTRIES ?? process.env.SMSACTIVATE_COUNTRIES, defaultCountries);
    const countries = configuredCountries
      .map((item) => item.toUpperCase())
      .map((code) => ({ code, id: countryCodeToSmsActivateId[code], country: regionNames.of(code) ?? code }))
      .filter((item): item is { code: string; id: number; country: string } => Number.isInteger(item.id));
    const services = parseCsv(process.env.NUMBER_SERVICES ?? process.env.SMS_ACTIVATE_SERVICES ?? process.env.SMSACTIVATE_SERVICES, defaultServices);
    const items: SafeSmsActivateCatalogItem[] = [];

    for (const country of countries) {
      for (const serviceName of services) {
        const serviceCode = getServiceCode(serviceName);
        let price: SmsActivatePrice | null = null;

        try {
          const raw = await smsActivateFetch("getPrices", { country: country.id, service: serviceCode });
          const parsed = JSON.parse(raw) as Record<string, Record<string, SmsActivatePrice>>;
          price = parsed[String(country.id)]?.[serviceCode] ?? null;
        } catch {
          price = null;
        }

        const count = numberValue(price?.count) ?? 0;

        if (count <= 0) continue;

        items.push({
          sourceId: `${country.id}-${serviceCode}`,
          countryCode: country.code,
          country: country.country,
          countryId: country.id,
          serviceCode,
          service: titleCase(serviceName),
          count,
          supplierPrice: numberValue(price?.cost),
        });
      }
    }

    return {
      ok: items.length > 0,
      message: items.length > 0 ? "Live phone number catalog is available." : "No phone number catalog entries are currently available.",
      items,
    };
  } catch {
    return {
      ok: false,
      message: "Phone number catalog source is temporarily unavailable.",
      items: [] as SafeSmsActivateCatalogItem[],
    };
  }
}

export function isSmsActivateProductId(productId: string) {
  return productId.startsWith("number-smsactivate-");
}

export function getSmsActivateOrderPartsFromProductId(productId: string) {
  const [countryId, serviceCode] = productId.replace("number-smsactivate-", "").split("-");
  const parsedCountryId = Number(countryId);

  if (!Number.isInteger(parsedCountryId) || parsedCountryId < 0 || !serviceCode) {
    return null;
  }

  return { countryId: parsedCountryId, serviceCode };
}

export async function createSmsActivateOrder(input: { countryId: number; serviceCode: string }) {
  const text = await smsActivateFetch("getNumber", {
    country: input.countryId,
    service: input.serviceCode,
  });
  const [, id, phone] = text.split(":");

  if (!text.startsWith("ACCESS_NUMBER") || !id || !phone) {
    throw new SmsActivatePublicError();
  }

  return {
    id: Number(id),
    phone,
    service: input.serviceCode,
    status: "number_received",
  } satisfies SmsActivateStatus;
}

export async function getSmsActivateOrder(orderId: number, fallback?: { phoneNumber?: string; service?: string }) {
  const text = await smsActivateFetch("getStatus", { id: orderId });
  const [, code] = text.split(":");

  return {
    id: orderId,
    phone: fallback?.phoneNumber,
    service: fallback?.service,
    status: text.split(":")[0]?.toLowerCase(),
    code: text.startsWith("STATUS_OK") ? code : undefined,
    sms: text.startsWith("STATUS_OK") ? `SMS code: ${code}` : undefined,
  } satisfies SmsActivateStatus;
}

export function getSmsActivateDelivery(order: SmsActivateStatus, fallback?: { service?: string; phoneNumber?: string }): SafeSmsActivateDelivery {
  return {
    supplierOrderId: order.id,
    phoneNumber: order.phone ?? fallback?.phoneNumber,
    service: fallback?.service ?? order.service,
    operator: undefined,
    status: order.status,
    expiresAt: undefined,
    sms: order.code || order.sms ? [{ sender: undefined, text: order.sms, code: order.code, receivedAt: new Date().toISOString() }] : [],
  };
}
