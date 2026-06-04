import { getSafeFiveSimCatalog, getFiveSimDelivery, getFiveSimOrder, createFiveSimOrder } from "./fivesim";
import { getSafeSmsActivateCatalog, getSmsActivateDelivery, getSmsActivateOrder, createSmsActivateOrder, isSmsActivateConfigured } from "./sms-activate";
import { getSafeSmsManCatalog, getSmsManDelivery, getSmsManOrder, createSmsManOrder } from "./sms-man";

export type NumberProviderSlug = "sms-man" | "5sim" | "sms-activate";

export type NumberProviderQuote = {
  provider: NumberProviderSlug;
  productId: string;
  countryCode: string;
  country: string;
  service: string;
  availableCount: number;
  supplierPrice: number | undefined;
  canCancel: boolean;
  orderParams: Record<string, string | number>;
};

export type NumberRoute = {
  id: string;
  countryCode: string;
  country: string;
  service: string;
  availableCount: number;
  supplierPrice: number | undefined;
  stockLabel: "High stock" | "Limited stock";
  orderable: boolean;
  routeCount: number;
  selectedQuote: NumberProviderQuote;
};

export type NumberDelivery = {
  supplierOrderId: number | undefined;
  phoneNumber: string | undefined;
  service: string | undefined;
  operator: string | undefined;
  status: string | undefined;
  expiresAt: string | undefined;
  sms: Array<{ sender: string | undefined; text: string | undefined; code: string | undefined; receivedAt: string | undefined }>;
};

const healthScore: Record<NumberProviderSlug, number> = {
  "sms-activate": 0.96,
  "5sim": 0.94,
  "sms-man": 0.92,
};

function isSmsManConfigured() {
  return Boolean(process.env.SMS_MAN_API_KEY ?? process.env.SMSMAN_API_KEY ?? process.env.SMS_MAN_TOKEN ?? process.env.SMSMAN_TOKEN);
}

function isFiveSimConfigured() {
  return Boolean(process.env.FIVESIM_API_KEY ?? process.env.FIVE_SIM_API_KEY ?? process.env.FIVESIM_TOKEN ?? process.env.FIVE_SIM_TOKEN);
}

function normalizeKey(quote: Pick<NumberProviderQuote, "countryCode" | "service">) {
  return `${quote.countryCode.toUpperCase()}::${quote.service.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

function compareQuotes(a: NumberProviderQuote, b: NumberProviderQuote) {
  const aPrice = a.supplierPrice ?? Number.MAX_SAFE_INTEGER;
  const bPrice = b.supplierPrice ?? Number.MAX_SAFE_INTEGER;

  if (a.availableCount !== b.availableCount && Math.max(a.availableCount, b.availableCount) <= 5) {
    return b.availableCount - a.availableCount;
  }

  if (aPrice !== bPrice) {
    return aPrice - bPrice;
  }

  return healthScore[b.provider] - healthScore[a.provider];
}

export async function getNumberProviderQuotes() {
  const [smsManCatalog, fiveSimCatalog, smsActivateCatalog] = await Promise.all([getSafeSmsManCatalog(), getSafeFiveSimCatalog(), getSafeSmsActivateCatalog()]);
  const quotes: NumberProviderQuote[] = [
    ...smsManCatalog.items.map((item) => ({
      provider: "sms-man" as const,
      productId: `number-smsman-${item.sourceId}`,
      countryCode: item.countryCode,
      country: item.country,
      service: item.service,
      availableCount: item.count,
      supplierPrice: item.supplierPrice,
      canCancel: false,
      orderParams: { countryId: item.countryId, applicationId: item.applicationId },
    })),
    ...fiveSimCatalog.items.map((item) => ({
      provider: "5sim" as const,
      productId: `number-5sim-${item.sourceId}`,
      countryCode: item.countryCode,
      country: item.country,
      service: item.service,
      availableCount: item.count,
      supplierPrice: item.supplierPrice,
      canCancel: false,
      orderParams: { countrySlug: item.countrySlug, productSlug: item.productSlug },
    })),
    ...smsActivateCatalog.items.map((item) => ({
      provider: "sms-activate" as const,
      productId: `number-smsactivate-${item.sourceId}`,
      countryCode: item.countryCode,
      country: item.country,
      service: item.service,
      availableCount: item.count,
      supplierPrice: item.supplierPrice,
      canCancel: true,
      orderParams: { countryId: item.countryId, serviceCode: item.serviceCode },
    })),
  ].filter((quote) => quote.availableCount > 0);

  return {
    quotes,
    configured: {
      "sms-man": isSmsManConfigured(),
      "5sim": isFiveSimConfigured(),
      "sms-activate": isSmsActivateConfigured(),
    },
    messages: [smsManCatalog.message, fiveSimCatalog.message, smsActivateCatalog.message].filter(Boolean),
  };
}

export async function getRoutedNumberCatalog() {
  const quoteResult = await getNumberProviderQuotes();
  const grouped = new Map<string, NumberProviderQuote[]>();

  for (const quote of quoteResult.quotes) {
    if (!quoteResult.configured[quote.provider]) continue;

    const key = normalizeKey(quote);
    grouped.set(key, [...(grouped.get(key) ?? []), quote]);
  }

  const routes = Array.from(grouped.values()).map((quotes) => {
    const sorted = [...quotes].sort(compareQuotes);
    const selectedQuote = sorted[0];
    const availableCount = quotes.reduce((total, quote) => total + quote.availableCount, 0);

    return {
      id: `number-route-${selectedQuote.countryCode.toLowerCase()}-${selectedQuote.service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      countryCode: selectedQuote.countryCode,
      country: selectedQuote.country,
      service: selectedQuote.service,
      availableCount,
      supplierPrice: selectedQuote.supplierPrice,
      stockLabel: availableCount > 10 ? "High stock" : "Limited stock",
      orderable: true,
      routeCount: quotes.length,
      selectedQuote,
    } satisfies NumberRoute;
  });

  return {
    routes: routes.sort((a, b) => b.availableCount - a.availableCount || a.country.localeCompare(b.country)).slice(0, 96),
    messages: quoteResult.messages,
  };
}

