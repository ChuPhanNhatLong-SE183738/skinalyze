import type {
  SendToUserNotificationRequest,
  BroadcastNotificationRequest,
  NotificationResponse,
} from "@/types/notification";

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  async sendToUser(
    request: SendToUserNotificationRequest
  ): Promise<NotificationResponse> {
    try {
      const response = await fetch("/api/notifications/send-to-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send notification");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to send notification");
    }
  }

  /**
   * Broadcast notification to all users
   */
  async broadcast(
    request: BroadcastNotificationRequest
  ): Promise<NotificationResponse> {
    try {
      const response = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to broadcast notification");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to broadcast notification");
    }
  }
}

export const notificationService = new NotificationService();
