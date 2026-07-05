import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore(state => state.addItem);

  const handleAddToCart = (product: any) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    addToCart({
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
      
      <div className="container mx-auto px-4 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-slate-400">Items you've saved for later</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-white/10">
            <Heart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-xl mb-4">Your wishlist is empty</p>
            <Button className="bg-white text-black hover:bg-slate-200 rounded-none px-6" asChild>
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <Card key={product.node.id} className="group bg-transparent border border-white/10 hover:border-white/30 rounded-none transition-colors duration-300 animate-fade-in">
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
                <CardFooter className="p-6 pt-0 flex gap-2">
                  <Button 
                    className="flex-1 bg-white text-black hover:bg-slate-200 rounded-none" 
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/5 rounded-none"
                    size="icon"
                    onClick={() => {
                      removeItem(product.node.id);
                      toast.success("Removed from wishlist");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
