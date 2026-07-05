import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, ArrowLeft, Package } from "lucide-react";

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  images: string[] | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error("Failed to load products", {
        description: error.message,
      });
    }
  };

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast.success("Product deleted successfully!");
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error("Failed to delete product", {
        description: error.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-8">You don't have admin privileges</p>
          <Button className="bg-white text-black hover:bg-slate-200 rounded-none px-6" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-none px-4" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">Manage Products</h1>
            <p className="text-slate-400">View and manage all existing products</p>
          </div>
        </div>

        <Card className="bg-transparent border border-white/10 rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-20 border border-white/10">
                <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-xl mb-4">No products found</p>
                <Button className="bg-white text-black hover:bg-slate-200 rounded-none px-6" onClick={() => navigate("/admin")}>Add Your First Product</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-300 font-semibold">Image</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Name</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Description</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Price</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Stock</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-300 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover border border-white/10 rounded-none"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-none flex items-center justify-center">
                              <Package className="h-6 w-6 text-slate-600" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-white">{product.name}</TableCell>
                        <TableCell className="max-w-xs truncate text-white">{product.description}</TableCell>
                        <TableCell className="text-white">${product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-white">{product.stock}</TableCell>
                        <TableCell>
                          <Badge className={`rounded-none border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                            product.stock > 0 
                              ? "bg-green-500/10 text-green-400 border-green-500/20" 
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                disabled={deletingId === product.id}
                                className="border-white/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-none bg-transparent hover:bg-red-500/10"
                              >
                                {deletingId === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0c0c0c] border border-white/10 text-white rounded-none">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white font-bold">Delete Product</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/20 text-white hover:bg-white/5 rounded-none">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-red-600 text-white hover:bg-red-700 rounded-none"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
