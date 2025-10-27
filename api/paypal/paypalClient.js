import crypto from 'node:crypto';

class PayPalApiError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.name = 'PayPalApiError';
    this.status = status;
    if (details) {
      this.details = details;
    }
  }
}

function getBaseUrl() {
  const rawEnv = process.env.PAYPAL_ENV?.trim();

  if (!rawEnv) {
    if (process.env.NODE_ENV !== 'production') {
      return 'https://api-m.sandbox.paypal.com';
    }

    throw new PayPalApiError(
      'PAYPAL_ENV is required. Accepted values are "sandbox" or "production".',
      500
    );
  }

  const env = rawEnv.toLowerCase();

  if (env === 'sandbox') {
    return 'https://api-m.sandbox.paypal.com';
  }

  if (env === 'production' || env === 'live') {
    return 'https://api-m.paypal.com';
  }

  throw new PayPalApiError(
    `Unexpected PAYPAL_ENV value "${rawEnv}". Accepted values are "sandbox" or "production".`,
    500
  );
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PayPalApiError('PayPal credentials are not configured.', 500);
  }

  return { clientId, clientSecret };
}

async function getAccessToken() {
  const { clientId, clientSecret } = getCredentials();
  const baseUrl = getBaseUrl();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new PayPalApiError(
      payload?.error_description || payload?.error || 'Unable to authenticate with PayPal.',
      response.status,
      payload
    );
  }

  if (!payload?.access_token) {
    throw new PayPalApiError('PayPal did not return an access token.', 500, payload);
  }

  return payload.access_token;
}

function buildRequestHeaders(accessToken, extraHeaders = {}) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...extraHeaders
  };
}

function sanitizePurchaseUnits(purchaseUnits = []) {
  return purchaseUnits.map((unit) => {
    if (!unit || typeof unit !== 'object') {
      return unit;
    }
    const sanitized = { ...unit };
    if (sanitized.custom_id) {
      sanitized.custom_id = String(sanitized.custom_id).slice(0, 127);
    }
    if (sanitized.invoice_id) {
      sanitized.invoice_id = String(sanitized.invoice_id).slice(0, 127);
    }
    if (sanitized.soft_descriptor) {
      sanitized.soft_descriptor = String(sanitized.soft_descriptor).slice(0, 22);
    }
    if (sanitized.description) {
      sanitized.description = String(sanitized.description).slice(0, 127);
    }
    return sanitized;
  });
}

export async function createOrder(orderPayload = {}, { idempotencyKey } = {}) {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  const headers = buildRequestHeaders(accessToken, {
    'PayPal-Request-Id': idempotencyKey || crypto.randomUUID()
  });

  const body = {
    intent: orderPayload.intent || 'CAPTURE',
    purchase_units: sanitizePurchaseUnits(orderPayload.purchase_units || []),
    ...('application_context' in orderPayload
      ? { application_context: orderPayload.application_context }
      : {})
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new PayPalApiError(
      payload?.details?.[0]?.description || payload?.message || 'Unable to create PayPal order.',
      response.status,
      payload
    );
  }

  return payload;
}

export async function captureOrder(orderId, { idempotencyKey } = {}) {
  if (!orderId) {
    throw new PayPalApiError('orderId is required to capture a PayPal order.', 400);
  }

  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  const headers = buildRequestHeaders(accessToken, {
    'PayPal-Request-Id': idempotencyKey || crypto.randomUUID()
  });

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new PayPalApiError(
      payload?.details?.[0]?.description || payload?.message || 'Unable to capture PayPal order.',
      response.status,
      payload
    );
  }

  return payload;
}

export { PayPalApiError, getAccessToken };
