import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ShieldAlert, KeyRound, ChevronRight, Check, X, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

export default function ChangePassword() {
  const { user, updateSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If not supposed to be here, kick them out
  if (!user || user.isFirstLogin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  // Real-time validation criteria checks
  const isMinLength = password.length >= 6;
  const isNotDefault = password !== "password123";
  const isMatching = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatching) {
      toast.error("Passwords do not match");
      return;
    }
    if (!isMinLength) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!isNotDefault) {
      toast.error("You must choose a new distinct password.");
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/change-password", { newPassword: password });
      toast.success("Password secured! Welcome to Sunstone.");
      // Mutate the local session so they aren't trapped
      updateSession({ isFirstLogin: false });
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Sunstone Amber/Purple background aesthetic glow overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3b1d82]/10 dark:bg-[#3b1d82]/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cpath d='M0 0h30v30H0z' fill='none'/%3E%3Cpath d='M0 30h30M30 0v30' stroke='%23000000' stroke-width='1'/%3E%3C/svg%3E")`,
      }} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md z-10 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20 animate-bounce">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">Secure Your Account</h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto font-medium">
            Welcome to Sunstone Campus. Please define a unique password credential before entering your dashboard workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/60 shadow-xl flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none font-semibold h-10"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Confirm Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none font-semibold h-10"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Real-time Checklist indicator */}
          <div className="bg-muted/40 p-3.5 rounded-xl border border-border/30 text-[10px] font-bold uppercase tracking-wider space-y-2 text-muted-foreground">
            <p className="text-foreground border-b border-border/20 pb-1">Security Standards</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded-md flex items-center justify-center border", isMinLength ? "bg-success border-success text-white" : "border-muted-foreground/40")}>
                {isMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-muted-foreground/30" />}
              </div>
              <span className={cn(isMinLength && "text-success")}>Minimum 6 characters long</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded-md flex items-center justify-center border", isNotDefault ? "bg-success border-success text-white" : "border-muted-foreground/40")}>
                {isNotDefault ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-muted-foreground/30" />}
              </div>
              <span className={cn(isNotDefault && "text-success")}>Distinct from "password123"</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded-md flex items-center justify-center border", isMatching ? "bg-success border-success text-white" : "border-muted-foreground/40")}>
                {isMatching ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-muted-foreground/30" />}
              </div>
              <span className={cn(isMatching && "text-success")}>Passwords match</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed h-10 active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Securing Ledger Account...</span>
              </>
            ) : (
              <>
                <span>Secure Credentials</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
