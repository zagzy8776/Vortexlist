import { getSafeProxyAvailabilityFromWebshare } from "./providers/webshare";

export type PublicCatalogProduct = {
  id: string;
  countryCode?: string;
  name: string;
  type: string;
  country: string;
  priceLabel: string;
  availability: "Available" | "Limited" | "Unavailable";
  delivery: string;
};

export function getProxyPriceKobo() {
  const priceNaira = Number(process.env.PROXY_PRICE_NAIRA);

  if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
    return null;
  }

  return Math.round(priceNaira * 100);
}

export function formatProxyPriceLabel() {
  const priceKobo = getProxyPriceKobo();

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
  const liveAvailability = await getSafeProxyAvailabilityFromWebshare();

  if (liveAvailability.countries.length > 0) {
    return {
      status: {
        ok: true,
        message: "Live proxy catalog is available.",
      },
      products: liveAvailability.countries.slice(0, 24).map((item) => ({
        id: `proxy-${item.code.toLowerCase()}`,
        countryCode: item.code,
        name: `${item.country} Proxy Access`,
        type: "Proxy package",
        country: item.country,
        priceLabel: formatProxyPriceLabel(),
        availability: item.count > 3 ? "Available" : "Limited",
        delivery: "Fast secure delivery",
      })),
    };
  }

  return {
    products: [],
    status: {
      ok: false,
      message: liveAvailability.message,
    },
  };
}

export async function getPublicNumberCatalog(): Promise<PublicCatalogProduct[]> {
  return [];
}