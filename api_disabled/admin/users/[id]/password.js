import { auth, broadcast } from '../../../data.js';
import { updateUserPassword } from '../../../db.js';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  if (req.method !== 'PUT') {
    res.status(405).end();
    return;
  }
  const id = parseInt(req.query?.id || req.params?.id, 10);
  const { password } = req.body || {};
  if (password) {
    const user = await updateUserPassword(id, password);
    if (user) {
      res.json({ success: true });
      const { password: _, ...safeUser } = user;
      broadcast({ type: 'userUpdated', user: safeUser });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } else {
    res.status(400).json({ error: 'Datos inválidos' });
  }
}
