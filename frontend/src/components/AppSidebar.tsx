import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Users, ClipboardCheck, FileText,
  Bell, Settings, LogOut, GraduationCap,
  ChevronLeft, ChevronRight, Sun, Moon, Laptop, Briefcase, TrendingUp,
  History, CalendarClock, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Students", icon: Users, path: "/students" },
  { label: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Performance", icon: GraduationCap, path: "/performance" },
  { label: "Placement", icon: Briefcase, path: "/placement" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Report Schedules", icon: CalendarClock, path: "/schedules" },
  { label: "Audit Trail", icon: History, path: "/audit-logs" },
  { label: "System Health", icon: Activity, path: "/system-health" },
  { label: "Analytics", icon: TrendingUp, path: "/analytics" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Settings", icon: Settings, path: "/settings" }
];

const facultyNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Students", icon: Users, path: "/students" },
  { label: "Mark Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Performance", icon: GraduationCap, path: "/performance" },
  { label: "Placement", icon: Briefcase, path: "/placement" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Report Schedules", icon: CalendarClock, path: "/schedules" },
  { label: "Notifications", icon: Bell, path: "/notifications" }
];

const studentNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Attendance", icon: ClipboardCheck, path: "/my-attendance" },
  { label: "Placement", icon: Briefcase, path: "/placement" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Notifications", icon: Bell, path: "/notifications" }
];

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Collapsed state initialized from localStorage for persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar-collapsed", String(nextVal));
  };

  const nav = user?.role === "admin" ? adminNav : user?.role === "faculty" ? facultyNav : studentNav;

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border/30 flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.03)] relative z-20 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle floating on the border line */}
      <button
        onClick={toggleCollapse}
        className="absolute top-8 -right-3 w-6 h-6 rounded-full border border-sidebar-border/60 bg-card flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent shadow-sm z-30 transition-transform active:scale-90"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        )}
      </button>

      {/* Brand logo & header */}
      <div className={cn("p-5 border-b border-sidebar-border/30", isCollapsed ? "flex justify-center" : "")}>
        <div className="flex items-center gap-3 overflow-hidden select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm flex items-center justify-center shrink-0 transform transition-transform hover:scale-105">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">Sunstone</h1>
              <p className="text-[8px] text-sidebar-foreground/60 font-bold tracking-wider uppercase mt-1">Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname === item.path;
          
          const navButton = (
            <button
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                active
                  ? "bg-sidebar-accent text-primary font-semibold shadow-sm border border-sidebar-border/40"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-transform duration-200 shrink-0",
                active ? "text-primary scale-110" : "text-sidebar-foreground/50 group-hover:text-primary group-hover:scale-105"
              )} />
              
              {!isCollapsed && (
                <span className="truncate animate-in fade-in duration-200">{item.label}</span>
              )}
              
              {!isCollapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
              )}
            </button>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={50}>
                <TooltipTrigger asChild>
                  {navButton}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border text-popover-foreground shadow-md font-semibold text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navButton;
        })}
      </nav>

      {/* Theme Toggler and User Footer */}
      <div className="p-4 border-t border-sidebar-border/30 bg-sidebar-accent/10">
        {/* Modern Switch Theme Button */}
        {isCollapsed ? (
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full h-9 flex items-center justify-center rounded-xl bg-sidebar-accent/30 border border-sidebar-border/30 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500 animate-in spin-in duration-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500 animate-in spin-in duration-500" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border text-popover-foreground font-semibold text-xs">
              Toggle {theme === "dark" ? "Light" : "Dark"} Mode
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between p-1 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/30 mb-3 animate-in fade-in duration-300">
            <span className="text-[10px] font-bold text-sidebar-foreground/60 pl-2.5 uppercase tracking-wider">Mode</span>
            <div className="flex gap-0.5">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all",
                  theme === "light" && "bg-card shadow-sm text-primary border border-border/10"
                )}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all",
                  theme === "dark" && "bg-card shadow-sm text-primary border border-border/10"
                )}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all",
                  theme === "system" && "bg-card shadow-sm text-primary border border-border/10"
                )}
                title="System Default"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* User profile capsule info */}
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center mt-2" : "mt-1")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 border border-white/20">
            {user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-xs font-bold text-sidebar-foreground truncate leading-none mb-1">{user?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize tracking-wide font-medium">{user?.role}</p>
            </div>
          )}

          {!isCollapsed && (
            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-destructive border border-destructive/20 text-white font-semibold text-xs">
                Sign Out
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {isCollapsed && (
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="w-full h-9 flex items-center justify-center rounded-xl hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground/50 mt-3 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-destructive border border-destructive/20 text-white font-semibold text-xs">
              Sign Out
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
