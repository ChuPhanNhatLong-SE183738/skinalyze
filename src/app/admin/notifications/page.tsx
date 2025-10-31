"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BroadcastNotificationForm } from "@/components/notifications/BroadcastNotificationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Megaphone, Users, Info } from "lucide-react";
import { authService } from "@/services/authService";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { User as UserType } from "@/types/auth";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-green-600" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Broadcast Notifications
            </h1>
            <p className="text-slate-600 mt-1">
              Send notifications to all users in the system
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium text-slate-900">Broadcast</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Send notifications to all registered users simultaneously
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium text-slate-900">Real-time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Notifications are delivered instantly to all active users
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-medium text-slate-900">Flexible</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Customize type, priority, action URLs, and images
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Form */}
      <BroadcastNotificationForm />

      {/* Usage Examples */}
      <Card className="mt-8 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            Common scenarios for broadcasting notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                🔧 System Maintenance
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>Type:</strong> System | <strong>Priority:</strong> High
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                "System will be under maintenance from 2 AM to 4 AM. Please save your work."
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                🎉 Special Promotion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>Type:</strong> Promotion | <strong>Priority:</strong> Medium
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                "Get 20% off on all products this weekend! Use code WEEKEND20"
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ✨ New Product Launch
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>Type:</strong> Product | <strong>Priority:</strong> Medium
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                "New skincare line just launched! Check out our latest products."
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                📢 Important Announcement
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>Type:</strong> Anything | <strong>Priority:</strong> High
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                "New terms of service effective next month. Please review the changes."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
