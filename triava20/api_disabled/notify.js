import { state, webpush } from './data.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const payload = JSON.stringify({
    title: 'Recarga exitosa por 500 USD, ahora valida tu cuenta y retira tus fondos a tu banco'
  });
  try {
    await Promise.all(state.pushSubscriptions.map(sub => webpush.sendNotification(sub, payload)));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
}
