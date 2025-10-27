import { getAccessToken, PayPalApiError } from './paypalClient.js';

function isDiagnosticsEnabled() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PAYPAL_TOKEN_ENDPOINT_ENABLED === 'true';
  }

  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isDiagnosticsEnabled()) {
    console.warn('PayPal token diagnostics endpoint blocked by configuration.');
    return res.status(403).json({ error: 'PayPal token diagnostics endpoint is disabled.' });
  }

  try {
    const accessToken = await getAccessToken();
    return res.status(200).json({ accessToken });
  } catch (error) {
    if (error instanceof PayPalApiError) {
      return res.status(error.status || 500).json({
        error: error.message,
        details: error.details || null
      });
    }

    console.error('Unexpected error retrieving PayPal access token.', error);
    return res.status(500).json({
      error: error?.message || 'Unexpected error retrieving PayPal access token.'
    });
  }
}
