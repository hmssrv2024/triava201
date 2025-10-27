import webpush from 'web-push';

export const state = {
  pushSubscriptions: [],
  sessionToken: null,
  sseClients: []
};

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const VAPID_PUBLIC_KEY = 'BF_PCjGHa-lLDUDscV2Fmp9ciIfUPu6NDF2KgZzkCmujAHObRSgJjA0zGKKHdHJ3oNHEfc_wFvdT81jb05oYlX0';
const VAPID_PRIVATE_KEY = 'JYeCFTciuSI_HGluiHvBIxUVKe16AFJjCO5CuPQq9HA';
webpush.setVapidDetails('mailto:example@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { webpush, VAPID_PUBLIC_KEY };

export function auth(req, res) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (token && token === state.sessionToken) {
    return true;
  }
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

export function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  state.sseClients.forEach(res => {
    try {
      res.write(data);
    } catch {
      // ignore errors for closed connections
    }
  });
}
