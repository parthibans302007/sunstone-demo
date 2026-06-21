import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
  History, Search, Filter, ArrowDownToLine, RefreshCw,
  ShieldAlert, ArrowLeftRight, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

const MODULES = ["STUDENTS", "ATTENDANCE", "PLACEMENT", "REPORTS", "AUTH"];
const ACTION_TYPES = [
  "STUDENT_ADDED", "STUDENT_UPDATED", "STUDENT_DELETED", "CGPA_UPDATED", 
  "PLACEMENT_RULES_MODIFIED", "REPORT_GENERATED", "BULK_UPLOAD_PERFORMED",
  "ATTENDANCE_MARKED", "ATTENDANCE_MODIFIED", "LOGIN", "LOGOUT"
];

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [viewingDetailLog, setViewingDetailLog] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (search) params.search = search;
      if (selectedModule) params.moduleName = selectedModule;
      if (selectedAction) params.actionType = selectedAction;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get("/audit-logs", { params });
      if (res.data) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch audit trails", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedModule, selectedAction, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("No log entries to export");
      return;
    }
    
    // Create header row
    const headers = ["Timestamp", "User", "Role", "Action Type", "Module", "IP Address", "Previous Value", "New Value"];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.userName,
      log.userRole,
      log.actionType,
      log.module,
      log.ipAddress,
      JSON.stringify(log.previousValue || ""),
      JSON.stringify(log.newValue || "")
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_trail_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported to CSV successfully!");
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("ADDED") || action.includes("MARKED")) return "bg-success/10 text-success border-success/20";
    if (action.includes("DELETED")) return "bg-destructive/10 text-destructive border-destructive/20";
    if (action.includes("UPDATED") || action.includes("MODIFIED")) return "bg-primary/10 text-primary border-primary/20";
    if (action.includes("LOGIN")) return "bg-accent/15 text-accent border-accent/20";
    return "bg-muted text-muted-foreground border-border/40";
  };

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
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Audit Log Trail</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Monitor system administrative operations, data modifications, and student record modifications.
          </p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-card hover:bg-muted border border-border/80 px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 text-foreground cursor-pointer select-none relative z-10"
        >
          <ArrowDownToLine className="w-4 h-4 text-primary" />
          <span>Export Logs (CSV)</span>
        </button>
      </div>

      {/* Filter panel */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground uppercase tracking-wider text-[10px] font-extrabold border-b pb-2">
          <Filter className="w-4 h-4 text-primary" />
          <span>Search & Filter Criteria</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Search User / Role</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search username/role..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-background border rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
              />
              <Search className="absolute left-2.5 top-2.5 w-4.5 h-4.5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Filter Module</label>
            <select
              value={selectedModule}
              onChange={e => { setSelectedModule(e.target.value); setPage(1); }}
              className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
            >
              <option value="">All Modules</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Filter Action Type</label>
            <select
              value={selectedAction}
              onChange={e => { setSelectedAction(e.target.value); setPage(1); }}
              className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">End Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
            />
          </div>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border/50">
                <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">User Name</th>
                <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">User Role</th>
                <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Module</th>
                <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Address</th>
                <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                <th className="text-right py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-semibold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                    Fetching audit trail history...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-semibold">
                    No matching audit trail events logged in system database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase select-none">
                        {log.userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span>{log.userName}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-semibold capitalize">{log.userRole}</td>
                    <td className="py-3 px-4 font-medium">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wide", getActionBadgeColor(log.actionType))}>
                        {log.actionType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-bold">{log.module}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-muted-foreground">{log.ipAddress || "::1"}</td>
                    <td className="py-3 px-4 text-center font-semibold text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setViewingDetailLog(log)}
                        className="px-3 py-1 rounded-lg bg-muted border hover:bg-muted/80 text-foreground transition-all active:scale-95 font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-5 border-t border-border/50 mt-4 select-none">
            <span className="text-muted-foreground font-semibold">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-lg border bg-card flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-all active:scale-90 disabled:opacity-40"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-lg border bg-card flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-all active:scale-90 disabled:opacity-40"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Log Inspector Overlay Drawer Modal */}
      {viewingDetailLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-sm font-extrabold uppercase text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Inspect Audit Entry Values
              </h3>
              <button 
                onClick={() => setViewingDetailLog(null)}
                className="text-muted-foreground hover:text-foreground font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 bg-muted/20 border p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">Actor</span>
                  <span className="text-foreground">{viewingDetailLog.userName} ({viewingDetailLog.userRole})</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">IP Address</span>
                  <span className="text-foreground font-mono">{viewingDetailLog.ipAddress || "::1"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">Action Type</span>
                  <span className="text-foreground">{viewingDetailLog.actionType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">Timestamp</span>
                  <span className="text-foreground">{new Date(viewingDetailLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* State value differences */}
              <div className="space-y-3 pt-3 border-t">
                {viewingDetailLog.previousValue && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[9px] flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5 text-primary" /> Previous / Pre-State Value</span>
                    <pre className="p-3 bg-card border rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed font-semibold text-foreground">
                      {JSON.stringify(viewingDetailLog.previousValue, null, 2)}
                    </pre>
                  </div>
                )}

                {viewingDetailLog.newValue && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground uppercase text-[9px] flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5 text-primary" /> Proposed / New-State Value</span>
                    <pre className="p-3 bg-card border rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed font-semibold text-foreground">
                      {JSON.stringify(viewingDetailLog.newValue, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!viewingDetailLog.previousValue && !viewingDetailLog.newValue && (
                  <div className="text-center py-6 text-muted-foreground font-semibold">
                    No state-change diff data is associated with this login/logout action.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setViewingDetailLog(null)}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow active:scale-95 h-10"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
