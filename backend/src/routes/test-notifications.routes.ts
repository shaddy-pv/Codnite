import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';
import logger from '../utils/logger';

const createTestNotificationRoutes = (notificationService: NotificationService) => {
  const router = Router();

// Test notification endpoint (for development/testing)
router.post('/test', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { type, title, message, data } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, title, message' 
      });
    }

    await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      data: data || {},
      priority: 'medium'
    });

    res.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Test specific notification types
router.post('/test/follow', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    await notificationService.notifyNewFollower(userId, targetUserId);

    res.json({ 
      success: true, 
      message: 'Follow notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending follow notification:', error);
    res.status(500).json({ error: 'Failed to send follow notification' });
  }
});

router.post('/test/like', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { postId, postAuthorId } = req.body;

    if (!postId || !postAuthorId) {
      return res.status(400).json({ error: 'postId and postAuthorId are required' });
    }

    await notificationService.notifyPostLike(postId, userId, postAuthorId);

    res.json({ 
      success: true, 
      message: 'Like notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending like notification:', error);
    res.status(500).json({ error: 'Failed to send like notification' });
  }
});

router.post('/test/comment', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { postId, postAuthorId } = req.body;

    if (!postId || !postAuthorId) {
      return res.status(400).json({ error: 'postId and postAuthorId are required' });
    }

    await notificationService.notifyNewComment(postId, userId, postAuthorId);

    res.json({ 
      success: true, 
      message: 'Comment notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending comment notification:', error);
    res.status(500).json({ error: 'Failed to send comment notification' });
  }
});

router.post('/test/problem', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { problemId, status } = req.body;

    if (!problemId || !status) {
      return res.status(400).json({ error: 'problemId and status are required' });
    }

    await notificationService.notifyProblemSubmission(problemId, userId, status);

    res.json({ 
      success: true, 
      message: 'Problem submission notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending problem notification:', error);
    res.status(500).json({ error: 'Failed to send problem notification' });
  }
});

router.post('/test/achievement', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { achievementName, description } = req.body;

    if (!achievementName) {
      return res.status(400).json({ error: 'achievementName is required' });
    }

    await notificationService.notifyAchievement(
      userId, 
      achievementName, 
      description || 'Congratulations on your achievement!'
    );

    res.json({ 
      success: true, 
      message: 'Achievement notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending achievement notification:', error);
    res.status(500).json({ error: 'Failed to send achievement notification' });
  }
});

router.post('/test/system', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, message, userIds } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const targetUserIds = userIds || [userId]; // Default to current user if no userIds provided

    await notificationService.notifySystemAnnouncement(targetUserIds, title, message);

    res.json({ 
      success: true, 
      message: 'System announcement notification sent successfully' 
    });
  } catch (error) {
    logger.error('Error sending system notification:', error);
    res.status(500).json({ error: 'Failed to send system notification' });
  }
});

// Bulk test notifications
router.post('/test/bulk', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { count = 5 } = req.body;

    const notifications = [];
    for (let i = 0; i < count; i++) {
      notifications.push({
        userId,
        type: ['follow', 'like', 'comment', 'achievement', 'system'][i % 5],
        title: `Test Notification ${i + 1}`,
        message: `This is test notification number ${i + 1}`,
        data: { testId: i + 1 },
        priority: 'medium' as const
      });
    }

    await notificationService.createBulkNotifications(notifications);

    res.json({ 
      success: true, 
      message: `${count} test notifications sent successfully` 
    });
  } catch (error) {
    logger.error('Error sending bulk test notifications:', error);
    res.status(500).json({ error: 'Failed to send bulk test notifications' });
  }
});

  return router;
};

export default createTestNotificationRoutes;
