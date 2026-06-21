import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Bell, Check, RefreshCw, Trash2,
  AlertTriangle, CheckCircle, Info, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 20 } }
};

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("unread");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update notification");
    }
  };

  // Delete single notification
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear notifications");
    }
  };

  // Filter items
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filter === "unread") return !n.isRead;
      if (filter === "read") return n.isRead;
      return true;
    });
  }, [notifications, filter]);

  // Get matching icon and color based on notification type
  const getAlertStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          icon: AlertTriangle,
          classes: "bg-warning/10 text-warning border-warning/20 border"
        };
      case "success":
        return {
          icon: CheckCircle,
          classes: "bg-success/10 text-success border-success/20 border"
        };
      case "danger":
        return {
          icon: XCircle,
          classes: "bg-destructive/10 text-destructive border-destructive/20 border"
        };
      default:
        return {
          icon: Info,
          classes: "bg-blue-50 text-blue-600 border-blue-100 border"
        };
    }
  };

  if (loading) {
    return (
      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.1s" }}>
        <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-xs font-bold">
          <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
          Synchronizing system alerts...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.2s" }}>
      <div className="space-y-6 max-w-2xl">
        {/* Top Banner */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0s" }}>
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">Alert Center</h1>
              <p className="text-xs text-muted-foreground font-medium">View compliance flags, academic reports generation alerts, and placement eligibility updates.</p>
            </div>
          </div>
        </motion.div>

        {/* Control Toolbar */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.1s" }}>
          <div className="relative overflow-hidden rounded-2xl p-4 border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 bg-card flex items-center justify-between text-xs font-bold">
            <div className="flex bg-muted/40 p-1 border rounded-xl gap-0.5">
              <button
                onClick={() => setFilter("unread")}
                className={cn("px-3 py-1.5 rounded-lg transition-all", filter === "unread" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter("read")}
                className={cn("px-3 py-1.5 rounded-lg transition-all", filter === "read" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                Read
              </button>
              <button
                onClick={() => setFilter("all")}
                className={cn("px-3 py-1.5 rounded-lg transition-all", filter === "all" && "bg-card shadow-sm text-primary border border-border/10")}
              >
                All
              </button>
            </div>

            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/90"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {/* Notifications list feed */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.2s" }}>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ transitionDelay: "0.1s" }}>
                <div className="py-16 text-center border border-dashed rounded-2xl bg-card border-border/80 flex flex-col items-center justify-center gap-3">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs font-bold text-muted-foreground">No alerts matching the selected filter.</p>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((n) => {
                  const styles = getAlertStyles(n.type);
                  const IconComp = styles.icon;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, padding: 0 }}
                      className={cn(
                        "bg-card border rounded-2xl p-4.5 flex gap-4 transition-all hover:shadow-sm relative group items-start",
                        !n.isRead ? "border-primary/30" : "border-border/60"
                      )}>
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", styles.classes)}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-foreground leading-snug">{n.title}</h4>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0 uppercase tracking-wide">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed font-semibold">{n.message}</p>
                      </div>

                      <div className="flex gap-1.5 shrink-0 ml-2">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n._id)}
                            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-colors select-none"
                            title="Mark as Read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="p-1.5 rounded-lg border hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors select-none"
                          title="Delete Notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Notifications;
