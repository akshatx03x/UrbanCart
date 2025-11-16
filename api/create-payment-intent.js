const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const { amount, currency = 'usd', items, discount = 0 } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        items: JSON.stringify(items),
        discount: discount.toString(),
      },
    });

    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}
