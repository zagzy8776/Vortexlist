export function getPrivateSupplyStatus() {
  return {
    proxySellerConfigured: Boolean(process.env.PROXY_SELLER_API_KEY),
    proxySellerOrderingConnected: Boolean(process.env.PROXY_SELLER_API_KEY),
    proxyPrimaryConfigured: Boolean(process.env.WEBSHARE_API_KEY),
    proxySecondaryConfigured: Boolean(process.env.PROXY_SELLER_API_KEY || process.env.IPROYAL_API_KEY),
    proxyPricingConfigured: Boolean(process.env.PROXY_SUPPLIER_COST_USD && process.env.USD_TO_NAIRA_RATE),
    numbersConfigured: Boolean(process.env.FIVESIM_API_KEY || process.env.FIVE_SIM_API_KEY || process.env.FIVESIM_TOKEN || process.env.FIVE_SIM_TOKEN || process.env.TIGERSMS_API_KEY || process.env.ONLINESIM_API_KEY || process.env.SMS_MAN_API_KEY || process.env.SMSMAN_API_KEY || process.env.SMS_MAN_TOKEN || process.env.SMSMAN_TOKEN),
    paymentsConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
  };
}