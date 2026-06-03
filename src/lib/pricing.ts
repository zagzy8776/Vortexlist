export function calculateSellingPriceKobo(input: {
  providerCostUsd: number;
  usdToNgnRate: number;
  markupPercent: number;
  fixedMarkupUsd?: number;
  exchangeBufferPercent?: number;
}) {
  const fixedMarkupUsd = input.fixedMarkupUsd ?? 0;
  const exchangeBufferPercent = input.exchangeBufferPercent ?? 5;
  const costWithFixedMarkupUsd = input.providerCostUsd + fixedMarkupUsd;
  const bufferedUsd = costWithFixedMarkupUsd * (1 + exchangeBufferPercent / 100);
  const markedUpUsd = bufferedUsd * (1 + input.markupPercent / 100);
  const naira = markedUpUsd * input.usdToNgnRate;

  return Math.ceil(naira * 100);
}