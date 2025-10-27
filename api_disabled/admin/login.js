import { state, ADMIN_USERNAME, ADMIN_PASSWORD } from '../data.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    state.sessionToken = Math.random().toString(36).substring(2);
    res.json({ token: state.sessionToken });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
}
