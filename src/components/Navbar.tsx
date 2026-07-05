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
    <nav className="border-b border-white/10 bg-[#0c0c0c] fixed inset-x-0 top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white">
          <ShoppingBag className="h-7 w-7" />
          UrbanCart
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/shop" className="text-slate-300 hover:text-white transition-colors">
            Shop
          </Link>
          <Link to="/#about" className="text-slate-300 hover:text-white transition-colors">
            About
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden"><ThemeToggle /></div>

          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-300 hover:text-white hover:bg-white/5 rounded-none"
            onClick={() => navigate("/wishlist")}
          >
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white text-black">
                {wishlistItems.length}
              </Badge>
            )}
          </Button>

          <CartDrawer />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/5 rounded-none">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0c0c0c] border border-white/10 rounded-none">
                <DropdownMenuItem onClick={() => navigate("/orders")} className="text-slate-300 focus:text-white focus:bg-white/5">
                  <Package className="h-4 w-4 mr-2" />
                  Order History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin")} className="text-slate-300 focus:text-white focus:bg-white/5">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-slate-300 focus:text-white focus:bg-white/5">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-slate-200 rounded-none">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};