export type PublicCatalogProduct = {
  id: string;
  name: string;
  type: string;
  country: string;
  priceLabel: string;
  availability: "Available" | "Limited" | "Coming soon";
  delivery: string;
};

export async function getPublicProxyCatalog(): Promise<PublicCatalogProduct[]> {
  // Supplier APIs stay behind this backend boundary. Customer responses must never
  // include supplier names, raw provider IDs, costs, or provider error messages.
  return [
    {
      id: "proxy-us-starter",
      name: "US Proxy Starter",
      type: "Datacenter proxy",
      country: "United States",
      priceLabel: "From ₦4,500",
      availability: "Available",
      delivery: "Instant dashboard delivery",
    },
    {
      id: "proxy-uk-residential",
      name: "UK Residential Access",
      type: "Residential proxy",
      country: "United Kingdom",
      priceLabel: "From ₦7,500",
      availability: "Limited",
      delivery: "Fast secure delivery",
    },
    {
      id: "proxy-ng-mobile",
      name: "Nigeria Mobile Access",
      type: "Mobile proxy",
      country: "Nigeria",
      priceLabel: "Coming soon",
      availability: "Coming soon",
      delivery: "Join waitlist",
    },
  ];
}

export async function getPublicNumberCatalog(): Promise<PublicCatalogProduct[]> {
  return [
    {
      id: "number-us-sms",
      name: "US SMS Number",
      type: "Phone number",
      country: "United States",
      priceLabel: "From ₦1,500",
      availability: "Available",
      delivery: "Order tracking included",
    },
    {
      id: "number-uk-sms",
      name: "UK SMS Number",
      type: "Phone number",
      country: "United Kingdom",
      priceLabel: "From ₦1,800",
      availability: "Available",
      delivery: "Order tracking included",
    },
    {
      id: "number-ca-sms",
      name: "Canada SMS Number",
      type: "Phone number",
      country: "Canada",
      priceLabel: "From ₦1,700",
      availability: "Limited",
      delivery: "Order tracking included",
    },
  ];
}