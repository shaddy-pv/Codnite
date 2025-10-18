import { query } from '../utils/database';
import logger from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    follow: boolean;
    like: boolean;
    comment: boolean;
    challenge: boolean;
    problem: boolean;
    achievement: boolean;
    system: boolean;
  };
}

class NotificationService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Create a notification and send it via Socket.IO
  async createNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { userId, type, title, message, data, priority = 'medium', expiresAt } = notificationData;

      // Check user notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      if (!preferences.inApp || !preferences.types[type as keyof typeof preferences.types]) {
        logger.info('Notification skipped due to user preferences', { userId, type });
        return;
      }

      // Insert notification into database
      const result = await query(
        `INSERT INTO notifications (user_id, type, title, message, data, priority, expires_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
         RETURNING id, created_at`,
        [
          userId,
          type,
          title,
          message,
          JSON.stringify(data || {}),
          priority,
          expiresAt || null
        ]
      );

      const notification = result.rows[0];

      // Send real-time notification via Socket.IO
      this.sendRealtimeNotification(userId, {
        id: notification.id,
        type,
        title,
        message,
        data: data || {},
        priority,
        createdAt: notification.created_at,
        isRead: false
      });

      // Update unread count
      await this.updateUnreadCount(userId);

      logger.info('Notification created and sent', { 
        userId, 
        type, 
        notificationId: notification.id 
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  // Send notification to multiple users
  async createBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const promises = notifications.map(notification => 
        this.createNotification(notification)
      );
      await Promise.all(promises);
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
    }
  }

  // Send real-time notification via Socket.IO
  private sendRealtimeNotification(userId: string, notification: any): void {
    try {
      const userRoom = `user_${userId}`;
      this.io.to(userRoom).emit('notification', notification);
      logger.info('Real-time notification sent', { userId, room: userRoom });
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  // Update unread count for user
  private async updateUnreadCount(userId: string): Promise<void> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      const count = parseInt(result.rows[0].count);
      const userRoom = `user_${userId}`;
      this.io.to(userRoom).emit('unread_count_update', { count });
      
      logger.info('Unread count updated', { userId, count });
    } catch (error) {
      logger.error('Error updating unread count:', error);
    }
  }

  // Get user notification preferences
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const result = await query(
        'SELECT notification_preferences FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getDefaultPreferences();
      }

      const preferences = result.rows[0].notification_preferences;
      if (!preferences) {
        return this.getDefaultPreferences();
      }

      return JSON.parse(preferences);
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Get default notification preferences
  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      push: true,
      inApp: true,
      types: {
        follow: true,
        like: true,
        comment: true,
        challenge: true,
        problem: true,
        achievement: true,
        system: true
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      // Update unread count
      await this.updateUnreadCount(userId);

      logger.info('Notification marked as read', { notificationId, userId });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      // Update unread count
      await this.updateUnreadCount(userId);

      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      // Update unread count
      await this.updateUnreadCount(userId);

      logger.info('Notification deleted', { notificationId, userId });
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const result = await query(
        'DELETE FROM notifications WHERE expires_at < CURRENT_TIMESTAMP',
        []
      );

      if (result.rowCount && result.rowCount > 0) {
        logger.info('Cleaned up expired notifications', { count: result.rowCount });
      }
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
    }
  }

  // Notification type handlers
  async notifyNewFollower(followerId: string, followingId: string): Promise<void> {
    const follower = await this.getUserInfo(followerId);
    await this.createNotification({
      userId: followingId,
      type: 'follow',
      title: 'New Follower',
      message: `${follower.name} started following you`,
      data: { followerId, followerName: follower.name }
    });
  }

  async notifyPostLike(postId: string, likerId: string, postAuthorId: string): Promise<void> {
    const liker = await this.getUserInfo(likerId);
    await this.createNotification({
      userId: postAuthorId,
      type: 'like',
      title: 'Post Liked',
      message: `${liker.name} liked your post`,
      data: { postId, likerId, likerName: liker.name }
    });
  }

  async notifyNewComment(postId: string, commenterId: string, postAuthorId: string): Promise<void> {
    const commenter = await this.getUserInfo(commenterId);
    await this.createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: 'New Comment',
      message: `${commenter.name} commented on your post`,
      data: { postId, commenterId, commenterName: commenter.name }
    });
  }

  async notifyProblemSubmission(problemId: string, userId: string, status: string): Promise<void> {
    const problem = await this.getProblemInfo(problemId);
    const statusText = status === 'accepted' ? 'accepted' : 'failed';
    await this.createNotification({
      userId,
      type: 'problem',
      title: `Problem ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message: `Your submission for "${problem.title}" was ${statusText}`,
      data: { problemId, status, problemTitle: problem.title }
    });
  }

  async notifyChallengeUpdate(challengeId: string, userId: string, message: string): Promise<void> {
    const challenge = await this.getChallengeInfo(challengeId);
    await this.createNotification({
      userId,
      type: 'challenge',
      title: 'Challenge Update',
      message,
      data: { challengeId, challengeTitle: challenge.title }
    });
  }

  async notifyAchievement(userId: string, achievementName: string, description: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: 'New Achievement',
      message: `You earned the "${achievementName}" achievement!`,
      data: { achievementName, description },
      priority: 'high'
    });
  }

  async notifySystemAnnouncement(userIds: string[], title: string, message: string): Promise<void> {
    const notifications = userIds.map(userId => ({
      userId,
      type: 'system',
      title,
      message,
      priority: 'high' as const
    }));

    await this.createBulkNotifications(notifications);
  }

  // Helper methods
  private async getUserInfo(userId: string): Promise<{ name: string; username: string }> {
    const result = await query(
      'SELECT name, username FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || { name: 'Unknown User', username: 'unknown' };
  }

  private async getProblemInfo(problemId: string): Promise<{ title: string }> {
    const result = await query(
      'SELECT title FROM problems WHERE id = $1',
      [problemId]
    );
    return result.rows[0] || { title: 'Unknown Problem' };
  }

  private async getChallengeInfo(challengeId: string): Promise<{ title: string }> {
    const result = await query(
      'SELECT title FROM challenges WHERE id = $1',
      [challengeId]
    );
    return result.rows[0] || { title: 'Unknown Challenge' };
  }
}

// Export the class instead of singleton instance
export { NotificationService };
