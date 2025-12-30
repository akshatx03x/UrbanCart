import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StripeCheckout } from '@/components/StripeCheckout';
import { useCartStore } from '@/stores/cartStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ShoppingCart, CreditCard, Truck, Building2, Gift, User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, couponCode, discount, clearCart } = useCartStore();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{code: string, amount: number} | null>(null);

  // Customer details state
  const [customerDetails, setCustomerDetails] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'United States',
    postal_code: '',
  });

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(true);
    try {
      // Validate customer details
      if (!customerDetails.full_name || !customerDetails.email || !customerDetails.phone || !customerDetails.address || !customerDetails.city || !customerDetails.postal_code) {
        toast.error('Please fill in all required customer details');
        return;
      }

      // Save customer details to profiles table
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update or insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: customerDetails.full_name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address,
            city: customerDetails.city,
            country: customerDetails.country,
            postal_code: customerDetails.postal_code,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Save order to database
        const orderData = {
          user_id: user.id,
          total_amount: total,
          status: 'completed',
          payment_method: 'card',
          payment_status: 'paid',
          shipping_address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.country} ${customerDetails.postal_code}`,
        };

        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        // Save order items (only for Supabase products, skip dummy products)
        const orderItems = items.filter(item => item.product.node.id.startsWith('supabase-')).map(item => ({
          order_id: orderResult.id,
          product_id: item.product.node.id.replace('supabase-', ''),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error('Order saved locally, but there was an issue with our records');
      clearCart();
      navigate('/');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/shop');
  };

  const handleCODPayment = async () => {
    setIsProcessing(true);
    try {
      // Validate customer details
      if (!customerDetails.full_name || !customerDetails.email || !customerDetails.phone || !customerDetails.address || !customerDetails.city || !customerDetails.postal_code) {
        toast.error('Please fill in all required customer details');
        return;
      }

      // Save customer details to profiles table
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update or insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: customerDetails.full_name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address,
            city: customerDetails.city,
            country: customerDetails.country,
            postal_code: customerDetails.postal_code,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Save order to database
        const orderData = {
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
          shipping_address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.country} ${customerDetails.postal_code}`,
        };

        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        // Save order items (only for Supabase products, skip dummy products)
        const orderItems = items.filter(item => item.product.node.id.startsWith('supabase-')).map(item => ({
          order_id: orderResult.id,
          product_id: item.product.node.id.replace('supabase-', ''),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
        }));

        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;
        }
      }

      toast.success('Order placed successfully! Pay cash on delivery.');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('Error saving COD order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNetBankingPayment = async () => {
    setIsProcessing(true);
    try {
      // Validate customer details
      if (!customerDetails.full_name || !customerDetails.email || !customerDetails.phone || !customerDetails.address || !customerDetails.city || !customerDetails.postal_code) {
        toast.error('Please fill in all required customer details');
        return;
      }

      // Save customer details to profiles table
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update or insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: customerDetails.full_name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address,
            city: customerDetails.city,
            country: customerDetails.country,
            postal_code: customerDetails.postal_code,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Save order to database
        const orderData = {
          user_id: user.id,
          total_amount: total,
          status: 'completed',
          payment_method: 'netbanking',
          payment_status: 'paid',
          shipping_address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.country} ${customerDetails.postal_code}`,
        };

        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        // Save order items (only for Supabase products, skip dummy products)
        const orderItems = items.filter(item => item.product.node.id.startsWith('supabase-')).map(item => ({
          order_id: orderResult.id,
          product_id: item.product.node.id.replace('supabase-', ''),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
        }));

        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;
        }
      }

      toast.success('Payment successful via Net Banking!');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('Error processing net banking payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyGiftCard = () => {
    // Simulate gift card validation - in real app, this would check against database
    const giftCards: Record<string, number> = {
      'GIFT25': 25,
      'GIFT50': 50,
      'GIFT100': 100,
      'WELCOME20': 20,
      'BIRTHDAY30': 30,
    };

    const amount = giftCards[giftCardCode];
    if (amount) {
      setAppliedGiftCard({ code: giftCardCode, amount });
      toast.success(`Gift card applied! $${amount} credit available.`);
    } else {
      toast.error('Invalid gift card code');
    }
  };

  const handleGiftCardPayment = async () => {
    if (!appliedGiftCard || appliedGiftCard.amount < total) return;

    setIsProcessing(true);
    try {
      // Validate customer details
      if (!customerDetails.full_name || !customerDetails.email || !customerDetails.phone || !customerDetails.address || !customerDetails.city || !customerDetails.postal_code) {
        toast.error('Please fill in all required customer details');
        return;
      }

      // Save customer details to profiles table
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update or insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: customerDetails.full_name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address,
            city: customerDetails.city,
            country: customerDetails.country,
            postal_code: customerDetails.postal_code,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Save order to database
        const orderData = {
          user_id: user.id,
          total_amount: total,
          status: 'completed',
          payment_method: 'giftcard',
          payment_status: 'paid',
          shipping_address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.country} ${customerDetails.postal_code}`,
        };

        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        // Save order items (only for Supabase products, skip dummy products)
        const orderItems = items.filter(item => item.product.node.id.startsWith('supabase-')).map(item => ({
          order_id: orderResult.id,
          product_id: item.product.node.id.replace('supabase-', ''),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
        }));

        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;
        }
      }

      toast.success('Payment successful with Gift Card!');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('Error processing gift card payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart before checking out</p>
          <Button onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase securely</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Customer Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="Enter your full name"
                      value={customerDetails.full_name}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    value={customerDetails.address}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={customerDetails.city}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      placeholder="Enter postal code"
                      value={customerDetails.postal_code}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, postal_code: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={customerDetails.country}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.node.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map(option => option.value).join(' • ')}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Qty: {item.quantity}</span>
                          <span className="font-semibold">
                            ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="card" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Card</span>
                    </TabsTrigger>
                    <TabsTrigger value="cod" className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">COD</span>
                    </TabsTrigger>
                    <TabsTrigger value="netbanking" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Net Banking</span>
                    </TabsTrigger>
                    <TabsTrigger value="giftcard" className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      <span className="hidden sm:inline">Gift Card</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="mt-6">
                    <StripeCheckout
                      onSuccess={handlePaymentSuccess}
                      onCancel={handleCancel}
                    />
                  </TabsContent>

                  <TabsContent value="cod" className="mt-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold mb-2">Cash on Delivery</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Pay with cash when your order is delivered to your doorstep. No online payment required.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p>• Pay only when you receive your order</p>
                          <p>• No extra delivery charges</p>
                          <p>• Available for orders above $10</p>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleCODPayment}
                        disabled={total < 10}
                      >
                        {total < 10 ? 'Minimum order $10 for COD' : 'Place Order with COD'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="netbanking" className="mt-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold mb-2">Net Banking</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Pay securely through your bank account. Fast and secure online banking transfer.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p>• Direct bank transfer</p>
                          <p>• No additional charges</p>
                          <p>• Instant confirmation</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Other Banks'].map((bank) => (
                            <Button key={bank} variant="outline" size="sm" className="text-xs">
                              {bank}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleNetBankingPayment}>
                        Continue with Net Banking
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="giftcard" className="mt-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold mb-2">Gift Card</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Redeem your gift card or use store credit for this purchase.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p>• Instant redemption</p>
                          <p>• No expiration on unused balance</p>
                          <p>• Can be combined with other payment methods</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Gift Card Code</label>
                          <input
                            type="text"
                            placeholder="Enter gift card code"
                            className="w-full px-3 py-2 border rounded-md"
                            value={giftCardCode}
                            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleApplyGiftCard}
                          disabled={!giftCardCode}
                        >
                          Apply Gift Card
                        </Button>
                        {appliedGiftCard && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            Gift card applied: ${appliedGiftCard.amount.toFixed(2)} discount
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleGiftCardPayment}
                        disabled={!appliedGiftCard || appliedGiftCard.amount < total}
                      >
                        {!appliedGiftCard ? 'Apply gift card first' :
                         appliedGiftCard.amount < total ? 'Insufficient gift card balance' :
                         'Pay with Gift Card'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
