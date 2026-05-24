import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ShieldAlert, KeyRound, ChevronRight } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password === "password123") {
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Sunstone Amber/Purple background aesthetic overlay */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6b00]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3b1d82]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#ff6b00]/10 rounded-2xl flex items-center justify-center mb-4 text-[#ff6b00] shadow-sm border border-[#ff6b00]/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Secure your account</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to Sunstone Management System! Please change your default password before accessing your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-2xl border shadow-xl flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-shadow outline-none"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Confirm Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-shadow outline-none"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white py-3 rounded-xl font-semibold shadow-md shadow-[#ff6b00]/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Securing account..." : "Update Password"}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
