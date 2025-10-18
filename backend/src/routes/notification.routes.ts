import { Router } from 'express';
import { query } from '../utils/database';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';
import { NotificationService } from '../services/notification.service';

const createNotificationRoutes = (notificationService: NotificationService) => {
  const router = Router();

// Get user notifications
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    let notificationsQuery = `
      SELECT id, type, title, message, data, is_read, priority, expires_at, created_at, read_at
      FROM notifications
      WHERE user_id = $1
    `;
    const queryParams: any[] = [userId];

    if (unreadOnly) {
      notificationsQuery += ' AND is_read = false';
    }

    notificationsQuery += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications 
      WHERE user_id = $1 ${unreadOnly ? 'AND is_read = false' : ''}
    `;

    const [notificationsResult, countResult] = await Promise.all([
      query(notificationsQuery, queryParams),
      query(countQuery, [userId])
    ]);

    const notifications = notificationsResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      isRead: row.is_read,
      priority: row.priority,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await notificationService.markAsRead(id, userId);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    await notificationService.markAllAsRead(userId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await notificationService.deleteNotification(id, userId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT notification_preferences FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = result.rows[0].notification_preferences || {
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

    res.json({ preferences });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences format' });
    }

    await query(
      'UPDATE users SET notification_preferences = $1 WHERE id = $2',
      [JSON.stringify(preferences), userId]
    );

    res.json({ success: true, message: 'Notification preferences updated' });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Create notification (for internal use)
const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data: any = {}
) => {
  try {
    await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      data
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

  return router;
};

export default createNotificationRoutes;
