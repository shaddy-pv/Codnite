import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Trophy, 
  Code, 
  BarChart3, 
  Settings, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalChallenges: number;
  totalProblems: number;
  activeUsers: number;
  newUsersToday: number;
  postsToday: number;
  challengesCompleted: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'post_created' | 'challenge_completed' | 'problem_solved';
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  description: string;
  createdAt: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'analytics' | 'settings'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentActivity()
      ]);
      setStats(statsRes);
      setRecentActivity(activityRes.activities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: number, icon: React.ReactNode, color: string, change?: number) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value.toLocaleString()}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(change)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderActivityItem = (activity: RecentActivity) => (
    <div key={activity.id} className="flex items-start space-x-3 p-4 hover:bg-slate-800/50 rounded-lg transition-colors">
      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
        {activity.type === 'user_registered' && <Users className="w-4 h-4 text-primary-400" />}
        {activity.type === 'post_created' && <FileText className="w-4 h-4 text-green-400" />}
        {activity.type === 'challenge_completed' && <Trophy className="w-4 h-4 text-yellow-400" />}
        {activity.type === 'problem_solved' && <Code className="w-4 h-4 text-secondary-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">{activity.description}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-slate-400 text-xs">by {activity.user.name}</span>
          <span className="text-slate-500 text-xs">•</span>
          <span className="text-slate-500 text-xs">{formatDistanceToNow(new Date(activity.createdAt))} ago</span>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && (
          <>
            {renderStatCard('Total Users', stats.totalUsers, <Users className="w-6 h-6 text-white" />, 'bg-primary-600', 12)}
            {renderStatCard('Total Posts', stats.totalPosts, <FileText className="w-6 h-6 text-white" />, 'bg-green-600', 8)}
            {renderStatCard('Challenges', stats.totalChallenges, <Trophy className="w-6 h-6 text-white" />, 'bg-yellow-600', 15)}
            {renderStatCard('Problems', stats.totalProblems, <Code className="w-6 h-6 text-white" />, 'bg-secondary-600', 5)}
          </>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats && (
          <>
            {renderStatCard('Active Users', stats.activeUsers, <Activity className="w-6 h-6 text-white" />, 'bg-emerald-600')}
            {renderStatCard('New Users Today', stats.newUsersToday, <TrendingUp className="w-6 h-6 text-white" />, 'bg-cyan-600')}
            {renderStatCard('Posts Today', stats.postsToday, <FileText className="w-6 h-6 text-white" />, 'bg-orange-600')}
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Recent Activity</span>
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No recent activity</p>
            </div>
          ) : (
            recentActivity.map(renderActivityItem)
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">User Management</h3>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search users..."
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Points</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Joined</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* This would be populated with actual user data */}
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-white">Loading...</td>
                <td className="py-3 px-4 text-slate-400">Loading...</td>
                <td className="py-3 px-4 text-slate-400">Loading...</td>
                <td className="py-3 px-4 text-slate-400">Loading...</td>
                <td className="py-3 px-4 text-slate-400">Loading...</td>
                <td className="py-3 px-4 text-slate-400">Loading...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Management */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Posts Management</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Total Posts</p>
                <p className="text-slate-400 text-sm">{stats?.totalPosts || 0} posts</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                View All
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Posts Today</p>
                <p className="text-slate-400 text-sm">{stats?.postsToday || 0} posts</p>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                View Today
              </button>
            </div>
          </div>
        </div>

        {/* Challenges Management */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Challenges Management</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Total Challenges</p>
                <p className="text-slate-400 text-sm">{stats?.totalChallenges || 0} challenges</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                View All
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Completed</p>
                <p className="text-slate-400 text-sm">{stats?.challengesCompleted || 0} completed</p>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                View Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Analytics Dashboard</span>
        </h3>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Analytics Coming Soon</h3>
          <p className="text-slate-400">Detailed analytics and charts will be available here</p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>System Settings</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Maintenance Mode</p>
              <p className="text-slate-400 text-sm">Enable maintenance mode to restrict access</p>
            </div>
            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
              Disabled
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">User Registration</p>
              <p className="text-slate-400 text-sm">Allow new user registrations</p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Enabled
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Content Moderation</p>
              <p className="text-slate-400 text-sm">Automatically moderate new content</p>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Enabled
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                  <p className="text-slate-400">Manage your platform</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-400">Loading dashboard...</span>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'content' && renderContent()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
