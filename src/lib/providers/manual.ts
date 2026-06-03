import type { ProviderAdapter, ProviderOrderRequest, ProviderOrderResult, ProviderProduct } from "./types";

export const manualProviderAdapter: ProviderAdapter = {
  slug: "webshare",
  async getBalance() {
    return null;
  },
  async listProducts(): Promise<ProviderProduct[]> {
    return [
      {
        externalId: "manual-datacenter-us",
        name: "US datacenter proxy starter pack",
        category: "PROXY",
        countryCode: "US",
        costUsd: 10,
        available: true,
      },
    ];
  },
  async createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult> {
    return {
      externalOrderId: `manual-${Date.now()}`,
      status: "pending",
      delivery: {
        note: "Manual fulfillment placeholder. Connect real provider API next.",
        request,
      },
    };
  },
};