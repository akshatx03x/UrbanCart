 import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { stripePromise, createPaymentIntent, confirmPayment } from '@/lib/stripe';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

interface StripeCheckoutProps {
  onSuccess: (paymentIntent: any) => void;
  onCancel: () => void;
}

const CheckoutForm = ({ onSuccess, onCancel }: StripeCheckoutProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, couponCode, discount, clearCart } = useCartStore();

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(items, discount);

      // Confirm payment
      const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Customer Name', // You might want to collect this
            },
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        return;
      }

      if (confirmedPaymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        clearCart();
        onSuccess(confirmedPaymentIntent);
      } else {
        setError('Payment was not successful');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Checkout
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between">
                  <span className="truncate mr-2">
                    {item.product.node.title} x{item.quantity}
                  </span>
                  <span>${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div className="p-3 border rounded-md bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${total.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const StripeCheckout = (props: StripeCheckoutProps) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};
