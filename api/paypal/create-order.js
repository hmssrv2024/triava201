import { createOrder, PayPalApiError } from './paypalClient.js';

function normaliseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed.toFixed(2);
}

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

  try {
    const {
      amount,
      currencyCode,
      description = 'Envío de remesa',
      purchase_units: purchaseUnits,
      intent = 'CAPTURE',
      metadata: rawMetadata = {},
      returnUrl,
      cancelUrl
    } = req.body || {};

    const metadata = rawMetadata && typeof rawMetadata === 'object' ? rawMetadata : {};
    const internalReference = pickString(
      metadata.internalReference || metadata.referenceId || metadata.reference,
      127
    ) || undefined;

    let normalizedPurchaseUnits = [];

    if (Array.isArray(purchaseUnits) && purchaseUnits.length > 0) {
      normalizedPurchaseUnits = purchaseUnits;
    } else {
      const normalizedAmount = normaliseAmount(amount);
      const sanitizedCurrency = pickString(currencyCode, 3)?.toUpperCase();

      if (!normalizedAmount || !sanitizedCurrency) {
        return res.status(400).json({
          error: 'Monto o currencyCode inválido para crear la orden de PayPal.'
        });
      }

      const purchaseUnit = {
        amount: {
          currency_code: sanitizedCurrency,
          value: normalizedAmount
        },
        description: pickString(description, 127) || 'Pago PayPal'
      };

      if (internalReference) {
        purchaseUnit.custom_id = internalReference;
      }

      const recipientName = pickString(metadata?.recipientName || metadata?.recipient?.fullName, 127);
      if (recipientName) {
        purchaseUnit.reference_id = recipientName;
      }

      const notes = pickString(metadata?.transferNotes, 127);
      if (notes) {
        purchaseUnit.description = notes;
      }

      normalizedPurchaseUnits = [purchaseUnit];
    }

    const applicationContext = {
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      brand_name: pickString(metadata?.brandName, 127) || 'Remeex Express',
      locale: 'es-ES'
    };

    const successUrl = pickString(returnUrl || metadata?.returnUrl);
    const cancelationUrl = pickString(cancelUrl || metadata?.cancelUrl);

    if (successUrl) {
      applicationContext.return_url = successUrl;
    }
    if (cancelationUrl) {
      applicationContext.cancel_url = cancelationUrl;
    }

    const orderPayload = {
      intent,
      purchase_units: normalizedPurchaseUnits,
      application_context: applicationContext
    };

    const paypalResponse = await createOrder(orderPayload, {
      idempotencyKey: internalReference
    });

    return res.status(200).json({
      orderID: paypalResponse?.id,
      status: paypalResponse?.status,
      intent: paypalResponse?.intent,
      links: paypalResponse?.links,
      reference: internalReference || null
    });
  } catch (error) {
    if (error instanceof PayPalApiError) {
      return res.status(error.status || 500).json({
        error: error.message,
        details: error.details || null
      });
    }

    return res.status(500).json({
      error: error?.message || 'Unexpected error creating PayPal order.'
    });
  }
}
