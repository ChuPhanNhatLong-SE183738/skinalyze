"use client";
import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

function getUserFromCookie(): User | null {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  const userDataCookie = cookies.find((c) => c.trim().startsWith("user_data="));
  if (!userDataCookie) return null;
  try {
    const value = userDataCookie.split("=")[1];
    return JSON.parse(decodeURIComponent(value)) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve user from cookie on mount
    const userData = getUserFromCookie();
    setUser(userData);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
