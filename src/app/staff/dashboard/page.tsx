"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Package, TrendingUp } from "lucide-react";
import { authService } from "@/services/authService";
import { StaffLayout } from "@/components/layout/StaffLayout";
import type { User as UserType } from "@/types/auth";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check authentication via API
        const { authenticated, user: userData } = await authService.checkAuth();

        if (!authenticated || !userData) {
          router.push("/login");
          return;
        }

        // Check if user is staff
        if (userData.role !== "staff" && userData.role !== "admin") {
          router.push("/login");
          return;
        }

        setUser(userData);
      } catch (error) {
        // Redirect to login if validation fails
        router.push("/login");
      }
    };

    checkAuthStatus();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <StaffLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back, {user.fullName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Name
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Role
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {user.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage orders, customers, and more from the sidebar menu.
              </p>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                System statistics and insights coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
}
