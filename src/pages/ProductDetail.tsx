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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/shop")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const selectedVariant = product.node.variants.edges[selectedVariantIndex]?.node;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/shop")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {product.node.images.edges[0]?.node ? (
              <img
                src={product.node.images.edges[0].node.url}
                alt={product.node.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.node.title}</h1>
              <p className="text-3xl font-bold text-primary mb-4">
                {selectedVariant?.price.currencyCode}{" "}
                {selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : "0.00"}
              </p>
              {selectedVariant?.availableForSale ? (
                <Badge>In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {product.node.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{product.node.description}</p>
              </div>
            )}

            {product.node.variants.edges.length > 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Options</h2>
                <div className="flex flex-wrap gap-2">
                  {product.node.variants.edges.map((variant, index) => (
                    <Button
                      key={variant.node.id}
                      variant={selectedVariantIndex === index ? "default" : "outline"}
                      onClick={() => setSelectedVariantIndex(index)}
                    >
                      {variant.node.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={!selectedVariant?.availableForSale}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
