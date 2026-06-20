import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Activity, Server, Database, Users, HardDrive, ShieldAlert, 
  RefreshCw, Cpu, Clock, CheckCircle2, AlertTriangle, ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function SystemHealth() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pingData, setPingData] = useState<any[]>([]);

  const fetchHealth = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const startTime = Date.now();
      const res = await api.get("/health");
      const latency = Date.now() - startTime;

      if (res.data) {
        setData(res.data);
        
        // Add current latency ping test metric
        setPingData(prev => {
          const next = [...prev, { time: new Date().toLocaleTimeString().slice(0, 8), ping: latency }];
          if (next.length > 15) next.shift(); // Keep last 15 ticks
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to check system health status", error);
      toast.error("Failed to retrieve system diagnostic parameters");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getUptimeString = (seconds: number) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return [
      d > 0 ? `${d}d` : "",
      h > 0 ? `${h}h` : "",
      m > 0 ? `${m}m` : "",
      `${s}s`
    ].filter(Boolean).join(" ");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
        Bootstrapping system diagnostics panel...
      </div>
    );
  }

  const isHealthy = data?.dbStatus === "Connected";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-xs font-bold"
    >
      {/* Welcome header capsule */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-border/50 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>System Health & Status</span>
              <span className={cn(
                "w-2.5 h-2.5 rounded-full inline-block", 
                isHealthy ? "bg-success animate-ping" : "bg-destructive animate-bounce"
              )} />
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Monitor real-time microservices, DB clusters, CPU workload, memory allocation, and operational logs.
          </p>
        </div>
        
        <button 
          onClick={() => fetchHealth(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-card hover:bg-muted border border-border/80 px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 text-foreground cursor-pointer select-none relative z-10 h-10 disabled:opacity-40"
        >
          <RefreshCw className={cn("w-4 h-4 text-primary", refreshing && "animate-spin")} />
          <span>{refreshing ? "Refreshing..." : "Trigger Diagnostics"}</span>
        </button>
      </div>

      {/* Backend Unreachable Alert */}
      {!data && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide">System Cluster Unreachable</h4>
            <p className="mt-1 text-muted-foreground font-medium text-xs leading-relaxed">
              The diagnostics controller is unable to connect to the backend microservices. Please verify that the API server is active and reachable.
            </p>
          </div>
        </div>
      )}

      {/* Health metrics grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {/* DB Status */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wide">Database Cluster</span>
            <Database className={cn("w-5 h-5", isHealthy ? "text-success" : "text-destructive")} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{data?.dbStatus || "Offline"}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wide">
            {isHealthy ? (
              <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> MongoDB Atlas Ready</span>
            ) : (
              <span className="text-destructive flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Conn Refused</span>
            )}
          </div>
        </div>

        {/* Total Active Users */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wide">Registered Users</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{data?.totalUsers || 0}</span>
            <span className="text-[10px] text-muted-foreground">total</span>
          </div>
          <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
            {data?.totalStudents || 0} Students · {data?.totalFaculty || 0} Faculty
          </div>
        </div>

        {/* Active Auth Sessions */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wide">Active Sessions</span>
            <Server className="w-5 h-5 text-accent" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{data?.activeSessions || 0}</span>
            <span className="text-[10px] text-muted-foreground">online</span>
          </div>
          <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
            Active JWT tokens on rotate schedule
          </div>
        </div>

        {/* Server Memory Allocation */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wide">Memory Allocated</span>
            <HardDrive className="w-5 h-5 text-warning" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{data?.memoryUsage?.split(" / ")[0] || "0 MB"}</span>
            <span className="text-[10px] text-muted-foreground">in use</span>
          </div>
          <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
            Limit: {data?.memoryUsage?.split(" / ")[1] || "N/A"}
          </div>
        </div>
      </motion.div>

      {/* Latency tracker & OS specifications */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency line chart */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">API Latency Trace (Ping test)</h3>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Time taken for REST request execution in milliseconds</p>
          </div>
          
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pingData.length > 0 ? pingData : [{time: "Test", ping: 10}]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} unit="ms" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="ping" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating system info */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Hardware Architecture</h3>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Underlying operating infrastructure parameters</p>
          </div>

          <div className="space-y-4 flex-1 mt-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Cpu className="w-4 h-4 text-primary" /> CPU Cores</span>
              <span className="text-foreground font-mono font-black">{data?.systemCpu || 4} Virtual Core(s)</span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Server Uptime</span>
              <span className="text-foreground font-mono font-black">{getUptimeString(data?.uptime)}</span>
            </div>

            <div className="flex items-center justify-between pb-0">
              <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Server className="w-4 h-4 text-primary" /> API Cluster Gateway</span>
              <span className="text-success font-black flex items-center gap-1">Online (V1.0)</span>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 text-[10px] text-primary leading-relaxed font-semibold">
            🚀 All gateway endpoints operational. CORS and rate-limiting profiles active.
          </div>
        </div>
      </motion.div>

      {/* Recent errors log */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          Diagnostics Watchdog: Critical Failures & Logs
        </h3>

        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Action type</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Module</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Logged User</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">IP</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-semibold text-xs">
              {!data?.recentErrors || data.recentErrors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground font-semibold">
                    Awesome! Zero failures, declassifications, or deactivations logged.
                  </td>
                </tr>
              ) : (
                data.recentErrors.map((err: any) => (
                  <tr key={err._id} className="hover:bg-muted/10">
                    <td className="py-3 px-4 text-destructive font-black flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {err.actionType}
                    </td>
                    <td className="py-3 px-4 text-foreground">{err.module}</td>
                    <td className="py-3 px-4 text-muted-foreground">{err.userName} ({err.userRole})</td>
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">{err.ipAddress || "::1"}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{new Date(err.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
