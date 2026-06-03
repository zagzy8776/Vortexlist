export type ProviderSlug =
  | "webshare"
  | "proxy-seller"
  | "iproyal"
  | "twilio"
  | "5sim"
  | "tigersms"
  | "onlinesim"
  | "sms-man";

export type ProviderProduct = {
  externalId: string;
  name: string;
  category: "PROXY" | "PHONE_NUMBER" | "ESIM";
  countryCode?: string;
  costUsd: number;
  available: boolean;
};

export type ProviderOrderRequest = {
  productExternalId: string;
  quantity: number;
  countryCode?: string;
};

export type ProviderOrderResult = {
  externalOrderId: string;
  status: "pending" | "fulfilled" | "failed";
  delivery?: Record<string, unknown>;
};

export interface ProviderAdapter {
  slug: ProviderSlug;
  getBalance(): Promise<number | null>;
  listProducts(): Promise<ProviderProduct[]>;
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;
}