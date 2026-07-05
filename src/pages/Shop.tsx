import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { fetchProducts, fetchSupabaseProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Heart, Filter, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function Shop() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("featured");
  const [filterCategory, setFilterCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  
  const addItem = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, filterCategory, priceRange]);

  const loadProducts = async () => {
    try {
      const [shopifyProducts, supabaseProducts] = await Promise.all([
        fetchProducts(50),
        fetchSupabaseProducts()
      ]);
      const combinedProducts = [...shopifyProducts, ...supabaseProducts];
      setProducts(combinedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Apply category filter
    if (filterCategory !== "all") {
      const categoryMapping: { [key: string]: string } = {
        "Mobile": "Mobile",
        "Clothes": "Clothing",
        "Grocery": "Food"
      };

      const mappedCategory = categoryMapping[filterCategory] || filterCategory;
      filtered = filtered.filter(p =>
        p.node.productType?.toLowerCase() === mappedCategory.toLowerCase()
      );
    }

    // Apply price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter(p => {
        const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
        switch (priceRange) {
          case "under-50":
            return price < 50;
          case "50-100":
            return price >= 50 && price < 100;
          case "100-500":
            return price >= 100 && price < 500;
          case "over-500":
            return price >= 500;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const priceA = parseFloat(a.node.priceRange.minVariantPrice.amount);
      const priceB = parseFloat(b.node.priceRange.minVariantPrice.amount);
      
      switch (sortBy) {
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "name":
          return a.node.title.localeCompare(b.node.title);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const categories = Array.from(new Set(products.map(p => p.node.productType).filter(Boolean)));

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

  const handleToggleWishlist = (product: ShopifyProduct) => {
    if (isInWishlist(product.node.id)) {
      removeFromWishlist(product.node.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist!");
    }
  };

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 animate-fade-in text-white">Shop All Products</h1>
            <p className="text-slate-400">Browse our complete collection</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={filterCategory === "all" ? "default" : "outline"}
                onClick={() => setFilterCategory("all")}
                className={filterCategory === "all" ? "bg-white text-black hover:bg-slate-200 rounded-none px-4" : "border-white/20 text-white hover:bg-white/5 rounded-none px-4"}
              >
                All
              </Button>
              <Button
                variant={filterCategory === "Mobile" ? "default" : "outline"}
                onClick={() => setFilterCategory("Mobile")}
                className={filterCategory === "Mobile" ? "bg-white text-black hover:bg-slate-200 rounded-none px-4" : "border-white/20 text-white hover:bg-white/5 rounded-none px-4"}
              >
                Mobile
              </Button>
              <Button
                variant={filterCategory === "Clothes" ? "default" : "outline"}
                onClick={() => setFilterCategory("Clothes")}
                className={filterCategory === "Clothes" ? "bg-white text-black hover:bg-slate-200 rounded-none px-4" : "border-white/20 text-white hover:bg-white/5 rounded-none px-4"}
              >
                Clothes
              </Button>
              <Button
                variant={filterCategory === "Grocery" ? "default" : "outline"}
                onClick={() => setFilterCategory("Grocery")}
                className={filterCategory === "Grocery" ? "bg-white text-black hover:bg-slate-200 rounded-none px-4" : "border-white/20 text-white hover:bg-white/5 rounded-none px-4"}
              >
                Grocery
              </Button>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-transparent border-white/20 text-white rounded-none">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0c0c0c] border-white/10 text-white rounded-none">
                <SelectItem value="featured" className="focus:bg-white/5 focus:text-white">Featured</SelectItem>
                <SelectItem value="price-low" className="focus:bg-white/5 focus:text-white">Price: Low to High</SelectItem>
                <SelectItem value="price-high" className="focus:bg-white/5 focus:text-white">Price: High to Low</SelectItem>
                <SelectItem value="name" className="focus:bg-white/5 focus:text-white">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-none">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#0c0c0c] border-l border-white/10 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">Filters</SheetTitle>
                  <SheetDescription className="text-slate-400">
                    Refine your product search
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-white">Category</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c0c] border-white/10 text-white rounded-none">
                        <SelectItem value="all" className="focus:bg-white/5 focus:text-white">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat || ""} className="focus:bg-white/5 focus:text-white">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-white">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="bg-transparent border-white/20 text-white rounded-none">
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c0c] border-white/10 text-white rounded-none">
                        <SelectItem value="all" className="focus:bg-white/5 focus:text-white">All Prices</SelectItem>
                        <SelectItem value="under-50" className="focus:bg-white/5 focus:text-white">Under $50</SelectItem>
                        <SelectItem value="50-100" className="focus:bg-white/5 focus:text-white">$50 - $100</SelectItem>
                        <SelectItem value="100-500" className="focus:bg-white/5 focus:text-white">$100 - $500</SelectItem>
                        <SelectItem value="over-500" className="focus:bg-white/5 focus:text-white">Over $500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/5 rounded-none"
                    onClick={() => {
                      setFilterCategory("all");
                      setPriceRange("all");
                      setSortBy("featured");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="bg-transparent border border-white/10 rounded-none">
                <Skeleton className="h-80 w-full bg-white/5 rounded-none" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 border border-white/10">
            <ShoppingCart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-xl mb-4">No products found</p>
            <Button 
              className="bg-white text-black hover:bg-slate-200 rounded-none"
              onClick={() => {
                setFilterCategory("all");
                setPriceRange("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product, index) => (
              <Card 
                key={product.node.id} 
                className="group bg-transparent border border-white/10 hover:border-white/30 rounded-none transition-colors duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-[#0c0c0c]/85 backdrop-blur-sm hover:bg-white/10 text-white rounded-none border border-white/10 h-8 w-8 transition-transform"
                    onClick={() => handleToggleWishlist(product)}
                  >
                    <Heart 
                      className={`h-4.5 w-4.5 ${isInWishlist(product.node.id) ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  {product.node.productType && (
                    <Badge className="absolute top-2 left-2 bg-transparent border border-white/20 text-slate-300 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-none backdrop-blur-sm">
                      {product.node.productType}
                    </Badge>
                  )}
                </div>
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
      </div>
    </div>
  );
}
