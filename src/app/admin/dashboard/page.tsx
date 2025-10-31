"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Package,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Activity,
  Settings,
} from "lucide-react";
import { authService } from "@/services/authService";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { User as UserType } from "@/types/auth";

export default function AdminDashboardPage() {
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

        // Check if user is admin
        if (userData.role !== "admin") {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Welcome back, {user.fullName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-5 h-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs opacity-75 mt-1">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingBag className="w-5 h-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,350</div>
              <p className="text-xs opacity-75 mt-1">
                +180 orders this week
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="w-5 h-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,234</div>
              <p className="text-xs opacity-75 mt-1">
                +573 new users
              </p>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Health
              </CardTitle>
              <Activity className="w-5 h-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs opacity-75 mt-1">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Admin Profile Card */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <User className="w-5 h-5" />
                Administrator Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium text-slate-900">
                  {user.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium text-slate-900">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 border border-amber-200">
                    Administrator
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <p className="font-medium text-slate-900">
                    {user.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Package className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors">
                View All Orders
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors">
                Manage Users
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors">
                View Reports
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors">
                System Settings
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <TrendingUp className="w-5 h-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending Orders</span>
                <span className="font-medium text-yellow-600">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active Staff</span>
                <span className="font-medium text-green-600">15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Products</span>
                <span className="font-medium text-blue-600">456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Support Tickets</span>
                <span className="font-medium text-red-600">8</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Management Section */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* System Management */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Settings className="w-5 h-5" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Manage system-wide settings, configurations, and integrations from the admin panel.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                  <span className="text-sm text-slate-700">Database Status</span>
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                  <span className="text-sm text-slate-700">API Status</span>
                  <span className="text-xs text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                  <span className="text-sm text-slate-700">Last Backup</span>
                  <span className="text-xs text-slate-600 font-medium">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <TrendingUp className="w-5 h-5" />
                Analytics Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Key metrics and performance indicators for your platform.
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Order Completion Rate</span>
                    <span className="text-xs text-slate-700 font-medium">94%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: "94%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Customer Satisfaction</span>
                    <span className="text-xs text-slate-700 font-medium">87%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: "87%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Staff Performance</span>
                    <span className="text-xs text-slate-700 font-medium">91%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: "91%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
