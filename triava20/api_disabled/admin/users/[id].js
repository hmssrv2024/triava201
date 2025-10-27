import { auth, broadcast } from '../../data.js';
import { getUser, deleteUser } from '../../db.js';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  const id = parseInt(req.query?.id || req.params?.id, 10);
  const user = await getUser(id);

  if (req.method === 'GET') {
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const removed = await deleteUser(id);
    if (removed) {
      res.json({ success: true });
      const { password: _, ...safeUser } = removed;
      broadcast({ type: 'userDeleted', user: safeUser });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return;
  }

  res.status(405).end();
}
