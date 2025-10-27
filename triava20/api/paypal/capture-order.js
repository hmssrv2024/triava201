import { captureOrder, PayPalApiError } from './paypalClient.js';
import { saveCaptureResult } from './storage.js';

function pickString(value, maxLength) {
  if (!value) return undefined;
  const stringValue = String(value).trim();
  if (!stringValue) return undefined;
  if (maxLength && stringValue.length > maxLength) {
    return stringValue.slice(0, maxLength);
  }
  return stringValue;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, payerID, metadata: rawMetadata = {} } = req.body || {};

  if (!orderID || typeof orderID !== 'string') {
    return res.status(400).json({ error: 'orderID es obligatorio para capturar la orden.' });
  }

  const metadata = rawMetadata && typeof rawMetadata === 'object' ? rawMetadata : {};
  const payer = {
    id: pickString(payerID, 64) || null,
    email: pickString(metadata?.payer?.email, 127) || null,
    name: pickString(metadata?.payer?.name, 127) || null
  };

  try {
    const paypalResponse = await captureOrder(orderID, {
      idempotencyKey: pickString(metadata.internalReference || metadata.referenceId || metadata.reference, 127)
    });

    const record = {
      orderID,
      status: paypalResponse?.status || null,
      capturedAt: new Date().toISOString(),
      payer,
      amount: metadata?.amount || null,
      currency: metadata?.currencyCode || null,
      metadata,
      paypalResponse
    };

    await saveCaptureResult(record);

    return res.status(200).json({
      ok: true,
      orderID,
      status: paypalResponse?.status,
      capture: paypalResponse
    });
  } catch (error) {
    if (error instanceof PayPalApiError) {
      return res.status(error.status || 500).json({
        error: error.message,
        details: error.details || null
      });
    }

    return res.status(500).json({
      error: error?.message || 'Unexpected error capturing PayPal order.'
    });
  }
}
