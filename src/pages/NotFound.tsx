import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white p-4">
      <div className="text-center max-w-md border border-white/10 p-12 bg-white/5 rounded-none">
        <h1 className="mb-4 text-6xl font-bold text-white">404</h1>
        <p className="mb-8 text-xl text-slate-400">Oops! Page not found</p>
        <a href="/" className="inline-block bg-white text-black hover:bg-slate-200 rounded-none px-6 py-3 font-medium transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
