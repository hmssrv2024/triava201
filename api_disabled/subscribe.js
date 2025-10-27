import { state } from './data.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  state.pushSubscriptions.push(req.body);
  res.status(201).json({});
}
