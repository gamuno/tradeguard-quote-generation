// /api/stripe-webhook.js
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } }; // raw body for signature verification

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => { resolve(data); });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Session was created in setup mode
      const customerId = session.customer;
      const setupIntentId = session.setup_intent;
      const metadata = session.metadata || {};
      const makeUrl = metadata.make_webhook_url;

      // Fetch setup intent to get the saved payment_method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      const paymentMethodId = setupIntent.payment_method;

      // Attach PM as default on customer (if not already)
      if (paymentMethodId && customerId) {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch(() => {});
        await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } }).catch(() => {});
      }

      // Build draft invoice (not charging)
      // Recreate line items from metadata
      const policies = JSON.parse(metadata.policies_json || '[]'); 
      // Each policy item should look like: { id, name, amountCents, totalPaidCents? }
      // For installment plan, you can choose to invoice grand total now or per policy totalPaid.
      const lineItems = (policies || []).map(p => ({
        customer: customerId,
        currency: 'usd',
        description: p.name,
        amount: Number(p.amountCents ?? p.totalPaidCents ?? 0),
      }));

      // Create invoice items
      for (const item of lineItems) {
        if (!item.amount || item.amount < 0) continue;
        await stripe.invoiceItems.create(item);
      }

      // Create invoice (send_invoice prevents autocharge)
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice', // do not auto charge
        auto_advance: false,               // we’ll finalize explicitly
        metadata: {
          quote_id: metadata.quote_id || '',
          plan: metadata.plan || '',
          agent_email: metadata.agent_email || '',
          grand_total_cents: metadata.grand_total_cents || '0',
        }
      });

      // Finalize so we get a hosted_invoice_url; do NOT send
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

      // Notify Make.com with everything you need for Airtable + Slack
      if (makeUrl) {
        await fetch(makeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'checkout_session_completed',
            client_reference_id: session.client_reference_id,
            quote_id: metadata.quote_id,
            client_name: metadata.client_name,
            plan: metadata.plan,
            grand_total_cents: metadata.grand_total_cents,
            policies: policies,
            stripe: {
              customer_id: customerId,
              setup_intent_id: setupIntentId,
              payment_method_id: paymentMethodId,
              invoice_id: finalized.id,
              hosted_invoice_url: finalized.hosted_invoice_url
            }
          })
        }).catch(() => {});
      }
    }

    // 200 for all events we handle/don’t care about
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    res.status(500).json({ error: 'webhook_handler_failed' });
  }
}
