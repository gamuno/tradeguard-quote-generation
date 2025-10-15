// api/quotes/[id].js  (GET /api/quotes/:id)
// Reads the JSON back for the frontend to render
import { get } from '@vercel/blob';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const key = `quotes/${id}.json`;
    const { url } = await get(key); // short-lived signed URL
    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).json({ error: 'Not found' });
    const json = await resp.json();
    return res.status(200).json(json);
  } catch (e) {
    console.error(e);
    return res.status(404).json({ error: 'Not found' });
  }
}
