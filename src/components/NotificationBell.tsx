import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Settings, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import socketService from '../services/socket';
import { useToast } from '../components/ui/Toast';
import Button from './ui/Button';
import Loading from './ui/Loading';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationPreferences {
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

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    const unsubscribeNotification = socketService.onNotification((notification) => {
      console.log('Real-time notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      success(notification.title, notification.message);
    });

    const unsubscribeUnreadCount = socketService.onUnreadCountUpdate((count) => {
      console.log('Unread count updated:', count);
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotification();
      unsubscribeUnreadCount();
    };
  }, [success]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(1, 10);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await api.getNotificationPreferences();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showError('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showError('Failed to delete notification');
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await api.updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
      success('Notification preferences updated');
      
      // Send preferences to socket server
      socketService.emit('update_notification_preferences', newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      showError('Failed to update notification preferences');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👥';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'challenge':
        return '🏆';
      case 'problem':
        return '💻';
      case 'achievement':
        return '🎉';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Notification preferences"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPreferences && preferences && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Notification Preferences
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">In-app notifications</span>
              <button
                onClick={() => updatePreferences({ ...preferences, inApp: !preferences.inApp })}
                className={`p-1 rounded ${preferences.inApp ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                {preferences.inApp ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(preferences.types).map(([type, enabled]) => (
                <button
                  key={type}
                  onClick={() => updatePreferences({
                    ...preferences,
                    types: { ...preferences.types, [type]: !enabled }
                  })}
                  className={`p-2 rounded text-left ${
                    enabled ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <Loading size="sm" text="Loading notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        {notification.priority === 'high' && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                            High Priority
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Delete"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Fetch initial unread count
    fetchUnreadCount();

    // Set up socket event handlers
    const unsubscribeNotification = socketService.onNotification((notification) => {
      console.log('New notification received:', notification);
      setUnreadCount(prev => prev + 1);
    });

    const unsubscribeUnreadCount = socketService.onUnreadCountUpdate((count) => {
      setUnreadCount(count);
    });

    const unsubscribeConnection = socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        fetchUnreadCount();
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNotification();
      unsubscribeUnreadCount();
      unsubscribeConnection();
      socketService.disconnect();
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors ${className}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" title="Disconnected" />
        )}
      </button>

      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
