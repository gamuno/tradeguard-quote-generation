// api/quotes/[id].js  (GET /api/quotes/:id)
//
// Returns the presentation JSON for a given Presentation ID. Source of
// truth: Vercel Blob at key `quotes/{id}.json` (written by the
// compliance-agent quote-generation workflow via POST /api/quotes).
//
// Legacy quotes that were committed to public/quotes/ before the Blob
// migration are still served by Vercel as static files when the React app
// falls back to `/quotes/{id}.json` after a 404 here.

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const safeId = String(id || '').replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!safeId) return res.status(400).json({ error: 'id is required' });

  const key = `quotes/${safeId}.json`;

  try {
    // `list` with the exact pathname as prefix returns matching blobs. With
    // addRandomSuffix:false on writes, there's at most one match.
    const { blobs } = await list({ prefix: key, limit: 1 });
    const blob = blobs.find((b) => b.pathname === key) || blobs[0];
    if (!blob) {
      return res.status(404).json({ error: 'Quote not found', id: safeId });
    }

    const upstream = await fetch(blob.url);
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Failed to load quote from storage' });
    }
    const json = await upstream.json();

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json(json);
  } catch (e) {
    console.error('[api/quotes GET]', e);
    return res.status(500).json({ error: 'Failed to fetch quote' });
  }
}
