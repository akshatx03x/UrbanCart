import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, LogOut, User, LayoutDashboard, Heart, Package, Search, Menu, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { fetchProducts, fetchSupabaseProducts, ShopifyProduct } from "@/lib/shopify";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const wishlistItems = useWishlistStore(state => state.items);
  const cartItems = useCartStore(state => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll states
  const [isScrolled, setIsScrolled] = useState(false);
  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Badge animation states
  const [animateWishlist, setAnimateWishlist] = useState(false);

  // Monitor scroll for header shrinking and style shifts
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Monitor wishlist length for animation triggers
  useEffect(() => {
    if (wishlistItems.length > 0) {
      setAnimateWishlist(true);
      const timer = setTimeout(() => setAnimateWishlist(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wishlistItems.length]);

  // Load products for search overlay when it opens
  useEffect(() => {
    if (searchOpen) {
      const loadAllProducts = async () => {
        setSearchLoading(true);
        try {
          const [shopifyProds, supabaseProds] = await Promise.all([
            fetchProducts(100),
            fetchSupabaseProducts()
          ]);
          setAllProducts([...supabaseProds, ...shopifyProds]);
        } catch (error) {
          console.error("Error pre-fetching search products:", error);
        } finally {
          setSearchLoading(false);
        }
      };
      loadAllProducts();
    }
  }, [searchOpen]);

  // Command+K listener to trigger search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "About", path: "/#about" }
  ];

  // Helper to determine active link
  const isLinkActive = (path: string) => {
    if (path.startsWith("/#")) {
      return location.pathname === "/" && location.hash === path.substring(1);
    }
    return location.pathname === path && !location.hash;
  };

  // Filter products based on search input
  const filteredProducts = allProducts.filter((product) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return false;
    return (
      product.node.title.toLowerCase().includes(term) ||
      product.node.description.toLowerCase().includes(term) ||
      (product.node.productType && product.node.productType.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-in-out border-b",
          isScrolled
            ? "h-16 bg-[#0c0c0c]/85 border-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "h-20 bg-transparent border-transparent"
        )}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between max-w-6xl">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl md:text-2xl font-bold font-mono tracking-wider text-white hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 bg-white/5 border border-white/15 rounded-none flex items-center justify-center transition-transform hover:scale-105">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            UrbanCart
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={cn(
                  "relative text-sm text-slate-400 hover:text-white transition-colors duration-200 py-1.5",
                  "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-white hover:after:w-full after:transition-all after:duration-300",
                  isLinkActive(link.path) && "text-white font-medium after:w-full after:bg-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search mock input button for desktop */}
            <Button
              variant="outline"
              className="hidden lg:flex items-center gap-2 bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 rounded-none h-9 px-3 text-xs w-44 justify-between transition-all"
              onClick={() => setSearchOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Search...
              </span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/20 bg-[#0c0c0c] px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-90">
                <span>⌘</span>K
              </kbd>
            </Button>

            {/* Search icon button for tablets and mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-300 hover:text-white hover:bg-white/5 rounded-none"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-300 hover:text-white hover:bg-white/5 rounded-none transition-transform hover:-translate-y-0.5 duration-200"
              onClick={() => navigate("/wishlist")}
            >
              <Heart className="h-5 w-5" />
              {wishlistItems.length > 0 && (
                <Badge
                  className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-white text-black font-semibold shadow-sm border border-black/10",
                    animateWishlist && "animate-bounce-in"
                  )}
                >
                  {wishlistItems.length}
                </Badge>
              )}
            </Button>

            {/* Cart Drawer */}
            <div className="transition-transform hover:-translate-y-0.5 duration-200">
              <CartDrawer />
            </div>

            {/* Profile Dropdown for Desktop */}
            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/5 rounded-none transition-transform hover:-translate-y-0.5 duration-200"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0c0c0c] border border-white/10 rounded-none w-52 p-1.5">
                    <div className="px-2 py-1.5 border-b border-white/5 mb-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Account</p>
                      <p className="text-xs text-white truncate font-medium mt-0.5">{user.email}</p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => navigate("/orders")}
                      className="text-slate-300 focus:text-white focus:bg-white/5 rounded-none cursor-pointer py-2 text-sm"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Order History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="text-slate-300 focus:text-white focus:bg-white/5 rounded-none cursor-pointer py-2 text-sm"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-none cursor-pointer py-2 text-sm border-t border-white/5 mt-1"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="hidden md:flex bg-white text-black hover:bg-slate-200 rounded-none text-sm font-medium px-5"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Sheet Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-slate-300 hover:text-white hover:bg-white/5 rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-[#0c0c0c] border-l border-white/10 text-white p-6 flex flex-col justify-between w-72 h-full z-[100]"
              >
                <div>
                  <SheetHeader className="border-b border-white/10 pb-4 mb-6">
                    <SheetTitle className="text-white flex items-center gap-2 text-xl font-bold font-mono tracking-wider">
                      <ShoppingBag className="h-5 w-5 text-white" />
                      UrbanCart
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 text-base">
                    {navLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-slate-400 hover:text-white hover:pl-2 transition-all duration-200 py-1.5 border-l-2 border-transparent",
                          isLinkActive(link.path) && "text-white font-medium border-l-white pl-2"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mt-auto space-y-4">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-1 py-1.5">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
                          <User className="h-4.5 w-4.5 text-slate-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-500">Customer Account</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/orders");
                        }}
                        variant="outline"
                        className="w-full justify-start border-white/10 text-slate-300 hover:text-white hover:bg-white/5 rounded-none text-xs"
                      >
                        <Package className="h-3.5 w-3.5 mr-2" />
                        Order History
                      </Button>
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/admin");
                        }}
                        variant="outline"
                        className="w-full justify-start border-white/10 text-slate-300 hover:text-white hover:bg-white/5 rounded-none text-xs"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                        Admin Dashboard
                      </Button>
                      <Button
                        onClick={handleSignOut}
                        className="w-full bg-white/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-none border border-white/10 text-xs"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/auth");
                      }}
                      className="w-full bg-white text-black hover:bg-slate-200 rounded-none text-xs font-medium py-4.5"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Global Interactive Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0c0c0c]/95 border border-white/10 text-white backdrop-blur-md max-h-[90vh] flex flex-col p-6 rounded-none z-[110]">
          <DialogHeader className="pb-3 border-b border-white/5">
            <DialogTitle className="text-white flex items-center gap-2 font-mono text-base tracking-wide uppercase">
              <Search className="h-4.5 w-4.5 text-slate-400" />
              Search Products
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mt-3">
            <Input
              placeholder="Type product name, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/15 text-white pl-4 pr-10 py-5 rounded-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-0 placeholder:text-slate-500 text-sm"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white rounded-none hover:bg-transparent"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-2 max-h-[300px]">
            {searchLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loading products catalog...
              </div>
            ) : searchQuery === "" ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Type search terms. Try: <span className="text-slate-400 font-mono">Jeans</span>, <span className="text-slate-400 font-mono">Coffee</span>, or <span className="text-slate-400 font-mono">Watch</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No matching products found for "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredProducts.map((product) => {
                  const price = product.node.priceRange.minVariantPrice;
                  const image = product.node.images.edges[0]?.node?.url;
                  return (
                    <div
                      key={product.node.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        navigate(`/product/${product.node.handle}`);
                      }}
                      className="flex items-center gap-4 p-2.5 border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group rounded-none"
                    >
                      <div className="w-11 h-11 bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {image ? (
                          <img src={image} alt={product.node.title} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate group-hover:text-slate-300 transition-colors">
                          {product.node.title}
                        </h4>
                        {product.node.productType && (
                          <span className="text-[9px] text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 mt-1 inline-block uppercase tracking-wider font-mono">
                            {product.node.productType}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};