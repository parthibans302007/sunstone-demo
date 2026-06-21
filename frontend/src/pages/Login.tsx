import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldAlert, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({ message: "", type: "" }); // type: 'network' | 'invalid-credentials' | 'server-error' | 'unknown'
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError({ message: "", type: "" });
    try {
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      let message = "";
      let type = "unknown";
      if (err.response) {
        // Server responded with a status code
        if (err.response.status === 401) {
          message = "Invalid credentials. Please check your email and password.";
          type = "invalid-credentials";
        } else if (err.response.status >= 500) {
          message = "Server error. Please try again later.";
          type = "server-error";
        } else {
          message = err.response.data?.message || "An unexpected error occurred.";
          type = "server-error";
        }
      } else if (err.request) {
        // Request made but no response
        message = "Network error. Unable to connect to the server.";
        type = "network";
      } else {
        // Something else caused the error
        message = err.message || "An unexpected error occurred.";
        type = "unknown";
      }
      setError({ message, type });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* LEFT SIDE: Brand Showcase (Visible only on desktop md+) */}
      <div className="hidden md:flex md:w-1/2 flex flex-col justify-between p-12 bg-gradient-to-tr from-[#3b1d82] via-[#21104a] to-[#ff6b00]/30 relative overflow-hidden flex-1 text-white">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#ff6b00]/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#3b1d82]/40 blur-[150px] rounded-full pointer-events-none" />

        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40h40M40 0v40' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#ff6b00]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">Sunstone <span className="font-normal text-white/70">Management</span></span>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="relative z-10 flex-1 flex-col justify-center max-w-lg space-y-6">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight lg:text-4xl">
            Welcome to Sunstone Management System
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            Comprehensive college management platform for administrators, faculty, and students.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative overflow-hidden">
        {/* Animated backgrounds */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ff6b00]/5 dark:bg-[#ff6b00]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3b1d82]/5 dark:bg-[#3b1d82]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile logo (Visible only on small screens) */}
          <div className="flex flex-col items-center md:hidden mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-3">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sunstone Management</h1>
          </div>

          {/* Header */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sign In</h2>
            <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
          </div>

          {/* Error message */}
          {error.message && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${error.type === 'network' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                         error.type === 'invalid-credentials' ? 'bg-red-50 border-red-200 text-red-800' :
                         error.type === 'server-error' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                         'bg-gray-50 border-gray-200 text-gray-800'}`}>
              {error.type === 'network' && <Zap className="w-5 h-5 shrink-0 mt-0.5" />}
              {error.type === 'invalid-credentials' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
              {error.type === 'server-error' && <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />}
              {!['network', 'invalid-credentials', 'server-error'].includes(error.type) && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
              <span className="text-sm">{error.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type="email"
                  name="email"
                  placeholder="name@sunstone.edu"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError({ message: "", type: "" }); }}
                  className="h-11 pl-10 bg-card/50 focus-visible:ring-[#ff6b00] focus-visible:border-[#ff6b00]"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                <button type="button" className="text-xs font-semibold text-primary hover:underline underline-offset-2">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError({ message: "", type: "" }); }}
                  className="h-11 pl-10 pr-10 bg-card/50 focus-visible:ring-[#ff6b00] focus-visible:border-[#ff6b00]"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Signing in...</span>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer disclaimer */}
          <div className="text-center space-y-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              By logging in, you agree to our <a href="#" className="underline hover:text-foreground">Terms of Service</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase">
              © 2026 Sunstone Inc. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;