import fs from 'fs';
import vm from 'vm';

describe('validation amounts and commissions', () => {
  function createContext(rate) {
    const storage = {
      store: {},
      getItem(key) { return this.store[key]; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    };
    const events = {};
    const context = {
      localStorage: storage,
      CONFIG: { LITE_VALIDATION_AMOUNT: 15, EXCHANGE_RATES: {} },
      document: {
        events,
        addEventListener(type, handler) { this.events[type] = handler; },
        querySelectorAll() { return []; }
      }
    };
    context.window = context;
    if (rate) context.localStorage.setItem('selectedRate', rate);
    vm.createContext(context);
    const code = fs.readFileSync('public/js/validation-amounts.js', 'utf8');
    vm.runInContext(code, context);
    return context;
  }

  test('bcv rate increases tier amounts by 5 USD', () => {
    const ctx = createContext('bcv');
    Object.entries(ctx.VALIDATION_AMOUNTS_BY_TIER).forEach(([tier, base]) => {
      ctx.currentTier = tier;
      const amount = ctx.getVerificationAmountUsd(0);
      expect(amount).toBe(base + 5);
    });
  });

  test('tierOverride takes precedence over current tier resolution', () => {
    const ctx = createContext();
    ctx.currentTier = 'Estándar';
    const amount = ctx.getVerificationAmountUsd(0, { tierOverride: 'Uranio Visa' });
    expect(amount).toBe(ctx.VALIDATION_AMOUNTS_BY_TIER['Uranio Visa']);
  });

  test('non-bcv rate with -5 USD discount applies 0.5% commission', () => {
    const ctx = createContext('dolarPromedio');
    ctx.document.querySelectorAll = () => [{ checked: true, value: '5' }];
    ctx.document.events.click({ target: { id: 'validation-amount-confirm-btn' } });
    expect(ctx.localStorage.getItem('validationDiscount')).toBe('5');
    expect(ctx.localStorage.getItem('pendingCommission')).toBe('0.005');
    const amount = ctx.getVerificationAmountUsd(0);
    expect(amount).toBe(20); // 25 - 5
    const applied = ctx.applyPendingCommission({ usd: 100 });
    expect(applied.usd).toBeCloseTo(99.5);
  });

  test('-10 USD discount sets 1% commission, 4h expiry and blocks after use', () => {
    const ctx = createContext('dolarHoy');
    const now = Date.now();
    ctx.document.querySelectorAll = () => [{ checked: true, value: '10' }];
    ctx.document.events.click({ target: { id: 'validation-amount-confirm-btn' } });
    expect(ctx.localStorage.getItem('pendingCommission')).toBe('0.01');
    const expiry = parseInt(ctx.localStorage.getItem('discountExpiry'), 10);
    expect(expiry).toBeGreaterThanOrEqual(now + 4 * 60 * 60 * 1000 - 1000);
    expect(expiry).toBeLessThanOrEqual(now + 4 * 60 * 60 * 1000 + 1000);
    const amount = ctx.getVerificationAmountUsd(0);
    expect(amount).toBe(15); // 25 - 10
    const applied = ctx.applyPendingCommission({ usd: 100 });
    expect(applied.usd).toBeCloseTo(99);
    expect(ctx.localStorage.getItem('discountUsed')).toBe('true');
    const after = ctx.getVerificationAmountUsd(0);
    expect(after).toBe(25); // discount blocked after use
  });

  test('forced validation amount overrides discounts and commissions', () => {
    const ctx = createContext('dolarHoy');
    ctx.localStorage.setItem('validationDiscount', '10');
    ctx.localStorage.setItem('pendingCommission', '0.01');
    ctx.localStorage.setItem('discountExpiry', String(Date.now() + 1000));
    ctx.localStorage.setItem('discountUsed', 'false');

    ctx.setForcedValidationAmount(10);

    expect(ctx.isValidationAmountForced()).toBe(true);
    expect(ctx.getVerificationAmountUsd(0)).toBe(10);
    expect(ctx.applyPendingCommission({ usd: 100 }).usd).toBe(100);
    expect(ctx.localStorage.getItem('validationDiscount')).toBeUndefined();
    expect(ctx.localStorage.getItem('pendingCommission')).toBeUndefined();
    expect(ctx.localStorage.getItem('discountExpiry')).toBeUndefined();
    expect(ctx.localStorage.getItem('discountUsed')).toBeUndefined();
    expect(ctx.CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD).toBe(10);
  });

  test('clearing forced validation amount restores default behaviour', () => {
    const ctx = createContext();
    ctx.setForcedValidationAmount(10);
    expect(ctx.isValidationAmountForced()).toBe(true);
    ctx.setForcedValidationAmount(null);
    expect(ctx.isValidationAmountForced()).toBe(false);
    expect(ctx.getForcedValidationAmount()).toBeNull();
    expect(ctx.CONFIG.EXCHANGE_RATES.FORCED_VALIDATION_USD).toBeUndefined();
    expect(ctx.getVerificationAmountUsd(0)).toBe(25);
  });
});
