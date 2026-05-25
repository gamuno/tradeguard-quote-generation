// api/quotes/[id].js  (GET /api/quotes/:id)
//
// Returns the presentation JSON for a given Presentation ID. Source of
// truth: Vercel Blob at key `quotes/{id}.json` (written by the
// compliance-agent quote-generation workflow via POST /api/quotes).
//
// Lookup strategy:
//   1. If BLOB_STORE_HOSTNAME env var is set (e.g.
//      "jjgzh5dbfacsonbb.public.blob.vercel-storage.com"), fetch
//      https://{host}/{pathname} directly — deterministic since uploads
//      use addRandomSuffix:false + access:'public'.
//   2. Otherwise fall back to list({ prefix }) and use the blob.url it
//      returns. Slower (an extra round-trip) and brittle if @vercel/blob
//      changes prefix matching behavior between versions.

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const safeId = String(id || '').replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!safeId) return res.status(400).json({ error: 'id is required' });

  const key = `quotes/${safeId}.json`;
  console.log(`[api/quotes GET] id=${safeId} key=${key}`);

  try {
    let blobUrl = null;

    const directHost = process.env.BLOB_STORE_HOSTNAME;
    if (directHost) {
      blobUrl = `https://${directHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/${key}`;
      console.log(`[api/quotes GET] direct lookup ${blobUrl}`);
    } else {
      const { blobs } = await list({ prefix: key, limit: 10 });
      console.log(
        `[api/quotes GET] list returned ${blobs.length} blob(s): ` +
          blobs.map((b) => b.pathname).join(', ')
      );
      const match = blobs.find((b) => b.pathname === key) || blobs[0];
      if (match) blobUrl = match.url;
    }

    if (!blobUrl) {
      return res.status(404).json({ error: 'Quote not found', id: safeId });
    }

    const upstream = await fetch(blobUrl);
    console.log(`[api/quotes GET] fetched ${blobUrl} -> ${upstream.status}`);
    if (upstream.status === 404) {
      return res.status(404).json({ error: 'Quote not found', id: safeId });
    }
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: 'Failed to load quote from storage', upstream: upstream.status });
    }
    const json = await upstream.json();

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json(json);
  } catch (e) {
    console.error('[api/quotes GET]', e);
    return res.status(500).json({ error: 'Failed to fetch quote', detail: e?.message || String(e) });
  }
}