export async function getNumberRouteByPublicId(publicProductId: string) {
  const catalog = await getRoutedNumberCatalog();

  return catalog.routes.find((route) => route.id === publicProductId) ?? null;
}

export async function createNumberRouteOrder(route: NumberRoute) {
  const quote = route.selectedQuote;

  if (quote.provider === "sms-man") {
    const supplierOrder = await createSmsManOrder({ countryId: Number(quote.orderParams.countryId), applicationId: Number(quote.orderParams.applicationId) });

    return { provider: quote.provider, supplierOrder, delivery: getSmsManDelivery(supplierOrder, { service: route.service }) as NumberDelivery };
  }

  if (quote.provider === "sms-activate") {
    const supplierOrder = await createSmsActivateOrder({ countryId: Number(quote.orderParams.countryId), serviceCode: String(quote.orderParams.serviceCode) });

    return { provider: quote.provider, supplierOrder, delivery: getSmsActivateDelivery(supplierOrder, { service: route.service }) as NumberDelivery };
  }

  const supplierOrder = await createFiveSimOrder({ countrySlug: String(quote.orderParams.countrySlug), productSlug: String(quote.orderParams.productSlug) });

  return { provider: quote.provider, supplierOrder, delivery: getFiveSimDelivery(supplierOrder) as NumberDelivery };
}

export async function refreshNumberRouteOrder(input: { provider: string; supplierOrderId: number; productName?: string; phoneNumber?: string; service?: string }) {
  if (input.provider === "sms-man") {
    const supplierOrder = await getSmsManOrder(input.supplierOrderId);

    return { supplierOrder, delivery: getSmsManDelivery(supplierOrder, { service: input.service ?? input.productName }) as NumberDelivery };
  }

  if (input.provider === "sms-activate") {
    const supplierOrder = await getSmsActivateOrder(input.supplierOrderId, { phoneNumber: input.phoneNumber, service: input.service ?? input.productName });

    return { supplierOrder, delivery: getSmsActivateDelivery(supplierOrder, { service: input.service ?? input.productName, phoneNumber: input.phoneNumber }) as NumberDelivery };
  }

  if (input.provider === "5sim") {
    const supplierOrder = await getFiveSimOrder(input.supplierOrderId);

    return { supplierOrder, delivery: getFiveSimDelivery(supplierOrder) as NumberDelivery };
  }

  throw new Error("Unsupported number provider.");
}