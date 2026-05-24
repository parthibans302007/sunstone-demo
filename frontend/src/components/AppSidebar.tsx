import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardCheck, FileText, Calendar,
  Bell, Settings, LogOut, GraduationCap, UserCheck, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Students", icon: Users, path: "/students" },
  { label: "Categories", icon: Settings, path: "/categories" },
  { label: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Corrections", icon: AlertTriangle, path: "/corrections" },
  { label: "Timetable", icon: Calendar, path: "/timetable" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

const facultyNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Students", icon: Users, path: "/students" },
  { label: "Mark Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Corrections", icon: UserCheck, path: "/corrections" },
];

const studentNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Attendance", icon: ClipboardCheck, path: "/my-attendance" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Request Correction", icon: AlertTriangle, path: "/corrections" },
];

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nav = user?.role === "admin" ? adminNav : user?.role === "faculty" ? facultyNav : studentNav;

  return (
    <aside className="w-64 min-h-screen bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/30 flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.1)] relative z-20">
      <div className="p-6 border-b border-sidebar-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-accent shadow-lg flex items-center justify-center transform transition-transform hover:scale-105">
            <GraduationCap className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white tracking-tight">Sunstone</h1>
            <p className="text-[9px] text-sidebar-foreground/70 font-bold tracking-wider uppercase">MANAGEMENT SYSTEM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                active
                  ? "bg-gradient-to-r from-sidebar-accent/80 to-sidebar-accent/30 text-white shadow-sm border border-sidebar-accent/50"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-white hover:translate-x-1 border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary group-hover:scale-110"
              )} />
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shadow-[0_0_8px_rgba(199,137,72,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/30 bg-sidebar-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-xl bg-sidebar-accent/20 border border-sidebar-accent/30">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sidebar-primary to-accent flex items-center justify-center text-sm font-bold text-white shadow-md">
            {user?.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
