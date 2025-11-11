import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Package, TrendingUp, DollarSign, BarChart3, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalOrders: 0,
    totalProducts: 0,
    salesData: [] as { month: string; sales: number }[],
    profitData: [] as { month: string; profit: number }[],
  });

  const [ordersData, setOrdersData] = useState([] as any[]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "1",
    image_url: "",
    category: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalyticsData();
      fetchOrdersData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await supabase
          .from('profiles')
          .insert([{ user_id: user.id, email: user.email, is_admin: true }]);

        setIsAdmin(true);
      } else {
        setIsAdmin(data.is_admin || false);
      }
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      // Fetch all orders with their creation dates and total amounts
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('status', 'completed'); // Only count completed orders

      if (ordersError) throw ordersError;

      // Fetch current products for inventory value
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('price, stock');

      if (productsError) throw productsError;

      // Calculate total sales from completed orders
      const totalSales = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalProducts = products?.length || 0;

      // Calculate profit (assuming 30% profit margin on sales)
      const totalProfit = totalSales * 0.3;

      // Group orders by month for the last 12 months
      const monthlyData = new Map<string, { sales: number; orders: number; monthName: string }>();
      const currentDate = new Date();

      // Initialize last 12 months with zero values
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        const monthName = date.toLocaleString('default', { month: 'short' });
        monthlyData.set(monthKey, { sales: 0, orders: 0, monthName });
      }

      // Aggregate actual order data by month
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toISOString().slice(0, 7);
        if (monthlyData.has(monthKey)) {
          const existing = monthlyData.get(monthKey)!;
          existing.sales += order.total_amount;
          existing.orders += 1;
        }
      });

      // Convert to arrays for charts
      const salesData = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          month: data.monthName,
          sales: Math.round(data.sales)
        }));

      const profitData = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          month: data.monthName,
          profit: Math.round(data.sales * 0.3) // 30% profit margin
        }));

      setAnalyticsData({
        totalSales: Math.round(totalSales * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOrders,
        totalProducts,
        salesData,
        profitData,
      });
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast.error("Error loading analytics", {
        description: error.message,
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchOrdersData = async () => {
    setOrdersLoading(true);
    try {
      const { data: orders, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrdersData(orders || []);
    } catch (error: any) {
      console.error('Error fetching orders data:', error);
      toast.error("Error loading orders", {
        description: error.message,
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('products').insert([
        {
          name: productData.name,
          slug: productData.name.toLowerCase().replace(/\s+/g, '-'),
          description: productData.description,
          price: parseFloat(productData.price),
          stock: parseInt(productData.stock),
          image_url: productData.image_url,
          category: productData.category,
        },
      ]);

      if (error) throw error;

      toast.success("Product added successfully!");
      setProductData({
        name: "",
        description: "",
        price: "",
        stock: "1",
        image_url: "",
        category: "",
      });
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error("Failed to add product", {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">You don't have admin privileges</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your store products and settings</p>
        </div>

        {/* Analytics Cards */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  From completed orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.totalProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  30% profit margin applied
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Total products in catalog
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Chart */}
        {analyticsLoading ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-32 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between space-x-2">
                {analyticsData.salesData.map((data, index) => {
                  const maxSales = Math.max(...analyticsData.salesData.map(d => d.sales));
                  const height = maxSales > 0 ? (data.sales / maxSales) * 200 : 0;
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div
                        className="bg-primary rounded-t w-8 transition-all hover:bg-primary/80"
                        style={{ height: `${height}px` }}
                        title={`$${data.sales.toLocaleString()}`}
                      ></div>
                      <span className="text-xs text-muted-foreground">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profit Chart */}
        {analyticsLoading ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-32 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between space-x-2">
                {analyticsData.profitData.map((data, index) => {
                  const maxProfit = Math.max(...analyticsData.profitData.map(d => d.profit));
                  const height = maxProfit > 0 ? (data.profit / maxProfit) * 200 : 0;
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div
                        className="bg-green-500 rounded-t w-8 transition-all hover:bg-green-600"
                        style={{ height: `${height}px` }}
                        title={`$${data.profit.toLocaleString()}`}
                      ></div>
                      <span className="text-xs text-muted-foreground">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="manage-products">
              <Package className="mr-2 h-4 w-4" />
              Manage Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={productData.name}
                        onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productData.price}
                        onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productData.stock}
                        onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        type="url"
                        value={productData.image_url}
                        onChange={(e) => setProductData({ ...productData, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productData.description}
                      onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant={productData.category === "Mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProductData({ ...productData, category: "Mobile" })}
                      >
                        Mobile
                      </Button>
                      <Button
                        type="button"
                        variant={productData.category === "Clothes" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProductData({ ...productData, category: "Clothes" })}
                      >
                        Clothes
                      </Button>
                      <Button
                        type="button"
                        variant={productData.category === "Grocery" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProductData({ ...productData, category: "Grocery" })}
                      >
                        Grocery
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Product...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : ordersData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersData.slice(0, 10).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">#{order.id.slice(-8)}</TableCell>
                          <TableCell>{order.profiles?.full_name || order.profiles?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.order_items?.slice(0, 2).map((item: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <img
                                    src={item.products?.image_url || item.products?.images?.[0] || '/placeholder.png'}
                                    alt={item.products?.name || 'Product'}
                                    className="w-6 h-6 object-cover rounded"
                                  />
                                  <span className="truncate max-w-24">{item.products?.name || 'Product'}</span>
                                  <span className="text-muted-foreground">x{item.quantity}</span>
                                </div>
                              ))}
                              {order.order_items?.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{order.order_items.length - 2} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${order.total_amount?.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Manage Existing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View, edit, and delete existing products from your store.
                </p>
                <Button onClick={() => navigate("/admin/products")}>
                  Go to Product Management
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
