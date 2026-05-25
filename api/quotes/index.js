// api/quotes/index.js  (POST /api/quotes)
//
// Saves a presentation JSON to Vercel Blob storage under a deterministic key
// (`quotes/{id}.json`) and returns { id, url, shareUrl }. Used by the
// compliance-agent quote-generation workflow after Claude extracts the
// quote data from the carrier PDFs — that workflow POSTs the final
// presentation payload here so the React app can read it without any
// GitHub commit or Vercel redeploy cycle.
//
// Auth: requires `Authorization: Bearer ${QUOTE_GENERATION_TOKEN}`. Set the
// same secret on both ends (the compliance-agent's QUOTE_GENERATION_TOKEN
// env var and this app's QUOTE_GENERATION_TOKEN). Without this, anyone with
// the endpoint URL could overwrite arbitrary quote JSONs.

import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const expected = process.env.QUOTE_GENERATION_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: 'QUOTE_GENERATION_TOKEN not configured' });
  }
  const header = req.headers['authorization'] || '';
  const provided = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() || '';
  if (provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const data = JSON.parse(bodyText || '{}');
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // The server is the source of truth for the presentation ID — it sanitizes
    // the client name + timestamp + random suffix. We don't generate one here.
    const id = String(data?.id || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!id) {
      return res.status(400).json({ error: '`id` is required at the JSON root' });
    }

    const key = `quotes/${id}.json`;
    const blob = await put(key, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true,
    });

    const base = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;
    const shareUrl = `${base}/?id=${encodeURIComponent(id)}`;

    return res.status(201).json({ id, url: blob.url, shareUrl });
  } catch (e) {
    console.error('[api/quotes POST]', e);
    return res.status(500).json({ error: 'Failed to save quote' });
  }
}
