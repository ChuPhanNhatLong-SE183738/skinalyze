import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from './entities/notification.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { DeviceTokensService } from '../users/device-tokens.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private firebaseService: FirebaseService,
    private deviceTokensService: DeviceTokensService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Send push notification via FCM
    await this.sendPushNotification(savedNotification);

    // Send realtime notification via WebSocket
    if (savedNotification.userId) {
      this.notificationsGateway.sendToUser(
        savedNotification.userId,
        savedNotification,
      );

      // Update unread count
      const unreadCount = await this.getUnreadCount(savedNotification.userId);
      this.notificationsGateway.updateUnreadCount(
        savedNotification.userId,
        unreadCount,
      );
    }

    return savedNotification;
  }

  async createBulk(
    createNotificationDtos: CreateNotificationDto[],
  ): Promise<Notification[]> {
    const notifications = this.notificationRepository.create(
      createNotificationDtos,
    );
    const savedNotifications =
      await this.notificationRepository.save(notifications);

    // Send push notifications and WebSocket for each
    for (const notification of savedNotifications) {
      await this.sendPushNotification(notification);

      // Send realtime via WebSocket
      if (notification.userId) {
        this.notificationsGateway.sendToUser(notification.userId, notification);
      }
    }

    // Update unread counts for affected users
    const uniqueUserIds = [
      ...new Set(
        savedNotifications.filter((n) => n.userId).map((n) => n.userId),
      ),
    ];

    for (const userId of uniqueUserIds) {
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.updateUnreadCount(userId, unreadCount);
    }

    return savedNotifications;
  }

  /**
   * Send push notification to user's devices via FCM
   */
  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      // Get all active FCM tokens for this user
      const fcmTokens =
        await this.deviceTokensService.getActiveFcmTokensByUserId(
          notification.userId,
        );

      if (fcmTokens.length === 0) {
        this.logger.log(`No active devices for user ${notification.userId}`);
        return;
      }

      // Prepare notification data
      const data: Record<string, string> = {
        notificationId: notification.notificationId,
        type: notification.type,
        ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
      };

      // Add custom data if present
      if (notification.data) {
        Object.keys(notification.data).forEach((key) => {
          data[key] = String(notification.data[key]);
        });
      }

      // Send to multiple devices
      const result = await this.firebaseService.sendToMultipleDevices(
        fcmTokens,
        notification.title,
        notification.message,
        data,
        notification.imageUrl,
      );

      this.logger.log(
        `Push notification sent to ${result.successCount}/${fcmTokens.length} devices`,
      );

      // Mark invalid tokens as inactive
      if (result.invalidTokens.length > 0) {
        await this.deviceTokensService.markTokensAsInactive(
          result.invalidTokens,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      // Don't throw error - notification is already saved in DB
    }
  }

  async findAllByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationIds: string[], userId?: string): Promise<void> {
    await this.notificationRepository.update(
      { notificationId: In(notificationIds) },
      { isRead: true, readAt: new Date() },
    );

    // Notify via WebSocket
    if (userId) {
      this.notificationsGateway.notifyMarkedAsRead(userId, notificationIds);

      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.updateUnreadCount(userId, unreadCount);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    // Update unread count via WebSocket
    this.notificationsGateway.updateUnreadCount(userId, 0);
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    await this.notificationRepository.remove(notification);
  }

  async deleteAllByUser(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  // Helper methods for common notifications
  async notifyOrderCreated(
    userId: string,
    orderId: string,
    amount: number,
  ): Promise<Notification> {
    return await this.create({
      userId,
      type: NotificationType.ORDER,
      title: 'Order Confirmed',
      message: `Your order #${orderId} has been confirmed. Total: ${amount.toLocaleString('vi-VN')} VND`,
      data: { orderId, amount },
      actionUrl: `/orders/${orderId}`,
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyAppointmentCreated(
    userId: string,
    appointmentId: string,
    startTime: Date,
  ): Promise<Notification> {
    return await this.create({
      userId,
      type: NotificationType.APPOINTMENT,
      title: 'Appointment Scheduled',
      message: `Your appointment has been scheduled for ${startTime.toLocaleString('vi-VN')}`,
      data: { appointmentId, startTime },
      actionUrl: `/appointments/${appointmentId}`,
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyTreatmentRoadmapCreated(
    userId: string,
    roadmapId: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      type: NotificationType.TREATMENT_ROADMAP,
      title: 'New Treatment Roadmap',
      message: 'Your dermatologist has created a new treatment roadmap for you',
      data: { roadmapId },
      actionUrl: `/treatment-roadmaps/${roadmapId}`,
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyLowStock(
    userIds: string[],
    productName: string,
    quantity: number,
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) => ({
      userId,
      type: NotificationType.PRODUCT,
      title: 'Low Stock Alert',
      message: `${productName} is running low (${quantity} units remaining)`,
      data: { productName, quantity },
      priority: NotificationPriority.MEDIUM,
    }));
    return await this.createBulk(notifications);
  }

  /**
   * Send notification to a specific user (Admin feature)
   */
  async sendToUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    actionUrl?: string,
    imageUrl?: string,
    priority?: NotificationPriority,
  ): Promise<Notification> {
    return await this.create({
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      imageUrl,
      priority: priority || NotificationPriority.MEDIUM,
    });
  }

  /**
   * Broadcast notification to all users (Admin feature)
   */
  async broadcastToAllUsers(
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    actionUrl?: string,
    imageUrl?: string,
    priority?: NotificationPriority,
  ): Promise<{ sent: number; notifications: Notification[] }> {
    // Get all active users
    const users = await this.notificationRepository.manager
      .getRepository('User')
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .getMany();

    if (users.length === 0) {
      return { sent: 0, notifications: [] };
    }

    // Create notifications for all users
    const notificationDtos = users.map((user: any) => ({
      userId: user.userId,
      type,
      title,
      message,
      data,
      actionUrl,
      imageUrl,
      priority: priority || NotificationPriority.MEDIUM,
    }));

    const notifications = await this.createBulk(notificationDtos);

    return {
      sent: notifications.length,
      notifications,
    };
  }
}
