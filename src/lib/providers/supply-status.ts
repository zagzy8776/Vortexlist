export function getPrivateSupplyStatus() {
  return {
    proxyPrimaryConfigured: Boolean(process.env.WEBSHARE_API_KEY),
    proxySecondaryConfigured: Boolean(process.env.PROXY_SELLER_API_KEY || process.env.IPROYAL_API_KEY),
    numbersConfigured: Boolean(process.env.FIVESIM_API_KEY || process.env.TIGERSMS_API_KEY || process.env.ONLINESIM_API_KEY || process.env.SMS_MAN_API_KEY),
    paymentsConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
  };
}