import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SRALXKAZzhuxMidZrqJ0uuohzwCU5QFrOibbqSnApqR3MyzTfXs1aPq6FhmVc6GB0OZAGr28oYp0cJAkw8Pntvv00oIQgkqhN');

export { stripePromise };

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CartItem {
  product: {
    node: {
      id: string;
      title: string;
      images: {
        edges: Array<{
          node: {
            url: string;
          };
        }>;
      };
    };
  };
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

// Create payment intent on the backend
export async function createPaymentIntent(items: CartItem[], discount: number = 0): Promise<PaymentIntent> {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const totalAmount = Math.round((subtotal - discountAmount) * 100); // Convert to cents

  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: totalAmount,
      currency: 'usd',
      items: items.map(item => ({
        id: item.variantId,
        name: item.product.node.title,
        price: parseFloat(item.price.amount),
        quantity: item.quantity,
        image: item.product.node.images?.edges?.[0]?.node?.url,
      })),
      discount: discount,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

// Confirm payment
export async function confirmPayment(clientSecret: string, paymentMethod: any): Promise<any> {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe not initialized');

  return stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });
}
