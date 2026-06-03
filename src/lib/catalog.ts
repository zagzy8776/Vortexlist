import { getSafeProxyAvailabilityFromWebshare } from "./providers/webshare";

export type PublicCatalogProduct = {
  id: string;
  name: string;
  type: string;
  country: string;
  priceLabel: string;
  availability: "Available" | "Limited" | "Unavailable";
  delivery: string;
};

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
        name: `${item.country} Proxy Access`,
        type: "Proxy package",
        country: item.country,
        priceLabel: "Price shown at checkout",
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