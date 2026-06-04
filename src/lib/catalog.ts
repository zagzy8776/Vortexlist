import { getSafeProxyAvailabilityFromWebshare } from "./providers/webshare";
import { getSafeIPRoyalCatalog } from "./providers/iproyal";
import { getSafeFiveSimCatalog } from "./providers/fivesim";
import { getSafeProxySellerCatalog } from "./providers/proxy-seller";
import { calculateSellingPriceKobo } from "./pricing";

export type PublicCatalogProduct = {
  id: string;
  countryCode?: string;
  name: string;
  type: string;
  country: string;
  priceLabel: string;
  availability: "Available" | "Limited" | "Unavailable";
  delivery: string;
  orderable: boolean;
};

function shouldShowProxyPreviewProducts() {
  return process.env.SHOW_PROXY_PREVIEWS === "true";
}

const DEFAULT_PROXY_PRICE_NAIRA = 5_000;
const DEFAULT_NUMBER_PRICE_NAIRA = 1_500;
const DEFAULT_PROXY_MARKUP_PERCENT = 40;
const DEFAULT_USD_TO_NAIRA_RATE = 1_600;
const DEFAULT_PROXY_EXCHANGE_BUFFER_PERCENT = 5;

const defaultCountryProxyPriceNaira: Record<string, number> = {
  NG: 5_000,
  IN: 6_500,
  BR: 7_500,
  TR: 8_000,
  ZA: 8_000,
  AE: 9_000,
  CA: 9_000,
  DE: 9_000,
  ES: 9_000,
  FR: 9_000,
  GB: 9_000,
  IT: 9_000,
  JP: 9_000,
  NL: 9_000,
  PL: 9_000,
  US: 9_000,
  AU: 10_000,
};

function parsePositiveNumber(value: string | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCountryPriceMap(value: string | undefined) {
  const prices = new Map<string, number>();

  for (const entry of value?.split(",") ?? []) {
    const [rawCode, rawPrice] = entry.split(":");
    const code = rawCode?.trim().toUpperCase();
    const price = parsePositiveNumber(rawPrice?.trim());

    if (code && price) {
      prices.set(code, price);
    }
  }

  return prices;
}

function getProxyBasePriceNaira(countryCode?: string) {
  const countryPrices = parseCountryPriceMap(process.env.PROXY_PRICE_NAIRA_BY_COUNTRY);
  const code = countryCode?.toUpperCase();

  if (code && countryPrices.has(code)) {
    return countryPrices.get(code) ?? DEFAULT_PROXY_PRICE_NAIRA;
  }

  if (code && defaultCountryProxyPriceNaira[code]) {
    return defaultCountryProxyPriceNaira[code];
  }

  return parsePositiveNumber(process.env.PROXY_PRICE_NAIRA) ?? DEFAULT_PROXY_PRICE_NAIRA;
}

function getMinimumProxyPriceNaira() {
  const supplierCostUsd = parsePositiveNumber(process.env.PROXY_SUPPLIER_COST_USD);

  if (!supplierCostUsd) {
    return null;
  }

  const usdToNairaRate = parsePositiveNumber(process.env.USD_TO_NAIRA_RATE) ?? DEFAULT_USD_TO_NAIRA_RATE;
  const markupPercent = parsePositiveNumber(process.env.PROXY_MARKUP_PERCENT) ?? DEFAULT_PROXY_MARKUP_PERCENT;
  const fixedMarkupUsd = parsePositiveNumber(process.env.PROXY_FIXED_MARKUP_USD) ?? 0;
  const exchangeBufferPercent = parsePositiveNumber(process.env.PROXY_EXCHANGE_BUFFER_PERCENT) ?? DEFAULT_PROXY_EXCHANGE_BUFFER_PERCENT;

  return calculateSellingPriceKobo({
    providerCostUsd: supplierCostUsd,
    usdToNgnRate: usdToNairaRate,
    markupPercent,
    fixedMarkupUsd,
    exchangeBufferPercent,
  }) / 100;
}

export function getProxyPriceKobo(product?: Pick<PublicCatalogProduct, "countryCode">) {
  const basePriceNaira = getProxyBasePriceNaira(product?.countryCode);
  const minimumPriceNaira = getMinimumProxyPriceNaira();
  const priceNaira = minimumPriceNaira ? Math.max(basePriceNaira, minimumPriceNaira) : basePriceNaira;

  if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
    return null;
  }

  return Math.round(priceNaira * 100);
}

export function formatProxyPriceLabel(product?: Pick<PublicCatalogProduct, "countryCode">) {
  const priceKobo = getProxyPriceKobo(product);

  if (!priceKobo) {
    return "Pricing unavailable";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(priceKobo / 100);
}

function getNumberBasePriceNaira(countryCode?: string) {
  const countryPrices = parseCountryPriceMap(process.env.NUMBER_PRICE_NAIRA_BY_COUNTRY);
  const code = countryCode?.toUpperCase();

  if (code && countryPrices.has(code)) {
    return countryPrices.get(code) ?? DEFAULT_NUMBER_PRICE_NAIRA;
  }

  return parsePositiveNumber(process.env.NUMBER_PRICE_NAIRA) ?? DEFAULT_NUMBER_PRICE_NAIRA;
}

export function getNumberPriceKobo(product?: Pick<PublicCatalogProduct, "countryCode">) {
  const priceNaira = getNumberBasePriceNaira(product?.countryCode);

  if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
    return null;
  }

  return Math.round(priceNaira * 100);
}

