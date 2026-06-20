import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Close mobile navigation drawer automatically upon route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SU";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* MOBILE & TABLET STICKY HEADER */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-md border-b border-border/50 select-none">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <button 
                className="p-1.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Navigation Menu"
              >
                <Menu className="w-4 h-4 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none">
              {/* Force expanded sidebar layout inside the drawer overlay */}
              <div className="h-full [&_aside]:w-full [&_button[title='Collapse\ Sidebar']]:hidden [&_button[title='Expand\ Sidebar']]:hidden">
                <AppSidebar />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo capsule */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-foreground uppercase">Sunstone</span>
          </div>
        </div>

        {/* User initials circle */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xs font-bold border border-white/20 shadow-sm">
          {userInitials}
        </div>
      </header>

      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)] md:h-screen bg-background/30">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
