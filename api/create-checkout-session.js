// /api/create-checkout-session.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const {
      quoteId,                // your presentation id (?id=XYZ)
      client,                 // { name, email? }
      agent,                  // { email }
      selection,              // { plan: 'full' | number, policies: [{id,name,amountCents,totalPaidCents?}], grandTotalCents }
      makeWebhookUrl          // optional override; else env
    } = req.body;

    // Build metadata for later invoice creation & Make.com
    const metadata = {
      quote_id: String(quoteId || ''),
      client_name: String(client?.name || ''),
      agent_email: String(agent?.email || ''),
      plan: String(selection?.plan),
      grand_total_cents: String(selection?.grandTotalCents || 0),
      policies_json: JSON.stringify(selection?.policies || []),
      make_webhook_url: String(makeWebhookUrl || process.env.MAKE_WEBHOOK_URL || '')
    };

    // success/cancel URLs — use request headers to infer origin
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${origin}/presentation?${new URLSearchParams({ id: quoteId }).toString()}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',                                    // collect payment method only
      payment_method_types: ['card', 'us_bank_account'],
      customer_creation: 'always',                      // make sure a Customer is created
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(quoteId || ''),

      // Optional to prefill email on Checkout
      customer_email: client?.email || undefined,

      // Put everything you’ll need later into metadata
      metadata,
    });

    // simplest: return the URL to redirect client
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed_to_create_session' });
  }
}
