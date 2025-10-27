export async function getExchangeRates() {
  let bcv = 0,
    cop = 0,
    gbp = 0,
    cny = 0,
    ars = 0,
    mxn = 0,
    usdToEur = 0;

  const stored = typeof window !== 'undefined' ? window.getStoredExchangeRate?.() : null;
  const dolarBinance = stored?.USD_TO_BS || 0;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    bcv = data?.rates?.VES || 0;
    cop = data?.rates?.COP || 0;
    gbp = data?.rates?.GBP || 0;
    cny = data?.rates?.CNY || 0;
    ars = data?.rates?.ARS || 0;
    mxn = data?.rates?.MXN || 0;
    usdToEur = data?.rates?.EUR || 0;
  } catch (e) {}

  let euro = 0;
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT');
    const data = await res.json();
    const eurUsd = parseFloat(data.price);
    if (!Number.isNaN(eurUsd) && bcv) {
      euro = eurUsd * bcv;
      if (!usdToEur && Number.isFinite(eurUsd) && eurUsd > 0) {
        usdToEur = 1 / eurUsd;
      }
    }
  } catch (e) {}

  if (!bcv) {
    return {
      bcv: 0,
      usdt: 0,
      euroDigital: 0,
      dolarPromedio: 0,
      dolarBinance,
      euro: 0,
      usdToEur,
      cop,
      gbp,
      cny,
      ars,
      mxn
    };
  }
  if (!euro) euro = bcv;
  if (!usdToEur && Number.isFinite(euro) && Number.isFinite(bcv) && euro > 0) {
    usdToEur = bcv / euro;
  }

  const usdt = bcv + 105;
  const euroDigital = euro + 105;
  const dolarPromedio = (usdt + euroDigital) / 2;

  const store = { bcv, usdt, euroDigital, dolarPromedio, dolarBinance, usdToEur };
  try { localStorage.setItem('exchangeRates', JSON.stringify(store)); } catch (e) {}

  return { ...store, euro, cop, gbp, cny, ars, mxn };
}

export default { getExchangeRates };
