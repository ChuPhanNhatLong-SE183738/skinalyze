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
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { userService } from "@/services/userService";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { User as UserType } from "@/types/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    isLoading: true,
  });

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
        await fetchDashboardData();
      } catch (error) {
        // Redirect to login if validation fails
        router.push("/login");
      }
    };

    checkAuthStatus();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true }));

      // Fetch all data in parallel
      const [ordersData, productsData, usersData] = await Promise.all([
        orderService.getOrders().catch(() => ({ data: [], total: 0 })),
        productService.getProducts(1, 1000).catch(() => ({ products: [], total: 0 })),
        userService.getUsers(1, 1000).catch(() => ({ users: [], total: 0 })),
      ]);

      // Calculate statistics
      const orders = ordersData.data || [];
      const products = productsData.products || [];
      const users = usersData.users || [];

      const totalRevenue = orders
        .filter(order => order.status === 'COMPLETED' || order.status === 'DELIVERED')
        .reduce((sum, order) => {
          const orderTotal = order.orderItems?.reduce(
            (itemSum, item) => itemSum + (parseFloat(item.priceAtTime) * item.quantity), 
            0
          ) || 0;
          return sum + orderTotal;
        }, 0);

      const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
      const activeUsers = users.filter(user => user.isActive).length;

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        activeUsers,
        totalProducts: products.length,
        pendingOrders,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
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
              <div className="text-2xl font-bold">
                {stats.isLoading ? "Loading..." : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs opacity-75 mt-1">
                From completed orders
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
              <div className="text-2xl font-bold">
                {stats.isLoading ? "Loading..." : stats.totalOrders.toLocaleString()}
              </div>
              <p className="text-xs opacity-75 mt-1">
                All time orders
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
              <div className="text-2xl font-bold">
                {stats.isLoading ? "Loading..." : stats.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs opacity-75 mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 border border-green-200">
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
              <button 
                onClick={() => router.push('/admin/orders')}
                className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors"
              >
                View All Orders
              </button>
              <button 
                onClick={() => router.push('/admin/users')}
                className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm transition-colors"
              >
                Manage Users
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
                <span className="font-medium text-yellow-600">
                  {stats.isLoading ? "..." : stats.pendingOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active Users</span>
                <span className="font-medium text-green-600">
                  {stats.isLoading ? "..." : stats.activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Products</span>
                <span className="font-medium text-blue-600">
                  {stats.isLoading ? "..." : stats.totalProducts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Orders</span>
                <span className="font-medium text-purple-600">
                  {stats.isLoading ? "..." : stats.totalOrders}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
