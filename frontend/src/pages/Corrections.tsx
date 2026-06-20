import { useState } from "react";
import { mockCorrectionRequests, CorrectionRequest } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, AlertTriangle, ShieldCheck, Inbox, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Corrections = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CorrectionRequest[]>(mockCorrectionRequests);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "denied">("all");

  const handleAction = (id: string, action: "approved" | "denied") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    toast.success(`Request successfully ${action}!`, {
      icon: action === "approved" ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />
    });
  };

  const statusColors = {
    pending: "bg-warning/15 text-warning border-warning/20",
    approved: "bg-success/15 text-success border-success/20",
    denied: "bg-destructive/15 text-destructive border-destructive/20"
  };

  const statusIcons = {
    pending: <Clock className="w-3.5 h-3.5 text-warning shrink-0" />,
    approved: <Check className="w-3.5 h-3.5 text-success shrink-0" />,
    denied: <X className="w-3.5 h-3.5 text-destructive shrink-0" />
  };

  const filteredRequests = requests.filter(r => {
    if (activeFilter === "all") return true;
    return r.status === activeFilter;
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sidebar-accent/10 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Roster Corrections</h1>
          <p className="text-xs text-muted-foreground font-medium">
            {user?.role === "student" ? "Submit and monitor attendance override requests." : "Manage student attendance override requests."}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-3 border-border/40">
        {(["all", "pending", "approved", "denied"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border",
              activeFilter === filter
                ? "bg-primary text-white border-primary shadow-sm active:scale-95"
                : "bg-card hover:bg-muted text-muted-foreground border-border/60"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Roster Requests feed */}
      <AnimatePresence mode="popLayout">
        {filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border/60 p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-3"
          >
            <Inbox className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-muted-foreground">No correction requests found matching current filter.</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-4">
            {filteredRequests.map((req) => {
              const nameInitials = req.studentName.split(" ").map((n) => n[0]).join("").toUpperCase();
              
              return (
                <motion.div 
                  key={req.id} 
                  variants={itemVariants}
                  layout
                  className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar initial badge */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
                        {nameInitials}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{req.studentName}</span>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                            statusColors[req.status]
                          )}>
                            {statusIcons[req.status]}
                            {req.status}
                          </span>
                        </div>
                        
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Subject: <span className="text-foreground">{req.subject}</span> · Date: <span className="text-foreground font-mono">{req.date}</span>
                        </p>
                        
                        {/* Reason block */}
                        <div className="flex gap-2 bg-muted/30 border border-border/30 rounded-xl p-3 text-xs leading-relaxed text-foreground mt-2 font-medium">
                          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p>{req.reason}</p>
                        </div>

                        <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider pt-2">
                          Submitted calendar log: {req.createdAt}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons (only for Admin/Faculty on Pending items) */}
                    {(user?.role === "admin" || user?.role === "faculty") && req.status === "pending" && (
                      <div className="flex gap-2 sm:self-center shrink-0 w-full sm:w-auto justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-success border-success/30 hover:bg-success/10 rounded-xl text-xs font-bold px-3" 
                          onClick={() => handleAction(req.id, "approved")}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl text-xs font-bold px-3" 
                          onClick={() => handleAction(req.id, "denied")}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Corrections;
