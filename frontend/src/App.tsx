import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, isChangePasswordRoute = false }: { children: ReactNode, isChangePasswordRoute?: boolean }) => {
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
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/my-attendance" element={<StudentProfile />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/corrections" element={<Corrections />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/notifications" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
