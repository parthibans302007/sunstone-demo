import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { 
  Sliders, Sun, Moon, Laptop,
  Check, RefreshCw, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submittingRules, setSubmittingRules] = useState(false);

  // Active Placement Rules form state
  const [rulesForm, setRulesForm] = useState({
    minCGPA: 6.0,
    minAttendance: 75,
    internshipRequired: false,
    maxBacklogs: 0
  });

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement/rules");
      if (res.data) {
        setRulesForm({
          minCGPA: res.data.minCGPA || 6.0,
          minAttendance: res.data.minAttendance || 75,
          internshipRequired: res.data.internshipRequired || false,
          maxBacklogs: res.data.maxBacklogs || 0
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRules();
    } else {
      setLoading(false);
    }
  }, [user, fetchRules]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRules(true);
    try {
      await api.post("/placement/rules", rulesForm);
      toast.success("System criteria rules updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update criteria thresholds");
    } finally {
      setSubmittingRules(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Loading system configuration settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl text-xs font-bold">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">System Configuration</h1>
          <p className="text-xs text-muted-foreground font-medium">Manage institutional parameters, interface themes, and portal security profiles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Placement Criteria Rule settings */}
        {user?.role === "admin" && (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Global Placement Thresholds
            </h3>

            <form onSubmit={handleSaveRules} className="space-y-4">
              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Minimum CGPA Required</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.minCGPA}
                  onChange={e => setRulesForm({...rulesForm, minCGPA: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Minimum Attendance % Required</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.minAttendance}
                  onChange={e => setRulesForm({...rulesForm, minAttendance: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Maximum Backlogs Allowed</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  value={rulesForm.maxBacklogs}
                  onChange={e => setRulesForm({...rulesForm, maxBacklogs: parseInt(e.target.value)})}
                />
              </div>

              <label className="flex items-center gap-2.5 bg-muted/20 border p-3 rounded-xl cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rulesForm.internshipRequired} 
                  onChange={e => setRulesForm({...rulesForm, internshipRequired: e.target.checked})}
                  className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <span>Mandatory Internship Completed</span>
              </label>

              <button 
                type="submit" 
                disabled={submittingRules}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow h-10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingRules ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save global thresholds
              </button>
            </form>
          </div>
        )}

        {/* Theme Preferences and Profile */}
        <div className="space-y-6">
          {/* Theme card */}
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-primary" />
              Interface Theme Style
            </h3>
            
            <div className="flex bg-muted/40 p-1 border rounded-xl gap-1 select-none">
              <button 
                onClick={() => setTheme("light")}
                className={cn("flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all", theme === "light" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={cn("flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all", theme === "dark" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button 
                onClick={() => setTheme("system")}
                className={cn("flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all", theme === "system" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Profile overview card */}
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Account Profile
            </h3>
            
            <ul className="space-y-3 font-semibold text-xs text-muted-foreground">
              <li className="flex justify-between border-b pb-1.5"><span>Coordinator Name:</span> <strong className="text-foreground">{user?.name}</strong></li>
              <li className="flex justify-between border-b pb-1.5"><span>Registered Email:</span> <strong className="text-foreground">{user?.email}</strong></li>
              <li className="flex justify-between pb-0"><span>User Authority Role:</span> <strong className="text-foreground capitalize">{user?.role}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
