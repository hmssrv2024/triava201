import { auth, broadcast } from '../../data.js';
import { getUsers, createUser } from '../../db.js';

export default async function handler(req, res) {
  if (!auth(req, res)) return;

  if (req.method === 'GET') {
    const users = await getUsers();
    res.json({ users });
    return;
  }

  if (req.method === 'POST') {
    const { username, password, balance } = req.body || {};
    if (username && password && balance !== undefined) {
      const newUser = await createUser({ username, password, balance });
      res.status(201).json(newUser);
      const { password: _, ...safeUser } = newUser;
      broadcast({ type: 'userCreated', user: safeUser });
    } else {
      res.status(400).json({ error: 'Datos inválidos' });
    }
    return;
  }

  res.status(405).end();
}
