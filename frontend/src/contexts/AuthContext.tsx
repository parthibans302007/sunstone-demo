import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

export type Role = "admin" | "faculty" | "student" | "parent";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isFirstLogin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateSession: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkLoggedUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const { data } = await api.get("/auth/profile");
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return true;
    } catch (error) {
      console.error("Login Error", error);
      throw error;
    }
  };

  const updateSession = (updatedUser: Partial<User>) => {
    if (user) {
      const mergedUser = { ...user, ...updatedUser };
      setUser(mergedUser);
      localStorage.setItem("user", JSON.stringify(mergedUser));
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Failed to call server logout", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSession, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
