'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const ticker = document.getElementById('currencyTicker');
  const rateInfo = document.getElementById('mobileRate');
  if (!ticker) return;

  const tickerContainer = ticker.closest('.currency-ticker');
  if (tickerContainer) {
    const updatePosition = () => {
      document.body.style.paddingBottom = tickerContainer.offsetHeight + 'px';
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
  }

  let rates;
  try {
    const module = await import('/js/exchange-rates.js');
    rates = await module.getExchangeRates();
  } catch (e) {
    return;
  }

  const {
    bcv,
    euro = 0,
    cop = 0,
    gbp = 0,
    cny = 0,
    ars = 0,
    mxn = 0,
    usdt,
    euroDigital
  } = rates || {};

  if (!bcv) return;

  const format = n => n.toFixed(2).replace('.', ',');

  const binanceUsdt = bcv + 85;
  const binanceEuro = euro + 85;

  const isMobile = window.innerWidth <= 768;
  const tickerItems = isMobile
    ? [
        `BCV: ${format(bcv)} Bs`,
        `USDT: ${format(usdt)} Bs`,
        `Euro Digital: ${format(euroDigital)} Bs`
      ]
    : [
        `BCV: ${format(bcv)} Bs`,
        `USDT: ${format(usdt)} Bs`,
        `Euro: ${format(euro)} Bs`,
        `Euro Digital: ${format(euroDigital)} Bs`,
        `Binance USDT: ${format(binanceUsdt)} Bs`,
        `Binance Euro: ${format(binanceEuro)} Bs`
      ];

  tickerItems.push(
    `COP: $${format(cop)}`,
    `GBP: £${format(gbp)}`,
    `CNY: ¥${format(cny)}`,
    `ARS: $${format(ars)}`,
    `MXN: $${format(mxn)}`
  );

  const tickerHtml = tickerItems.map(t => `<span>${t}</span>`).join('');
  ticker.innerHTML = tickerHtml.repeat(2);

  if (rateInfo) {
    rateInfo.textContent = `BCV: ${format(bcv)} Bs | USDT: ${format(usdt)} Bs`;
  }
});
