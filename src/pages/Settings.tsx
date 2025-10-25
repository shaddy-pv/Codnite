import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Shield, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { api, authAPI } from '../services/api';

interface UserSettings {
  name: string;
  username: string;
  email: string;
  bio: string;
  githubUsername: string;
  linkedinUrl: string;
  collegeId: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  postLikes: boolean;
  newFollowers: boolean;
  comments: boolean;
  mentions: boolean;
}

const Settings: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { success, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState<UserSettings>({
    name: '',
    username: '',
    email: '',
    bio: '',
    githubUsername: '',
    linkedinUrl: '',
    collegeId: ''
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    postLikes: true,
    newFollowers: true,
    comments: true,
    mentions: true
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const userData = await api.getMe();
      
      setProfileSettings({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
        githubUsername: userData.githubUsername || '',
        linkedinUrl: userData.linkedinUrl || '',
        collegeId: userData.collegeId || ''
      });
    } catch (err: any) {
      showError('Failed to load settings', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setIsLoading(true);
      await api.updateProfile({
        name: profileSettings.name,
        bio: profileSettings.bio,
        githubUsername: profileSettings.githubUsername,
        linkedinUrl: profileSettings.linkedinUrl
      });
      
      success('Profile updated successfully!');
    } catch (err: any) {
      showError('Failed to update profile', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showError('Failed to change password', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      setIsLoading(true);
      // This would need to be implemented in the backend
      // await api.updateNotificationSettings(notificationSettings);
      success('Notification preferences updated!');
    } catch (err: any) {
      showError('Failed to update notification settings', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) {
      return;
    }

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your posts, comments, and data.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await api.deleteAccount(password);
      success('Account deleted successfully');
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err: any) {
      showError('Failed to delete account', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Lock }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Settings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card type="container" className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card type="container" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Profile Information
                </h2>
                <Button
                  onClick={handleProfileSave}
                  disabled={isLoading}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="Username"
                    value={profileSettings.username}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                </div>

                <Input
                  label="Email"
                  value={profileSettings.email}
                  disabled
                  placeholder="Your email address"
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Email cannot be changed"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="GitHub Username"
                    value={profileSettings.githubUsername}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, githubUsername: e.target.value }))}
                    placeholder="Your GitHub username"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="LinkedIn URL"
                    value={profileSettings.linkedinUrl}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourname"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card type="container" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Notification Preferences
                </h2>
                <Button
                  onClick={handleNotificationSave}
                  disabled={isLoading}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Preferences
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    General Notifications
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">Email Notifications</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">Push Notifications</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Receive browser notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Activity Notifications
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'postLikes', label: 'Post Likes', description: 'When someone likes your posts' },
                      { key: 'newFollowers', label: 'New Followers', description: 'When someone follows you' },
                      { key: 'comments', label: 'Comments', description: 'When someone comments on your posts' },
                      { key: 'mentions', label: 'Mentions', description: 'When someone mentions you' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.label}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key as keyof NotificationSettings]}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card type="container" className="p-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                Privacy & Security
              </h2>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Theme Preferences
                  </h3>
                  
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Dark Mode</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Switch between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        isDarkMode ? 'bg-primary-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Data & Privacy
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Profile Visibility</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        Control who can see your profile and activity
                      </p>
                      <Button variant="outline" size="sm">
                        Manage Visibility
                      </Button>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Data Export</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        Download a copy of your data
                      </p>
                      <Button variant="outline" size="sm">
                        Export Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Password Change */}
              <Card type="container" className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                  Change Password
                </h2>

                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      leftIcon={<Lock className="w-4 h-4" />}
                    />
                    
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      leftIcon={<Lock className="w-4 h-4" />}
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    leftIcon={<Lock className="w-4 h-4" />}
                  >
                    Change Password
                  </Button>
                </div>
              </Card>

              {/* Account Deletion */}
              <Card type="container" className="p-6 border-error-200 dark:border-error-800">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-error-600 dark:text-error-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-error-900 dark:text-error-100 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-error-700 dark:text-error-300 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      variant="danger"
                      onClick={handleAccountDeletion}
                      disabled={isLoading}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
