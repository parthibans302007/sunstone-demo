import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
  CalendarClock, Plus, Trash2, Pause, Play, Mail, Bell, Link as LinkIcon, 
  RefreshCw, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

const REPORT_TYPES = [
  { value: "attendancePercentage", label: "Attendance Percentage Report" },
  { value: "atRiskStudents", label: "At-Risk Students Watchlist" },
  { value: "topPerformers", label: "Top Departmental Performers" },
  { value: "placementEligibility", label: "Placement Eligibility Assessment" }
];

export default function ScheduledReports() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState("attendancePercentage");
  const [frequency, setFrequency] = useState("weekly");
  const [format, setFormat] = useState("csv");
  const [deliveryMethod, setDeliveryMethod] = useState("email");
  const [recipientsString, setRecipientsString] = useState(user?.email || "");
  const [filters, setFilters] = useState({
    course: "",
    batch: "",
    semester: ""
  });

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/schedules");
      setSchedules(res.data || []);
    } catch (error) {
      console.error("Failed to fetch schedules", error);
      toast.error("Failed to load report schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a schedule identifier name");
      return;
    }

    const recipients = recipientsString
      .split(",")
      .map(r => r.trim())
      .filter(Boolean);

    if (deliveryMethod === "email" && recipients.length === 0) {
      toast.error("Please specify at least one recipient email address");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        reportType,
        frequency,
        format,
        deliveryMethod,
        recipients,
        filters: Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      };

      await api.post("/schedules", payload);
      toast.success("Automated report scheduled successfully!");
      setName("");
      setShowCreateDialog(false);
      fetchSchedules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule automated report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/schedules/${id}`, { isActive: !currentStatus });
      toast.success(currentStatus ? "Schedule paused successfully" : "Schedule resumed successfully");
      fetchSchedules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to change schedule status");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled report parameter?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove report schedule");
    }
  };

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case "email": return <Mail className="w-4 h-4 text-primary" />;
      case "notification": return <Bell className="w-4 h-4 text-success" />;
      default: return <LinkIcon className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-xs font-bold"
    >
      {/* Header welcome banner */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-border/50 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Automated Report Scheduling</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Configure periodic compilation of student analytics, placement pipelines, and attendance sheets.
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer select-none relative z-10 h-10"
        >
          <Plus className="w-4 h-4" />
          <span>New Scheduled Report</span>
        </button>
      </div>

      {/* Main Grid display */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Active Schedules & Generators</h3>
          
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule Identifier</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Report Type</th>
                  <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Frequency</th>
                  <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</th>
                  <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipients</th>
                  <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground font-semibold">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                      Loading report parameters...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground font-semibold">
                      No automated reports are scheduled currently.
                    </td>
                  </tr>
                ) : (
                  schedules.map((item) => (
                    <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground font-semibold">
                        {REPORT_TYPES.find(r => r.value === item.reportType)?.label || item.reportType}
                      </td>
                      <td className="py-3 px-4 text-center font-bold capitalize text-primary">{item.frequency}</td>
                      <td className="py-3 px-4 text-center font-mono font-black uppercase text-foreground">{item.format}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 bg-muted/50 p-1.5 rounded-lg border border-border/30 w-fit mx-auto capitalize font-bold text-[10px] text-muted-foreground">
                          {getDeliveryIcon(item.deliveryMethod)}
                          <span>{item.deliveryMethod}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium max-w-[200px] truncate" title={item.recipients?.join(", ")}>
                        {item.recipients?.join(", ") || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider",
                          item.isActive 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                          {item.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(item._id, item.isActive)}
                            className={cn(
                              "p-1.5 rounded-lg border text-xs font-bold transition-all active:scale-90 cursor-pointer",
                              item.isActive 
                                ? "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20" 
                                : "bg-success/10 text-success hover:bg-success/20 border-success/20"
                            )}
                            title={item.isActive ? "Pause schedule" : "Resume schedule"}
                          >
                            {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteSchedule(item._id)}
                            className="p-1.5 rounded-lg border bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 text-xs font-bold transition-all active:scale-90 cursor-pointer"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Dialog creation wizard */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-sm font-extrabold uppercase text-foreground flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Schedule Automated ERP Report
              </h3>
              <button 
                onClick={() => setShowCreateDialog(false)}
                className="text-muted-foreground hover:text-foreground font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Schedule Identifier Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weekly CS Placement Eligibility Summary"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Report Category Type</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
                  >
                    {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Frequency Interval</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
                  >
                    <option value="daily">Daily at 6:00 AM</option>
                    <option value="weekly">Weekly on Monday</option>
                    <option value="monthly">Monthly on 1st day</option>
                    <option value="custom">Custom (Hourly checks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">File Format Extension</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
                  >
                    <option value="csv">CSV (Comma Separated)</option>
                    <option value="excel">Excel Sheet (XLSX)</option>
                    <option value="pdf">Acrobat PDF document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Delivery Channel</label>
                  <select
                    value={deliveryMethod}
                    onChange={e => setDeliveryMethod(e.target.value)}
                    className="w-full bg-background border rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-bold cursor-pointer"
                  >
                    <option value="email">Send Email Attachment</option>
                    <option value="notification">Post Portal Alert</option>
                    <option value="link">Provide Download Link</option>
                  </select>
                </div>
              </div>

              {deliveryMethod === "email" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Recipients List (Comma separated emails)</label>
                  <input 
                    type="text" 
                    placeholder="advisor@university.edu, dean@university.edu"
                    value={recipientsString}
                    onChange={e => setRecipientsString(e.target.value)}
                    className="w-full bg-background border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-9 font-semibold"
                  />
                </div>
              )}

              {/* Filters subset */}
              <div className="bg-muted/30 border p-3.5 rounded-xl space-y-3">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-black">Applied Report Filters (Optional)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground uppercase">Course</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BCA"
                      value={filters.course}
                      onChange={e => setFilters({...filters, course: e.target.value})}
                      className="w-full bg-card border rounded-lg px-2 py-1 text-[10px] outline-none font-semibold h-7"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground uppercase">Batch</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2024"
                      value={filters.batch}
                      onChange={e => setFilters({...filters, batch: e.target.value})}
                      className="w-full bg-card border rounded-lg px-2 py-1 text-[10px] outline-none font-semibold h-7"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground uppercase">Semester</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 3"
                      value={filters.semester}
                      onChange={e => setFilters({...filters, semester: e.target.value})}
                      className="w-full bg-card border rounded-lg px-2 py-1 text-[10px] outline-none font-semibold h-7"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button 
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="bg-muted border hover:bg-muted/80 text-foreground font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 h-10 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/95 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow active:scale-95 h-10 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Schedule</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
