import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Sign in failed", {
        description: error.message,
      });
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast.error("Sign up failed", {
        description: error.message,
      });
    } else {
      toast.success("Account created successfully!");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] text-white p-4">
      <Card className="w-full max-w-md bg-transparent border border-white/10 rounded-none">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 text-white mb-2">
            <ShoppingBag className="h-8 w-8" />
            <span className="text-2xl font-bold">UrbanCart</span>
          </div>
          <CardTitle className="text-2xl text-white">Welcome</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 border border-white/10 rounded-none h-auto mb-6">
              <TabsTrigger value="signin" className="rounded-none text-slate-400 data-[state=active]:bg-white data-[state=active]:text-black py-2">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none text-slate-400 data-[state=active]:bg-white data-[state=active]:text-black py-2">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-transparent border-white/20 text-white rounded-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-transparent border-white/20 text-white rounded-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-slate-200 rounded-none py-6 font-medium disabled:bg-white/10 disabled:text-white/40 mt-2" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-transparent border-white/20 text-white rounded-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-transparent border-white/20 text-white rounded-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-slate-200 rounded-none py-6 font-medium disabled:bg-white/10 disabled:text-white/40 mt-2" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
