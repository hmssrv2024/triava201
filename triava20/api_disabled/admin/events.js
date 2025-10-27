import { state } from '../data.js';

export default function handler(req, res) {
  const { token } = req.query || {};
  if (token !== state.sessionToken) {
    res.status(401).end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  state.sseClients.push(res);

  req.on('close', () => {
    const idx = state.sseClients.indexOf(res);
    if (idx !== -1) {
      state.sseClients.splice(idx, 1);
    }
  });
}
