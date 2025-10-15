// Serverless function on Vercel (Node runtime)
import data from '../../src/data/insurance-data.json' assert { type: 'json' };

export default function handler(req, res) {
  const { id } = req.query;

  // lookup by whatever field in your JSON is the canonical id
  // adjust "quoteId" if your JSON uses a different key
  const match =
    (data?.quotes || data?.policies || [])
      .find(q => String(q.quoteId || q.id) === String(id)) ||
    (data?.quote && (String(data.quote.quoteId || data.quote.id) === String(id)) ? data.quote : null) ||
    null;

  if (!match) {
    return res.status(404).json({ error: 'Quote not found', id });
  }

  // If your UI expects the whole presentation object, return that.
  // Otherwise return just the matched quote. Pick ONE of these:

  // A) Return full presentation object (what your UI uses):
  return res.status(200).json(data);

  // B) Or return just the matched item:
  // return res.status(200).json(match);
}
