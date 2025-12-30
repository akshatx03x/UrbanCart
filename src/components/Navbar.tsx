import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, LogOut, User, LayoutDashboard, Heart, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/stores/wishlistStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const wishlistItems = useWishlistStore(state => state.items);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed inset-x-0 top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <ShoppingBag className="h-8 w-8" />
          UrbanCart
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/shop" className="text-foreground hover:text-primary transition-colors">
            Shop
          </Link>
          <Link to="/#about" className="text-foreground hover:text-primary transition-colors">
            About
          </Link>
        </div>

        <div className="flex items-center gap-3">
         <div className="hidden"><ThemeToggle /></div> 
          
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/wishlist")}>
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {wishlistItems.length}
              </Badge>
            )}
          </Button>
          
          <CartDrawer />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="h-4 w-4 mr-2" />
                  Order History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
};
