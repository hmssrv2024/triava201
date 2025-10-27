import { broadcast } from './data.js';
import { findUserByCredentials, addSession } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { username, password } = req.body || {};
  const user = await findUserByCredentials(username, password);
  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }
  const updated = await addSession(user.id);
  res.json({ id: user.id });
  const { password: _, ...safeUser } = updated || user;
  broadcast({ type: 'login', user: safeUser });
}
