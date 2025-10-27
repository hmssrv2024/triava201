import { broadcast } from './data.js';
import { getUser, logoutSession } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { id } = req.body || {};
  const user = await getUser(Number(id));
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  const updated = await logoutSession(user.id);
  res.json({ success: true });
  const { password: _, ...safeUser } = updated || user;
  broadcast({ type: 'logout', user: safeUser });
}
