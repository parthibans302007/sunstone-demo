import { useState } from "react";
import { mockCorrectionRequests, CorrectionRequest } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Corrections = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CorrectionRequest[]>(mockCorrectionRequests);

  const handleAction = (id: string, action: "approved" | "denied") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    toast.success(`Request ${action}`);
  };

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock className="w-4 h-4 text-warning" />;
    if (status === "approved") return <Check className="w-4 h-4 text-success" />;
    return <X className="w-4 h-4 text-destructive" />;
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Attendance Corrections</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.role === "student" ? "Submit and track correction requests" : "Review and manage correction requests"}
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon(req.status)}
                  <span className="font-medium text-sm">{req.studentName}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full capitalize",
                    req.status === "pending" && "bg-warning/10 text-warning",
                    req.status === "approved" && "bg-success/10 text-success",
                    req.status === "denied" && "bg-destructive/10 text-destructive"
                  )}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{req.subject} · {req.date}</p>
                <p className="text-sm mt-1">{req.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">Submitted: {req.createdAt}</p>
              </div>
              {(user?.role === "admin" || user?.role === "faculty") && req.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => handleAction(req.id, "approved")}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleAction(req.id, "denied")}>
                    <X className="w-3.5 h-3.5 mr-1" /> Deny
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Corrections;
