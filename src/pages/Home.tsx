import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { fetchProducts, fetchSupabaseProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowRight, Sparkles, Zap, Shield, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProducts();
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '10%',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            bottom: '10%',
            right: '10%',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
          style={{
            top: mousePosition.y - 128,
            left: mousePosition.x - 128,
            transition: 'all 0.3s ease-out',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-200 backdrop-blur-xl px-6 py-2 text-sm">
              <Sparkles className="w-3 h-3 mr-2 inline" />
              New Arrivals - Limited Edition
            </Badge>
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Discover the
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Extraordinary
              </span>
            </h1>
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Curated collections of premium products. Elevate your lifestyle with items designed for those who demand excellence.
            </p>
          </div>
          
          <div className="animate-slide-up flex gap-4 justify-center flex-wrap" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8 py-6 text-lg shadow-2xl shadow-purple-500/50 transition-all hover:scale-105 hover:shadow-purple-500/70" asChild>
              <Link to="/shop">
                Explore Collection <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="glass-card text-white border-white/20 hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-xl transition-all hover:scale-105" asChild>
              <Link to="/shop">
                View Catalog
              </Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex gap-8 justify-center mt-16 flex-wrap animate-slide-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            {[
              { icon: Zap, text: "Fast Delivery" },
              { icon: Shield, text: "Secure Payment" },
              { icon: TrendingUp, text: "Premium Quality" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 glass-card px-6 py-3 rounded-full">
                <feature.icon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </section>

      {/* Featured Products */}
      <section className="py- relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div className="animate-slide-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Featured Collection
              </h2>
              <p className="text-slate-400 text-lg">Handpicked items that define luxury</p>
            </div>
            <Button variant="outline" className="glass-card text-white border-white/20 hover:bg-white/10 backdrop-blur-xl hidden md:flex" asChild>
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="glass-card border-white/10">
                  <Skeleton className="h-80 w-full bg-white/5" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2 bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-3xl">
              <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl mb-2">No products found</p>
              <p className="text-sm text-slate-500">
                Create your first product to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <Card 
                  key={product.node.id} 
                  className="group glass-card border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 animate-slide-up"
                  style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
                >
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-slate-900/50 relative">
                      {product.node.images.edges[0]?.node ? (
                        <>
                          <img
                            src={product.node.images.edges[0].node.url}
                            alt={product.node.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <Badge className="bg-purple-500/90 backdrop-blur-sm border-0">New</Badge>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                          <ShoppingCart className="h-16 w-16 text-slate-600" />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <CardContent className="p-6">
                    <Link to={`/product/${product.node.handle}`}>
                      <h3 className="font-semibold text-lg mb-3 line-clamp-1 text-white group-hover:text-purple-300 transition-colors duration-300">
                        {product.node.title}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {product.node.priceRange.minVariantPrice.currencyCode}{" "}
                        {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300" 
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
              className="glass-card text-white border-white/20 hover:bg-white/10 backdrop-blur-xl md:hidden px-8 py-6" 
              asChild
            >
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className=" relative z-10">
  <div className="container mx-auto px-4 m-10">
    <div className="glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
      <div className="shimmer absolute inset-0" />
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
          Our Story & Commitment
        </h2>
        <p className="text-slate-300 text-xl mb-10 max-w-3xl mx-auto">
          From a simple idea to serving over 10,000 satisfied customers, our mission is to redefine quality and customer experience in our industry.
        </p>

        {/* Core Stats Block */}
        <div className="flex flex-wrap gap-8  justify-center">
          <div className="text-center p-4">
            <div className="text-5xl font-bold text-purple-400 mb-1">10k+</div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">Happy Customers</div>
          </div>
          <div className="hidden md:block w-px bg-white/10" />
          <div className="text-center p-4">
            <div className="text-5xl font-bold text-pink-400 mb-1">99%</div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">Satisfaction Rate</div>
          </div>
          <div className="hidden md:block w-px bg-white/10" />
          <div className="text-center p-4">
            <div className="text-5xl font-bold text-purple-400 mb-1">24/7</div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">Premium Support</div>
          </div>
        </div>
        {/* End Core Stats Block */}

      </div>
    </div>
  </div>
</section>

    </div>
  );
}