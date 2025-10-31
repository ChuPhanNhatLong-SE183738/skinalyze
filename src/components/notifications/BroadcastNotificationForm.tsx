"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notificationService } from "@/services/notificationService";
import { NotificationType, NotificationPriority } from "@/types/notification";
import { Bell, Send, CheckCircle, AlertCircle } from "lucide-react";

export function BroadcastNotificationForm() {
  const [formData, setFormData] = useState({
    type: NotificationType.SYSTEM,
    title: "",
    message: "",
    actionUrl: "",
    imageUrl: "",
    priority: NotificationPriority.MEDIUM,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Title and message are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      await notificationService.broadcast({
        type: formData.type,
        title: formData.title,
        message: formData.message,
        actionUrl: formData.actionUrl || undefined,
        imageUrl: formData.imageUrl || undefined,
        priority: formData.priority,
      });

      setSuccess("Notification broadcast successfully to all users!");
      
      // Reset form
      setFormData({
        type: NotificationType.SYSTEM,
        title: "",
        message: "",
        actionUrl: "",
        imageUrl: "",
        priority: NotificationPriority.MEDIUM,
      });
    } catch (err: any) {
      setError(err.message || "Failed to broadcast notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle>Broadcast Notification</CardTitle>
        </div>
        <CardDescription>
          Send a notification to all users in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Alert */}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type *</Label>
            <select
              id="type"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as NotificationType })
              }
              required
            >
              <option value={NotificationType.SYSTEM}>System</option>
              <option value={NotificationType.PROMOTION}>Promotion</option>
              <option value={NotificationType.PRODUCT}>Product</option>
              <option value={NotificationType.ORDER}>Order</option>
              <option value={NotificationType.APPOINTMENT}>Appointment</option>
              <option value={NotificationType.ANYTHING}>Anything</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <select
              id="priority"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as NotificationPriority })
              }
              required
            >
              <option value={NotificationPriority.LOW}>Low</option>
              <option value={NotificationPriority.MEDIUM}>Medium</option>
              <option value={NotificationPriority.HIGH}>High</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., System Maintenance Notice"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter the notification message..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Action URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
            <Input
              id="actionUrl"
              placeholder="e.g., /promotions/sale"
              value={formData.actionUrl}
              onChange={(e) =>
                setFormData({ ...formData, actionUrl: e.target.value })
              }
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              Where users will be redirected when they tap the notification
            </p>
          </div>

          {/* Image URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              placeholder="e.g., https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              Optional image to display in the notification
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Broadcasting..." : "Broadcast Notification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
