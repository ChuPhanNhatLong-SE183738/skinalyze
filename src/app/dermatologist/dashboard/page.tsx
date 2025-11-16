"use client";

import { useDermatologist } from "@/contexts/DermatologistContext";
import { Loader2 } from "lucide-react";

export default function DermatologistDashboardPage() {
  const { profile, isLoading } = useDermatologist();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome back, Dr. {profile?.user?.fullName || ""}!
      </h1>
      <p className="mt-2 text-lg text-slate-600">
        Here is a quick overview of your practice.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Appointments Today</h3>
          <p className="mt-4 text-4xl font-bold text-blue-600">5</p>
          <p className="text-sm text-slate-500">3 completed, 2 pending</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Active Subscription Plans</h3>
          <p className="mt-4 text-4xl font-bold text-slate-800">4</p>
          <p className="text-sm text-slate-500">2 active, 2 hidden</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Open Slots (This Week)</h3>
          <p className="mt-4 text-4xl font-bold text-green-600">32</p>
          <p className="text-sm text-slate-500">48 total, 16 booked</p>
        </div>
      </div>
    </div>
  );
}
