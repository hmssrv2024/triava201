export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  res.setHeader('Set-Cookie', 'visaRegistered=true; HttpOnly; SameSite=Lax; Path=/');
  res.json({ success: true });
}
