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

export async function getPublicProxyCatalog(): Promise<PublicCatalogProduct[]> {
  // Supplier APIs stay behind this backend boundary. Customer responses must never
  // include supplier names, raw provider IDs, costs, or provider error messages.
  const liveAvailability = await getSafeProxyAvailabilityFromWebshare();

  if (liveAvailability.length > 0) {
    return liveAvailability.slice(0, 12).map((item) => ({
      id: `proxy-${item.code.toLowerCase()}`,
      name: `${item.country} Proxy Access`,
      type: "Proxy package",
      country: item.country,
      priceLabel: "View price in wallet",
      availability: item.count > 3 ? "Available" : "Limited",
      delivery: "Fast secure delivery",
    }));
  }

  return [];
}

export async function getPublicNumberCatalog(): Promise<PublicCatalogProduct[]> {
  return [];
}