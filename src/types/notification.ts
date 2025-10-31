export enum NotificationType {
  ORDER = "order",
  APPOINTMENT = "appointment",
  TREATMENT_ROUTINE = "treatment_Routine",
  PRODUCT = "product",
  SYSTEM = "system",
  PROMOTION = "promotion",
  ANYTHING = "anything",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface SendToUserNotificationRequest {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  priority?: NotificationPriority | string;
}

export interface BroadcastNotificationRequest {
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  priority?: NotificationPriority | string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: any;
}
