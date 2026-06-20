import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, Role } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Attendance from "./pages/Attendance";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Corrections from "./pages/Corrections";
import Timetable from "./pages/Timetable";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";
import Placement from "./pages/Placement";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import ScheduledReports from "./pages/ScheduledReports";
import SystemHealth from "./pages/SystemHealth";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ 
  children, 
  isChangePasswordRoute = false,
  allowedRoles
}: { 
  children: ReactNode; 
  isChangePasswordRoute?: boolean;
  allowedRoles?: Role[];
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.isFirstLogin && !isChangePasswordRoute) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

import { AppLayout } from "@/components/AppLayout";
import { Outlet } from "react-router-dom";

const LayoutWrapper = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/change-password" element={<ProtectedRoute isChangePasswordRoute={true}><ChangePassword /></ProtectedRoute>} />
      
      {/* Global AppLayout Wrapper for Protected Page Routes */}
      <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<ProtectedRoute allowedRoles={["admin", "faculty"]}><Students /></ProtectedRoute>} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/attendance" element={<ProtectedRoute allowedRoles={["admin", "faculty"]}><Attendance /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute allowedRoles={["admin", "faculty"]}><Categories /></ProtectedRoute>} />
        <Route path="/my-attendance" element={<StudentProfile />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/corrections" element={<ProtectedRoute allowedRoles={["admin", "faculty"]}><Corrections /></ProtectedRoute>} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><Analytics /></ProtectedRoute>} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute allowedRoles={["admin", "faculty"]}><ScheduledReports /></ProtectedRoute>} />
        <Route path="/system-health" element={<ProtectedRoute allowedRoles={["admin"]}><SystemHealth /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
