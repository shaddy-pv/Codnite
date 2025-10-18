#!/usr/bin/env node

/**
 * Notification System Test Script
 * 
 * This script tests the complete real-time notification system including:
 * - Socket.IO connection
 * - Notification creation and delivery
 * - Real-time updates
 * - Notification preferences
 * - All notification types
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Test configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  username: 'testuser',
  name: 'Test User'
};

let authToken = '';
let userId = '';
let socket: any = null;

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// API functions
const api = {
  async register() {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
      log('✅ User registered successfully', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        log('ℹ️ User already exists, proceeding with login');
        return null;
      }
      throw error;
    }
  },

  async login() {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    log('✅ User logged in successfully');
    authToken = response.data.token;
    userId = response.data.user.id;
    return response.data;
  },

  async getNotifications() {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  },

  async getUnreadCount() {
    const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  },

  async getPreferences() {
    const response = await axios.get(`${API_BASE_URL}/notifications/preferences`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  },

  async updatePreferences(preferences: any) {
    const response = await axios.put(`${API_BASE_URL}/notifications/preferences`, {
      preferences
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  },

  async sendTestNotification(type: string, title: string, message: string, data?: any) {
    const response = await axios.post(`${API_BASE_URL}/test-notifications/test`, {
      type,
      title,
      message,
      data
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  },

  async sendBulkNotifications(count: number) {
    const response = await axios.post(`${API_BASE_URL}/test-notifications/test/bulk`, {
      count
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  }
};

// Socket.IO functions
const setupSocket = () => {
  return new Promise((resolve, reject) => {
    socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      log('✅ Socket.IO connected', { socketId: socket.id });
      resolve(socket);
    });

    socket.on('connect_error', (error: any) => {
      log('❌ Socket.IO connection error', error);
      reject(error);
    });

    socket.on('notification', (notification: any) => {
      log('🔔 Real-time notification received', notification);
    });

    socket.on('unread_count_update', (data: any) => {
      log('📊 Unread count updated', data);
    });

    socket.on('auth_error', (error: any) => {
      log('❌ Socket authentication error', error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error('Socket connection timeout'));
      }
    }, 10000);
  });
};

// Test functions
const testAuthentication = async () => {
  log('🧪 Testing authentication...');
  
  try {
    await api.register();
    await api.login();
    log('✅ Authentication test passed');
    return true;
  } catch (error) {
    log('❌ Authentication test failed', error);
    return false;
  }
};

const testSocketConnection = async () => {
  log('🧪 Testing Socket.IO connection...');
  
  try {
    await setupSocket();
    log('✅ Socket.IO connection test passed');
    return true;
  } catch (error) {
    log('❌ Socket.IO connection test failed', error);
    return false;
  }
};

const testNotificationAPI = async () => {
  log('🧪 Testing notification API...');
  
  try {
    // Test getting notifications
    const notifications = await api.getNotifications();
    log('✅ Get notifications API test passed', { count: notifications.notifications.length });

    // Test getting unread count
    const unreadCount = await api.getUnreadCount();
    log('✅ Get unread count API test passed', unreadCount);

    // Test getting preferences
    const preferences = await api.getPreferences();
    log('✅ Get preferences API test passed', preferences);

    return true;
  } catch (error) {
    log('❌ Notification API test failed', error);
    return false;
  }
};

const testNotificationTypes = async () => {
  log('🧪 Testing different notification types...');
  
  const notificationTypes = [
    { type: 'follow', title: 'New Follower', message: 'Someone started following you' },
    { type: 'like', title: 'Post Liked', message: 'Someone liked your post' },
    { type: 'comment', title: 'New Comment', message: 'Someone commented on your post' },
    { type: 'problem', title: 'Problem Accepted', message: 'Your problem submission was accepted' },
    { type: 'achievement', title: 'New Achievement', message: 'You earned a new achievement!' },
    { type: 'system', title: 'System Announcement', message: 'Important system update' }
  ];

  try {
    for (const notif of notificationTypes) {
      await api.sendTestNotification(notif.type, notif.title, notif.message);
      log(`✅ ${notif.type} notification sent`);
      await delay(1000); // Wait 1 second between notifications
    }
    
    log('✅ All notification types test passed');
    return true;
  } catch (error) {
    log('❌ Notification types test failed', error);
    return false;
  }
};

const testRealTimeDelivery = async () => {
  log('🧪 Testing real-time notification delivery...');
  
  try {
    // Send a notification and verify it's received via Socket.IO
    const notificationPromise = new Promise((resolve) => {
      socket.once('notification', (notification: any) => {
        log('🔔 Real-time notification received via Socket.IO', notification);
        resolve(notification);
      });
    });

    // Send test notification
    await api.sendTestNotification('system', 'Real-time Test', 'Testing real-time delivery');
    
    // Wait for Socket.IO notification
    await Promise.race([
      notificationPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);

    log('✅ Real-time delivery test passed');
    return true;
  } catch (error) {
    log('❌ Real-time delivery test failed', error);
    return false;
  }
};

const testNotificationPreferences = async () => {
  log('🧪 Testing notification preferences...');
  
  try {
    // Get current preferences
    const currentPrefs = await api.getPreferences();
    log('Current preferences', currentPrefs);

    // Update preferences
    const newPrefs = {
      ...currentPrefs.preferences,
      inApp: false,
      types: {
        ...currentPrefs.preferences.types,
        follow: false,
        like: false
      }
    };

    await api.updatePreferences(newPrefs);
    log('✅ Preferences updated');

    // Verify preferences were updated
    const updatedPrefs = await api.getPreferences();
    if (updatedPrefs.preferences.inApp === false && 
        updatedPrefs.preferences.types.follow === false) {
      log('✅ Notification preferences test passed');
      return true;
    } else {
      throw new Error('Preferences not updated correctly');
    }
  } catch (error) {
    log('❌ Notification preferences test failed', error);
    return false;
  }
};

const testBulkNotifications = async () => {
  log('🧪 Testing bulk notifications...');
  
  try {
    const count = 5;
    await api.sendBulkNotifications(count);
    log(`✅ ${count} bulk notifications sent`);
    
    // Wait a bit for all notifications to be processed
    await delay(2000);
    
    const unreadCount = await api.getUnreadCount();
    log('Unread count after bulk notifications', unreadCount);
    
    log('✅ Bulk notifications test passed');
    return true;
  } catch (error) {
    log('❌ Bulk notifications test failed', error);
    return false;
  }
};

const cleanup = async () => {
  log('🧹 Cleaning up...');
  
  if (socket) {
    socket.disconnect();
    log('✅ Socket disconnected');
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting notification system tests...');
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Socket.IO Connection', fn: testSocketConnection },
    { name: 'Notification API', fn: testNotificationAPI },
    { name: 'Notification Types', fn: testNotificationTypes },
    { name: 'Real-time Delivery', fn: testRealTimeDelivery },
    { name: 'Notification Preferences', fn: testNotificationPreferences },
    { name: 'Bulk Notifications', fn: testBulkNotifications }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ Test "${test.name}" failed with error:`, error);
      failed++;
    }
    
    await delay(1000); // Wait between tests
  }

  log(`\n📊 Test Results:`);
  log(`✅ Passed: ${passed}`);
  log(`❌ Failed: ${failed}`);
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    log('🎉 All tests passed! Notification system is working correctly.');
  } else {
    log('⚠️ Some tests failed. Please check the logs above.');
  }

  await cleanup();
  process.exit(failed === 0 ? 0 : 1);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  log('❌ Unhandled rejection:', error);
  cleanup().then(() => process.exit(1));
});

process.on('SIGINT', async () => {
  log('🛑 Test interrupted by user');
  await cleanup();
  process.exit(0);
});

// Run tests
runTests().catch(async (error) => {
  log('❌ Test runner failed:', error);
  await cleanup();
  process.exit(1);
});
