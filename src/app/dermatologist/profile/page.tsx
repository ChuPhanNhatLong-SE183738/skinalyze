"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/authService";
import { dermatologistService } from "@/services/dermatologistService";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Stethoscope,
  Award,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { DermatologistProfile, UpdatePersonalInfoRequest, UpdateProfessionalInfoRequest } from "@/types/dermatologist";

export default function DermatologistProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<DermatologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProfessional, setSavingProfessional] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdatePersonalInfoRequest>({});
  const [professionalData, setProfessionalData] = useState<UpdateProfessionalInfoRequest>({
    yearsOfExp: 0,
    defaultSlotPrice: 0,
  });

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { authenticated, user: userData } = await authService.checkAuth();

        if (!authenticated || !userData) {
          router.push("/login");
          return;
        }

        if (userData.role !== "dermatologist") {
          router.push("/login");
          return;
        }

        // Fetch dermatologist profile from API
        const profileData = await dermatologistService.getMyProfile();
        setProfile(profileData);
        setFormData({
          fullName: profileData.user.fullName,
          phone: profileData.user.phone || "",
          dob: profileData.user.dob || "",
          gender: profileData.user.gender,
        });
        setProfessionalData({
          yearsOfExp: profileData.yearsOfExp,
          defaultSlotPrice: parseInt(profileData.defaultSlotPrice),
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to load profile. Please try again.",
        });
        router.push("/dermatologist/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [router, toast]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.user.fullName,
        phone: profile.user.phone || "",
        dob: profile.user.dob || "",
        gender: profile.user.gender,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setEditing(false);
  };

  const handleCancelProfessional = () => {
    if (profile) {
      setProfessionalData({
        yearsOfExp: profile.yearsOfExp,
        defaultSlotPrice: parseInt(profile.defaultSlotPrice),
      });
    }
    setEditingProfessional(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData: UpdatePersonalInfoRequest = {
        ...formData,
        photo: selectedFile || undefined,
      };
      
      const updatedProfile = await dermatologistService.updateProfile(updateData);
      setProfile(updatedProfile);
      setSelectedFile(null);
      setPreviewUrl(null);
      setEditing(false);

      toast({
        variant: "success",
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "error",
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessional = async () => {
    try {
      setSavingProfessional(true);
      
      const updatedProfile = await dermatologistService.updateProfessionalInfo(professionalData);
      setProfile(updatedProfile);
      setEditingProfessional(false);

      toast({
        variant: "success",
        title: "Professional Info Updated", 
        description: "Your professional information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating professional info:", error);
      toast({
        variant: "error",
        title: "Update Failed",
        description: "Failed to update professional information. Please try again.",
      });
    } finally {
      setSavingProfessional(false);
    }
  };

  const handleInputChange = (field: keyof UpdatePersonalInfoRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfessionalInputChange = (field: keyof UpdateProfessionalInfoRequest, value: any) => {
    setProfessionalData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "error",
        title: "Invalid File",
        description: "Please select an image file.",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "error",
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      // Store the file object
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      toast({
        variant: "success",
        title: "Image Selected",
        description: "Image has been selected. Click Save to update your profile.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "error",
        title: "Processing Failed",
        description: "Failed to process image. Please try again.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

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

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getGenderDisplay = (gender: boolean | null) => {
    if (gender === true) return "Male";
    if (gender === false) return "Female";
    return "Not specified";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md bg-white border-slate-200">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Profile Not Found
            </h3>
            <p className="text-slate-600 mb-4">
              Unable to load your profile information.
            </p>
            <Button onClick={() => router.push("/dermatologist/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600 mt-1">
              Manage your professional information and settings
            </p>
          </div>
          {!editing ? (
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-slate-300"
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Profile Photo */}
                  <div className="relative mx-auto w-24 h-24 mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      {(previewUrl || profile.user.photoUrl) ? (
                        <img
                          src={previewUrl || profile.user.photoUrl || ""}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    {editing && (
                      <>
                        <button 
                          onClick={handleImageClick}
                          disabled={uploadingImage}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          title="Upload profile picture"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

                  {/* Basic Info */}
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {profile.user.fullName}
                  </h2>
                  <p className="text-blue-600 font-medium mb-2">
                    Dermatologist
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge
                      className={`${
                        profile.user.isActive
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {profile.user.isActive ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {profile.user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      className={`${
                        profile.user.isVerified
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {profile.user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {profile.yearsOfExp} years
                      </div>
                      <div className="text-xs text-slate-600">Experience</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Stats */}
            <Card className="bg-white border-slate-200 mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Professional Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Experience</span>
                  </div>
                  <span className="font-medium">{profile.yearsOfExp} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Default Fee</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(profile.defaultSlotPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Joined</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(profile.user.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    {editing ? (
                      <Input
                        id="fullName"
                        value={formData.fullName || ""}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="mt-1 bg-white border-slate-300"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900">
                        {profile.user.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-600" />
                      {profile.user.email}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-1 bg-white border-slate-300"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-600" />
                        {profile.user.phone || "Not provided"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    {editing ? (
                      <Input
                        id="dob"
                        type="date"
                        value={formatDateForInput(formData.dob || null)}
                        onChange={(e) => handleInputChange("dob", e.target.value)}
                        className="mt-1 bg-white border-slate-300"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        {profile.user.dob ? formatDate(profile.user.dob) : "Not provided"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    {editing ? (
                      <select
                        id="gender"
                        value={formData.gender === true ? "male" : formData.gender === false ? "female" : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const genderValue = value === "male" ? true : value === "female" ? false : null;
                          handleInputChange("gender", genderValue);
                        }}
                        className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    ) : (
                      <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900">
                        {getGenderDisplay(profile.user.gender)}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      {formatDate(profile.user.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    Professional Settings
                  </CardTitle>
                  {!editingProfessional ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfessional(true)}
                      className="border-slate-300"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelProfessional}
                        className="border-slate-300"
                        disabled={savingProfessional}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfessional}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={savingProfessional}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingProfessional ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsOfExp">Years of Experience</Label>
                    {editingProfessional ? (
                      <Input
                        id="yearsOfExp"
                        type="number"
                        min="0"
                        value={professionalData.yearsOfExp || ""}
                        onChange={(e) => handleProfessionalInputChange("yearsOfExp", parseInt(e.target.value) || 0)}
                        className="mt-1 bg-white border-slate-300"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900">
                        {profile.yearsOfExp} years
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="defaultSlotPrice">Default Consultation Fee (VND)</Label>
                    {editingProfessional ? (
                      <Input
                        id="defaultSlotPrice"
                        type="number"
                        min="0"
                        step="1000"
                        value={professionalData.defaultSlotPrice || ""}
                        onChange={(e) => handleProfessionalInputChange("defaultSlotPrice", parseInt(e.target.value) || 0)}
                        className="mt-1 bg-white border-slate-300"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900">
                        {formatCurrency(profile.defaultSlotPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}