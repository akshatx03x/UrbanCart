import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts(8);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions,
    });

    toast.success("Added to cart!", {
      description: product.node.title,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-background to-accent/20 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">New Arrivals</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Discover Amazing Products
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Shop clothes, groceries, food, mobiles and more. Everything you need in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/shop">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Check out our latest and greatest</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/shop">View All</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No products found</p>
              <p className="text-sm text-muted-foreground">
                Create your first product to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.node.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-muted">
                      {product.node.images.edges[0]?.node ? (
                        <img
                          src={product.node.images.edges[0].node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/product/${product.node.handle}`}>
                      <h3 className="font-semibold mb-2 line-clamp-1 hover:text-primary transition-colors">
                        {product.node.title}
                      </h3>
                    </Link>
                    <p className="text-2xl font-bold text-primary">
                      {product.node.priceRange.minVariantPrice.currencyCode}{" "}
                      {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
