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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-14">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 animate-fade-in">Shop All Products</h1>
            <p className="text-muted-foreground">Browse our complete collection</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={filterCategory === "all" ? "default" : "outline"}
                onClick={() => setFilterCategory("all")}
              >
                All
              </Button>
              <Button
                variant={filterCategory === "Mobile" ? "default" : "outline"}
                onClick={() => setFilterCategory("Mobile")}
              >
                Mobile
              </Button>
              <Button
                variant={filterCategory === "Clothes" ? "default" : "outline"}
                onClick={() => setFilterCategory("Clothes")}
              >
                Clothes
              </Button>
              <Button
                variant={filterCategory === "Grocery" ? "default" : "outline"}
                onClick={() => setFilterCategory("Grocery")}
              >
                Grocery
              </Button>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your product search
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat || ""}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under-50">Under $50</SelectItem>
                        <SelectItem value="50-100">$50 - $100</SelectItem>
                        <SelectItem value="100-500">$100 - $500</SelectItem>
                        <SelectItem value="over-500">Over $500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
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
              <Card key={i} className="animate-pulse">
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">No products found</p>
            <Button onClick={() => {
              setFilterCategory("all");
              setPriceRange("all");
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product, index) => (
              <Card 
                key={product.node.id} 
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-muted">
                      {product.node.images.edges[0]?.node ? (
                        <img
                          src={product.node.images.edges[0].node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-all hover:scale-110"
                    onClick={() => handleToggleWishlist(product)}
                  >
                    <Heart 
                      className={`h-5 w-5 ${isInWishlist(product.node.id) ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  {product.node.productType && (
                    <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm">
                      {product.node.productType}
                    </Badge>
                  )}
                </div>
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
                    className="w-full group-hover:scale-105 transition-transform" 
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
