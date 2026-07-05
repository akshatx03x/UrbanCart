import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { fetchProducts, fetchSupabaseProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
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
      const [shopifyProducts, supabaseProducts] = await Promise.all([
        fetchProducts(20),
        fetchSupabaseProducts()
      ]);
      setProducts([...supabaseProducts, ...shopifyProducts]);
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
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            
            {/* Left Content */}
            <div className="space-y-6 text-left">
              <Badge className="bg-transparent border border-white/20 text-slate-300 px-4 py-1.5 text-xs uppercase tracking-widest rounded-none">
                Bespoke Curations
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-white">
                Curated Collection.
                <br />
                <span className="text-slate-400 font-normal">Exceptional Design.</span>
              </h1>

              <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
                UrbanCart is a boutique department store for premium objects, designer apparel, and home additions. We partner directly with independent designers and select manufacturers worldwide to deliver unique items designed to endure.
              </p>

              <div className="flex gap-4 flex-wrap pt-2">
                <Button size="lg" className="bg-white text-black hover:bg-slate-200 rounded-none px-8 py-6 text-base font-medium" asChild>
                  <Link to="/shop">
                    Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-none px-8 py-6 text-base" asChild>
                  <Link to="/shop">View Catalog</Link>
                </Button>
              </div>
            </div>

            {/* Right Graphic/Image Frame */}
            <div className="w-full max-w-xs md:max-w-sm lg:max-w-md lg:ml-auto">
              <div className="border border-white/10 bg-white/5 p-4 rounded-none transition-colors duration-300 hover:border-white/20">
                <div className="aspect-[4/5] overflow-hidden bg-[#0c0c0c] border border-white/10 relative">
                  <img
                    src="/handcrafted_goods.png"
                    alt="Curated design items"
                    className="w-full h-full object-cover opacity-95 transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-[#0c0c0c]/85 border border-white/15 px-3 py-1 text-[10px] tracking-widest uppercase text-slate-300">
                    Bestsellers
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-mono">Collection: Designer stoneware</span>
                  <span>Est. 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                Featured Collection
              </h2>
              <p className="text-slate-400">Handpicked items that define quality</p>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-none hidden md:flex" asChild>
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-transparent border border-white/10 rounded-none">
                  <Skeleton className="h-80 w-full bg-white/5 rounded-none" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2 bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-white/10">
              <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl mb-2">No products found</p>
              <p className="text-sm text-slate-500">
                Create your first product to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.node.id}
                  className="group bg-transparent border border-white/10 hover:border-white/30 rounded-none transition-colors duration-300"
                >
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-white/5 relative">
                      {product.node.images.edges[0]?.node ? (
                        <img
                          src={product.node.images.edges[0].node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-16 w-16 text-slate-600" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-6">
                    <Link to={`/product/${product.node.handle}`}>
                      <h3 className="font-semibold text-lg mb-3 line-clamp-1 text-white group-hover:text-slate-300 transition-colors">
                        {product.node.title}
                      </h3>
                    </Link>
                    <p className="text-xl font-bold text-white">
                      {product.node.priceRange.minVariantPrice.currencyCode}{" "}
                      {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                    </p>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      className="w-full bg-white text-black hover:bg-slate-200 rounded-none"
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

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 rounded-none md:hidden px-8 py-6"
              asChild
            >
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className="border-t border-white/10 py-24">
        <div className="container mx-auto px-4">
          <div className="border border-white/10 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Our Story & Commitment
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              From a simple idea to serving over 10,000 satisfied customers, our mission is to redefine quality and customer experience in our industry.
            </p>

            <div className="flex flex-wrap gap-8 justify-center">
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-white mb-1">10k+</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Happy Customers</div>
              </div>
              <div className="hidden md:block w-px bg-white/10" />
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-white mb-1">99%</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Satisfaction Rate</div>
              </div>
              <div className="hidden md:block w-px bg-white/10" />
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-white mb-1">24/7</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Premium Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}