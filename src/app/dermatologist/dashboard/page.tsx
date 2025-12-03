"use client";

import { useDermatologist } from "@/contexts/DermatologistContext";
import { Loader2, User, Clock, DollarSign, Calendar, Award, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DermatologistDashboardPage() {
  const { profile, isLoading } = useDermatologist();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Profile Not Found</h2>
          <p className="text-slate-600 mt-2">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGenderDisplay = (gender: boolean | null) => {
    if (gender === true) return "Male";
    if (gender === false) return "Female";
    return "Not specified";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              {profile.user.photoUrl ? (
                <img
                  src={profile.user.photoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, Dr. {profile.user.fullName}!
              </h1>
              <p className="text-lg text-slate-600 mt-1">
                Here is your professional dashboard overview.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge
                  className={`${
                    profile.user.isActive
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {profile.user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  className={`${
                    profile.user.isVerified
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {profile.user.isVerified ? "Verified" : "Pending Verification"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Years of Experience
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{profile.yearsOfExp} years</div>
              <p className="text-xs text-slate-600">Professional experience</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Consultation Fee
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(profile.defaultSlotPrice)}
              </div>
              <p className="text-xs text-slate-600">Default appointment rate</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Member Since
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Date(profile.user.createdAt).getFullYear()}
              </div>
              <p className="text-xs text-slate-600">
                {formatDate(profile.user.createdAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Dermatologist ID
              </CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {profile.dermatologistId.slice(-6)}
              </div>
              <p className="text-xs text-slate-600">Professional identifier</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{profile.user.email}</p>
                  <p className="text-xs text-slate-600">Email address</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {profile.user.phone || "Not provided"}
                  </p>
                  <p className="text-xs text-slate-600">Phone number</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {getGenderDisplay(profile.user.gender)}
                  </p>
                  <p className="text-xs text-slate-600">Gender</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <h3 className="font-medium text-slate-900">View Appointments</h3>
                <p className="text-sm text-slate-600 mt-1">Check your upcoming appointments</p>
              </button>
              <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <h3 className="font-medium text-slate-900">Update Profile</h3>
                <p className="text-sm text-slate-600 mt-1">Modify your professional information</p>
              </button>
              <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <h3 className="font-medium text-slate-900">Manage Schedule</h3>
                <p className="text-sm text-slate-600 mt-1">Set your availability and time slots</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
