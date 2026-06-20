import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { GraduationCap, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Glow overlay */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6b00]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3b1d82]/10 dark:bg-[#3b1d82]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center space-y-6 max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20 animate-pulse">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-primary">404</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide">Destination Unreachable</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            The page path <span className="font-mono text-foreground bg-muted p-1 rounded font-bold text-[11px]">{location.pathname}</span> does not exist or has been shifted in administrative routes.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button 
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs uppercase h-10 px-4 active:scale-95 shadow-sm"
          >
            <span>Return to System</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
