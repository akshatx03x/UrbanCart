import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProduct();
  }, [handle]);

  const loadProduct = async () => {
    try {
      const data = await fetchProducts(100);
      const found = data.find(p => p.node.handle === handle);
      setProduct(found || null);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const variant = product.node.variants.edges[selectedVariantIndex]?.node;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-8 w-32 mb-8 bg-white/5 rounded-none" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full bg-white/5 rounded-none" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 bg-white/5 rounded-none" />
              <Skeleton className="h-8 w-1/4 bg-white/5 rounded-none" />
              <Skeleton className="h-24 w-full bg-white/5 rounded-none" />
              <Skeleton className="h-12 w-full bg-white/5 rounded-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button 
            className="bg-white text-black hover:bg-slate-200 rounded-none px-6"
            onClick={() => navigate("/shop")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const selectedVariant = product.node.variants.edges[selectedVariantIndex]?.node;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/shop")}
          className="mb-8 text-slate-300 hover:text-white hover:bg-white/5 rounded-none"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square overflow-hidden bg-white/5 border border-white/10 rounded-none relative">
            {product.node.images.edges[0]?.node ? (
              <img
                src={product.node.images.edges[0].node.url}
                alt={product.node.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-24 w-24 text-slate-600" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">{product.node.title}</h1>
              <p className="text-3xl font-semibold text-white mb-4">
                {selectedVariant?.price.currencyCode}{" "}
                {selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : "0.00"}
              </p>
              {selectedVariant?.availableForSale ? (
                <Badge className="bg-transparent border border-white/20 text-slate-300 px-3 py-1 text-xs uppercase tracking-widest rounded-none">
                  In Stock
                </Badge>
              ) : (
                <Badge className="bg-transparent border border-red-500/30 text-red-400 px-3 py-1 text-xs uppercase tracking-widest rounded-none">
                  Out of Stock
                </Badge>
              )}
            </div>

            {product.node.description && (
              <div className="border-t border-white/10 pt-6">
                <h2 className="text-lg font-medium mb-3 text-white">Description</h2>
                <p className="text-slate-400 leading-relaxed">{product.node.description}</p>
              </div>
            )}

            {product.node.variants.edges.length > 1 && (
              <div className="border-t border-white/10 pt-6">
                <h2 className="text-lg font-medium mb-3 text-white">Options</h2>
                <div className="flex flex-wrap gap-2">
                  {product.node.variants.edges.map((variant, index) => (
                    <Button
                      key={variant.node.id}
                      variant={selectedVariantIndex === index ? "default" : "outline"}
                      onClick={() => setSelectedVariantIndex(index)}
                      className={selectedVariantIndex === index ? "bg-white text-black hover:bg-slate-200 rounded-none px-6" : "border-white/20 text-white hover:bg-white/5 rounded-none px-6"}
                    >
                      {variant.node.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-6">
              <Button 
                size="lg" 
                className="w-full bg-white text-black hover:bg-slate-200 rounded-none py-6 text-base font-medium disabled:bg-white/10 disabled:text-white/40"
                onClick={handleAddToCart}
                disabled={!selectedVariant?.availableForSale}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {selectedVariant?.availableForSale ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
