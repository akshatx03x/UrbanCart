import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string;
      images?: string[];
    };
  }[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url,
              images
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Order History</h1>
          <p className="text-slate-400">View your past orders and their status</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-transparent border border-white/10 rounded-none">
            <CardContent className="py-20 text-center">
              <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl mb-4">No orders yet</p>
              <Button className="bg-white text-black hover:bg-slate-200 rounded-none" onClick={() => navigate('/shop')}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="bg-transparent border border-white/10 hover:border-white/30 rounded-none transition-colors duration-300 overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/10 rounded-none">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-white">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge variant="outline" className={`${getStatusColor(order.status)} rounded-none uppercase tracking-wider text-[10px]`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 text-white">
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-none overflow-hidden flex-shrink-0">
                          {(item.products?.image_url || item.products?.images?.[0]) && (
                            <img
                              src={item.products.image_url || item.products.images[0]}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.products?.name || 'Product'}</h4>
                          <p className="text-sm text-slate-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${parseFloat(item.price.toString()).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-white">
                          Total: ${parseFloat(order.total_amount.toString()).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Payment: {order.payment_status}
                        </p>
                      </div>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-none">
                        Track Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