export function formatNumberPriceLabel(product?: Pick<PublicCatalogProduct, "countryCode">) {
  const priceKobo = getNumberPriceKobo(product);

  if (!priceKobo) {
    return "Pricing unavailable";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(priceKobo / 100);
}

export type PublicCatalogResult = {
  products: PublicCatalogProduct[];
  status: {
    ok: boolean;
    message: string;
  };
};

export async function getPublicProxyCatalog(): Promise<PublicCatalogResult> {
  // Supplier APIs stay behind this backend boundary. Customer responses must never
  // include supplier names, raw provider IDs, costs, or provider error messages.
  const [liveAvailability, proxySellerCatalog, ipRoyalCatalog] = await Promise.all([getSafeProxyAvailabilityFromWebshare(), getSafeProxySellerCatalog(), getSafeIPRoyalCatalog()]);
  const proxySellerOrderable = Boolean(process.env.PROXY_SELLER_API_KEY);
  const ipRoyalOrderable = Boolean(process.env.IPROYAL_API_KEY);
  const showPreviewProducts = shouldShowProxyPreviewProducts();
  const proxySellerProducts: PublicCatalogProduct[] = proxySellerCatalog.countries
    .filter(() => proxySellerOrderable || showPreviewProducts)
    .map((item) => ({
      id: `proxy-catalog-${item.sourceId}`,
      countryCode: item.code,
      name: `${item.country} Proxy Access`,
      type: "IPv4 proxy package",
      country: item.country,
      priceLabel: formatProxyPriceLabel({ countryCode: item.code }),
      availability: "Available" as const,
      delivery: proxySellerOrderable ? "Supplier order after wallet checkout" : "Preview only - ordering not connected yet",
      orderable: proxySellerOrderable,
    }));
  const ipRoyalProducts: PublicCatalogProduct[] = ipRoyalCatalog.countries
    .filter(() => ipRoyalOrderable || showPreviewProducts)
    .map((item) => ({
      id: `proxy-extra-${item.sourceId}`,
      countryCode: item.code,
      name: `${item.country} ${item.proxyType} Proxy Access`,
      type: `${item.proxyType} proxy package`,
      country: item.country,
      priceLabel: formatProxyPriceLabel({ countryCode: item.code }),
      availability: item.count > 10 ? "Available" as const : "Limited" as const,
      delivery: ipRoyalOrderable ? "Supplier order after wallet checkout" : "Preview only - ordering not connected yet",
      orderable: ipRoyalOrderable,
    }));
  const products: PublicCatalogProduct[] = [
    ...liveAvailability.countries.map((item) => ({
      id: `proxy-${item.code.toLowerCase()}`,
      countryCode: item.code,
      name: `${item.country} Proxy Access`,
      type: "Datacenter proxy package",
      country: item.country,
      priceLabel: formatProxyPriceLabel({ countryCode: item.code }),
      availability: item.count > 3 ? "Available" as const : "Limited" as const,
      delivery: "Fast secure delivery",
      orderable: true,
    })),
    ...proxySellerProducts,
    ...ipRoyalProducts,
  ];

  if (showPreviewProducts && process.env.SHOW_FREE_PROXY_PREVIEW !== "false") {
    products.push({
      id: "proxy-free-tools",
      countryCode: "US",
      name: "Free Proxy Starter Access",
      type: "Free proxy preview",
      country: "Global",
      priceLabel: "Free",
      availability: "Limited",
      delivery: "Free starter option - manual allocation while automated supply is pending",
      orderable: false,
    });
  }

  if (products.length > 0) {
    const orderableCount = products.filter((product) => product.orderable).length;

    return {
      status: {
        ok: true,
        message: orderableCount > 0
          ? showPreviewProducts
            ? "Live proxy catalog is available. Preview-only options are clearly marked and cannot be ordered yet."
            : "Live proxy catalog is available. Only orderable proxies are shown."
          : "Proxy catalog previews are available. Live ordering is being connected for these locations.",
      },
      products: products.slice(0, 48),
    };
  }

  return {
    products: [],
    status: {
      ok: false,
      message: liveAvailability.message || proxySellerCatalog.message || ipRoyalCatalog.message,
    },
  };
}

export async function getPublicNumberCatalogResult(): Promise<PublicCatalogResult> {
  const catalog = await getSafeFiveSimCatalog();
  const orderable = Boolean(process.env.FIVESIM_API_KEY ?? process.env.FIVE_SIM_API_KEY ?? process.env.FIVESIM_TOKEN ?? process.env.FIVE_SIM_TOKEN);

  const products = catalog.items.slice(0, 48).map((item) => ({
    id: `number-5sim-${item.sourceId}`,
    countryCode: item.countryCode,
    name: `${item.country} ${item.service} Number`,
    type: "SMS verification number",
    country: item.country,
    priceLabel: formatNumberPriceLabel({ countryCode: item.countryCode }),
    availability: item.count > 10 ? "Available" as const : "Limited" as const,
    delivery: orderable ? "Instant wallet checkout and SMS activation" : "Catalog preview - live delivery not connected yet",
    orderable,
  }));

  return {
    products,
    status: {
      ok: catalog.ok && products.some((product) => product.orderable),
      message: products.length === 0
        ? catalog.message
        : orderable
          ? "Live phone number catalog is available. Choose a country and service to buy with wallet."
          : "Phone number catalog preview is available, but live ordering is not connected. Check the 5sim API key environment variable.",
    },
  };
}

export async function getPublicNumberCatalog(): Promise<PublicCatalogProduct[]> {
  const catalog = await getPublicNumberCatalogResult();

  return catalog.products;
}