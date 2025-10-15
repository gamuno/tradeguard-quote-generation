// api/quotes/index.js  (POST /api/quotes)
// Creates a new quote JSON, returns { id, shareUrl }
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const data = JSON.parse(bodyText || '{}');
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid JSON' });

    // Create a safe ID (prefer quote number, else random)
    const fromQuote = data?.quote?.number?.toString()?.replace(/[^a-zA-Z0-9_-]/g, '')?.slice(0, 40);
    const id = fromQuote || nanoid(12);

    const key = `quotes/${id}.json`;
    await put(key, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    const base = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;
    const shareUrl = `${base}/?id=${encodeURIComponent(id)}`;

    return res.status(201).json({ id, shareUrl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save quote' });
  }
}
