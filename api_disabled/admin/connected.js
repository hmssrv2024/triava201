import { auth } from '../data.js';
import { getConnectedUsers } from '../db.js';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  const users = await getConnectedUsers();
  res.json({ connected: users.length, users });
}
