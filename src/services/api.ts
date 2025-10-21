import axios from 'axios';

// Access Vite env defensively to satisfy TS in all setups
const VITE_ENV: any = (import.meta as any)?.env || {};
const API_BASE_URL = VITE_ENV.VITE_API_URL || (VITE_ENV.PROD ? 'https://your-domain.com/api' : '/api');

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Enhanced error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT globally clear auth or redirect on 401.
    // Some endpoints (e.g., optional widgets) may return 401 during app boot.
    // Let callers decide how to handle 401s to avoid auth loops.

    const status = error.response?.status;
    const urlPath = (error.config?.url || '').toString();

    // Suppress noisy logs for optional/benign endpoints
    const suppressLog = (
      (status === 401 && (
        urlPath.startsWith('/level/user') ||
        urlPath.startsWith('/notifications') ||
        urlPath.startsWith('/chat')
      )) ||
      (status === 404 && (
        urlPath.startsWith('/posts/bookmarks')
      ))
    );

    if (!suppressLog) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced API functions with better error handling
export const authAPI = {
  register: async (userData: {
    email: string;
    username: string;
    password: string;
    name: string;
    collegeId?: number;
  }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      // Re-throw with enhanced error information
      const enhancedError = new Error(error.response?.data?.error || error.message || 'Registration failed');
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response?.status;
      throw enhancedError;
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('authAPI.login called with:', { email: credentials.email, password: '***' });
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      const enhancedError = new Error(error.response?.data?.error || error.message || 'Login failed');
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response?.status;
      throw enhancedError;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      const enhancedError = new Error(error.response?.data?.error || error.message || 'Failed to get user data');
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response?.status;
      throw enhancedError;
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      return response.data;
    } catch (error: any) {
      const enhancedError = new Error(error.response?.data?.error || error.message || 'Failed to update profile');
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response?.status;
      throw enhancedError;
    }
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await apiClient.put('/auth/password', passwordData);
      return response.data;
    } catch (error: any) {
      const enhancedError = new Error(error.response?.data?.error || error.message || 'Failed to change password');
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response?.status;
      throw enhancedError;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.warn('Logout request failed, but local session cleared:', error.message);
    }
  }
};

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  collegeId?: string;
  points: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  code?: string;
  language?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    collegeId?: string;
    avatarUrl?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
  };
}

export interface Submission {
  id: string;
  code: string;
  language: string;
  status: string;
  score: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  acceptanceRate: number;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  tags: string[];
  companies: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  createdAt: string;
  _count: {
    submissions: number;
    accepted: number;
  };
}

export interface ProblemSubmission {
  id: string;
  code: string;
  language: string;
  status: string;
  runtime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  createdAt: string;
}

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    name: string;
    collegeId?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    githubUsername?: string;
    linkedinUrl?: string;
  }) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },
};

// Posts API
export const postsApi = {
  getPosts: async (page: number = 1, limit: number = 10, sort?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (sort) {
      params.append('sort', sort);
    }
    
    const response = await apiClient.get(`/posts?${params.toString()}`);
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data: {
    title: string;
    content: string;
    code?: string;
    language?: string;
    tags?: string[];
    category?: string;
    isPublic?: boolean;
    collegeId?: string;
  }) => {
    const response = await apiClient.post('/posts', data);
    return response.data;
  },

  likePost: async (postId: string) => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId: string) => {
    const response = await apiClient.delete(`/posts/${postId}/like`);
    return response.data;
  },

  addComment: async (postId: string, content: string) => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },
};

// Challenges API
export const challengesApi = {
  getChallenges: async () => {
    const response = await apiClient.get('/challenges');
    return response.data;
  },

  getChallenge: async (id: string) => {
    const response = await apiClient.get(`/challenges/${id}`);
    return response.data;
  },

  createChallenge: async (data: {
    title: string;
    description: string;
    difficulty: string;
    points: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.post('/challenges', data);
    return response.data;
  },

  submitSolution: async (challengeId: string, data: {
    code: string;
    language: string;
  }) => {
    const response = await apiClient.post(`/challenges/${challengeId}/submit`, data);
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await apiClient.get('/challenges/leaderboard');
    return response.data;
  },
};

// Problems API
export const problemsApi = {
  getProblems: async (page: number = 1, limit: number = 20, filters?: {
    difficulty?: string;
    tag?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/problems?${params}`);
    return response.data;
  },

  getProblem: async (id: string) => {
    const response = await apiClient.get(`/problems/${id}`);
    return response.data;
  },

  createProblem: async (data: {
    title: string;
    description: string;
    difficulty: string;
    examples?: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    constraints?: string[];
    tags?: string[];
    companies?: string[];
    testCases?: Array<{
      input: string;
      expectedOutput: string;
    }>;
  }) => {
    const response = await apiClient.post('/problems', data);
    return response.data;
  },

  submitSolution: async (problemId: string, data: {
    code: string;
    language: string;
    status?: string;
    runtime?: number;
    memory?: number;
    testCasesPassed?: number;
    totalTestCases?: number;
    output?: string;
    error?: string;
  }) => {
    const response = await apiClient.post(`/problems/${problemId}/submit`, data);
    return response.data;
  },

  getSubmissions: async (problemId: string) => {
    const response = await apiClient.get(`/problems/${problemId}/submissions`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getUser: async (userId: string) => {
    const endpoint = userId === 'me' ? '/user/me' : `/user/${userId}`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  getUserPosts: async (userId: string): Promise<Post[]> => {
    const endpoint = userId === 'me' ? '/user/me/posts' : `/user/${userId}/posts`;
    const response = await apiClient.get(endpoint);
    return response.data.posts;
  },

  // Get user statistics
  getUserStats: async (userId: string) => {
    const endpoint = userId === 'me' ? '/user/me/stats' : `/user/${userId}/stats`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Get user badges
  getUserBadges: async (userId: string) => {
    const endpoint = userId === 'me' ? '/user/me/badges' : `/user/${userId}/badges`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Get user achievements
  getUserAchievements: async (userId: string) => {
    const endpoint = userId === 'me' ? '/user/me/achievements' : `/user/${userId}/achievements`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Get user activity feed
  getUserActivity: async (userId: string, page = 1, limit = 10) => {
    const endpoint = userId === 'me' ? '/user/me/activity' : `/user/${userId}/activity`;
    const response = await apiClient.get(endpoint, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get user skills
  getUserSkills: async (userId: string) => {
    const endpoint = userId === 'me' ? '/user/me/skills' : `/user/${userId}/skills`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Follow a user
  followUser: async (userId: string) => {
    const response = await apiClient.post(`/user/${userId}/follow`);
    return response.data;
  },

  // Unfollow a user
  unfollowUser: async (userId: string) => {
    const response = await apiClient.delete(`/user/${userId}/follow`);
    return response.data;
  },

  // Check follow status
  getFollowStatus: async (userId: string) => {
    const response = await apiClient.get(`/user/${userId}/follow-status`);
    return response.data;
  },

  updateUser: async (data: {
    name?: string;
    username?: string;
    collegeId?: string;
  }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  // Extended methods
  getSuggestedUsers: async (limit: number = 10) => {
    const response = await apiClient.get(`/users/suggested?limit=${limit}`);
    return response.data;
  },

  getTrendingUsers: async (limit: number = 10, timeframe?: string) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    if (timeframe) params.append('timeframe', timeframe);
    
    const response = await apiClient.get(`/users/trending?${params}`);
    return response.data;
  },

  getCollegeUsers: async (collegeId: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/users/college/${collegeId}?${params}`);
    return response.data;
  },

  getUserFollowers: async (userId: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/users/${userId}/followers?${params}`);
    return response.data;
  },

  getUserFollowing: async (userId: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/users/${userId}/following?${params}`);
    return response.data;
  }
};

// Main API object
export const api = {
  // Auth
  register: authApi.register,
  login: authApi.login,
  getMe: authApi.getMe,
  updateProfile: authApi.updateProfile,

  // Posts
  getPosts: postsApi.getPosts,
  getPost: postsApi.getPost,
  createPost: postsApi.createPost,
  likePost: postsApi.likePost,
  unlikePost: postsApi.unlikePost,
  addComment: postsApi.addComment,

  // Challenges
  getChallenges: challengesApi.getChallenges,
  getChallenge: challengesApi.getChallenge,
  createChallenge: challengesApi.createChallenge,
  submitSolution: challengesApi.submitSolution,
  getLeaderboard: challengesApi.getLeaderboard,

  // Problems
  getProblems: problemsApi.getProblems,
  getProblem: problemsApi.getProblem,
  createProblem: problemsApi.createProblem,
  submitProblemSolution: problemsApi.submitSolution,
  getProblemSubmissions: problemsApi.getSubmissions,

  // Community Features

  getFollowers: async (userId: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/follows/${userId}/followers?page=${page}&limit=${limit}`);
    return response.data;
  },

  getFollowing: async (userId: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/follows/${userId}/following?page=${page}&limit=${limit}`);
    return response.data;
  },

  checkFollowStatus: async (userId: string) => {
    const response = await apiClient.get(`/follows/${userId}/status`);
    return response.data;
  },

  getFollowCounts: async (userId: string) => {
    const response = await apiClient.get(`/follows/${userId}/counts`);
    return response.data;
  },

  // Notifications
  getNotifications: async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
    const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  getUnreadNotificationCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  updateNotificationPreferences: async (preferences: any) => {
    const response = await apiClient.put('/notifications/preferences', { preferences });
    return response.data;
  },

  // File Upload
  uploadAvatar: async (formData: FormData) => {
    const response = await apiClient.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadCoverPhoto: async (formData: FormData) => {
    const response = await apiClient.post('/upload/cover-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Code Execution
  executeCode: async (data: {
    code: string;
    language: string;
    testCases?: any[];
  }) => {
    const response = await apiClient.post('/execution/test', data);
    return response.data;
  },

  getSubmissionHistory: async (problemId?: string, page: number = 1, limit: number = 20) => {
    if (problemId) {
      const response = await apiClient.get(`/execution/problem/${problemId}/submissions`, {
        params: { page, limit }
      });
      return response.data;
    } else {
      // If no problemId, return empty result or implement general submissions endpoint
      return { submissions: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
  },

  uploadImage: async (formData: FormData) => {
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await apiClient.delete('/upload/avatar');
    return response.data;
  },

  getUploadConfig: async () => {
    const response = await apiClient.get('/upload/config');
    return response.data;
  },

  getAvatarInfo: async () => {
    const response = await apiClient.get('/upload/avatar');
    return response.data;
  },

  // Colleges
  getColleges: async (page: number = 1, limit: number = 20, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/colleges?${params}`);
    return response.data;
  },

  getCollege: async (id: string) => {
    const response = await apiClient.get(`/colleges/${id}`);
    return response.data;
  },

  getCollegeMembers: async (id: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/colleges/${id}/members?page=${page}&limit=${limit}`);
    return response.data;
  },

  getCollegeLeaderboard: async (id: string, limit: number = 10) => {
    const response = await apiClient.get(`/colleges/${id}/leaderboard?limit=${limit}`);
    return response.data;
  },

  getCollegePosts: async (id: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/colleges/${id}/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  createCollege: async (data: {
    name: string;
    shortName: string;
    logoUrl?: string;
    location?: string;
    rank?: number;
    description?: string;
  }) => {
    const response = await apiClient.post('/colleges', data);
    return response.data;
  },

  // Users
  getUser: usersApi.getUser,
  getUserPosts: usersApi.getUserPosts,
  getUserStats: usersApi.getUserStats,
  getUserBadges: usersApi.getUserBadges,
  getUserAchievements: usersApi.getUserAchievements,
  getUserActivity: usersApi.getUserActivity,
  getUserSkills: usersApi.getUserSkills,
  getFollowStatus: usersApi.getFollowStatus,
  updateUser: usersApi.updateUser,
  getSuggestedUsers: usersApi.getSuggestedUsers,
  getTrendingUsers: usersApi.getTrendingUsers,
  getCollegeUsers: usersApi.getCollegeUsers,
  followUser: usersApi.followUser,
  unfollowUser: usersApi.unfollowUser,
  getUserFollowers: usersApi.getUserFollowers,
  getUserFollowing: usersApi.getUserFollowing,

  // Messaging API
  sendMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('/chat/messages', {
      receiverId,
      content
    });
    return response.data;
  },

  getMessages: async (userId: string, page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(`/chat/messages/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },
};

// Chat API
export const chatApi = {
  getRooms: (params?: { type?: string; college_id?: string }) => 
    apiClient.get('/chat/rooms', { params }),
  createRoom: (data: { name: string; description?: string; type?: string; college_id?: string }) =>
    apiClient.post('/chat/rooms', data),
  joinRoom: (roomId: string) =>
    apiClient.post(`/chat/rooms/${roomId}/join`),
  leaveRoom: (roomId: string) =>
    apiClient.post(`/chat/rooms/${roomId}/leave`),
  getMessages: (roomId: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId: string, data: { content: string; message_type?: string; metadata?: any }) =>
    apiClient.post(`/chat/rooms/${roomId}/messages`, data),
  getMembers: (roomId: string) =>
    apiClient.get(`/chat/rooms/${roomId}/members`),
  
  // Direct messaging functions
  getDirectChats: async () => {
    const response = await apiClient.get('/chat');
    return response.data;
  },

  getDirectMessages: async (userId: string, page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(`/chat/messages/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendDirectMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('/chat/messages', { receiverId, content });
    return response.data;
  },

  createDirectChat: async (userId: string) => {
    // For direct messages, we don't need to create a chat - just send a message
    return { chatId: `chat_${userId}` };
  },

  markDirectChatAsRead: async (userId: string) => {
    // This is handled automatically when fetching messages
    return { success: true };
  },
};

// Recommendations API
export const recommendationsApi = {
  getUsers: (params?: { limit?: number }) =>
    apiClient.get('/recommendations/users', { params }),
  getPosts: (params?: { limit?: number }) =>
    apiClient.get('/recommendations/posts', { params }),
  getChallenges: (params?: { limit?: number }) =>
    apiClient.get('/recommendations/challenges', { params }),
  getHashtags: (params?: { limit?: number }) =>
    apiClient.get('/recommendations/hashtags', { params }),
};

// Social API
export const socialApi = {
  getHashtag: (name: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get(`/social/hashtags/${name}`, { params }),
  getTrendingHashtags: (params?: { limit?: number }) =>
    apiClient.get('/social/hashtags', { params }),
  getMentions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get('/social/mentions', { params }),
  getHashtagSuggestions: (params: { q: string }) =>
    apiClient.get('/social/hashtags/suggestions', { params }),
  getMentionSuggestions: (params: { q: string }) =>
    apiClient.get('/social/mentions/suggestions', { params }),
};

// Comments API
export const commentsApi = {
  create: (postId: string, data: { content: string; parent_id?: string }) =>
    apiClient.post(`/posts/${postId}/comments`, data),
  getByPost: (postId: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get(`/posts/${postId}/comments`, { params }),
  update: (commentId: string, data: { content: string }) =>
    apiClient.put(`/comments/${commentId}`, data),
  delete: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),
};

// Colleges API
export const collegesApi = {
  getColleges: async (page: number = 1, limit: number = 20, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/colleges?${params}`);
    return response.data;
  },

  getCollege: async (id: string) => {
    const response = await apiClient.get(`/colleges/${id}`);
    return response.data;
  },

  getCollegeMembers: async (id: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/colleges/${id}/members?${params}`);
    return response.data;
  },

  getCollegeLeaderboard: async (id: string, limit: number = 10) => {
    const response = await apiClient.get(`/colleges/${id}/leaderboard?limit=${limit}`);
    return response.data;
  },

  getCollegePosts: async (id: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/colleges/${id}/posts?${params}`);
    return response.data;
  },
};

// Leaderboard API
export const leaderboardApi = {
  getLeaderboard: async (page: number = 1, limit: number = 50, timeframe?: string, collegeId?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (timeframe) params.append('timeframe', timeframe);
    if (collegeId) params.append('college_id', collegeId);
    
    const response = await apiClient.get(`/leaderboard?${params}`);
    return response.data;
  },

  getCollegeLeaderboard: async (collegeId: string, limit: number = 20) => {
    const response = await apiClient.get(`/leaderboard/college/${collegeId}?limit=${limit}`);
    return response.data;
  },

  getUserRank: async (userId: string) => {
    const response = await apiClient.get(`/leaderboard/user/${userId}`);
    return response.data;
  },
};

// Code Execution API
export const executionApi = {
  executeCode: async (problemId: string, code: string, language: string) => {
    const response = await apiClient.post('/execution/execute', {
      problemId,
      code,
      language
    });
    return response.data;
  },

  // Simple test execution (no auth required)
  testCode: async (code: string, language: string) => {
    const response = await apiClient.post('/execution/test', {
      code,
      language
    });
    return response.data;
  },

  getSubmission: async (submissionId: string) => {
    const response = await apiClient.get(`/execution/submission/${submissionId}`);
    return response.data;
  },

  getProblemSubmissions: async (problemId: string, page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/execution/problem/${problemId}/submissions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getSupportedLanguages: async () => {
    const response = await apiClient.get('/execution/languages');
    return response.data;
  },

  healthCheck: async () => {
    const response = await apiClient.get('/execution/health');
    return response.data;
  },
};

// Search API
export const searchApi = {
  search: async (params: {
    query: string;
    type?: 'all' | 'posts' | 'users' | 'challenges' | 'problems';
    category?: string;
    tags?: string[];
    difficulty?: string;
    sortBy?: 'relevance' | 'date' | 'popularity';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/search', { 
      // prevent cached responses between rapid queries
      headers: { 'Cache-Control': 'no-cache' },
      params: {
        q: params.query,  // Backend expects 'q' parameter
        type: params.type,
        limit: params.limit,
        offset: params.page ? (params.page - 1) * (params.limit || 20) : 0,
        _t: Date.now() // cache buster
      }
    });
    return response.data;
  },

  searchUsers: async (query: string, page: number = 1, limit: number = 20) => {
    const response = await searchApi.search({
      query: query,
      type: 'users',
      page: page,
      limit: limit
    });
    return {
      users: response.results || [],
      pagination: {
        total: response.total || 0,
        pages: Math.ceil(response.total / limit) || 1,
        currentPage: page,
        limit: limit
      }
    };
  },

  searchPosts: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await searchApi.search({
      query: query,
      type: 'posts',
      page: page,
      limit: limit
    });
    return {
      posts: response.results || [],
      pagination: {
        total: response.total || 0,
        pages: Math.ceil(response.total / limit) || 1,
        currentPage: page,
        limit: limit
      }
    };
  },

  searchChallenges: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await searchApi.search({
      query: query,
      type: 'challenges',
      page: page,
      limit: limit
    });
    return {
      challenges: response.results || [],
      pagination: {
        total: response.total || 0,
        pages: Math.ceil(response.total / limit) || 1,
        currentPage: page,
        limit: limit
      }
    };
  },

  searchProblems: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await searchApi.search({
      query: query,
      type: 'problems',
      page: page,
      limit: limit
    });
    return {
      problems: response.results || [],
      pagination: {
        total: response.total || 0,
        pages: Math.ceil(response.total / limit) || 1,
        currentPage: page,
        limit: limit
      }
    };
  },
};

// Bookmark API
export const bookmarkApi = {
  bookmarkPost: async (postId: string) => {
    const response = await apiClient.post(`/posts/${postId}/bookmark`);
    return response.data;
  },

  getBookmarkedPosts: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/posts/bookmarks?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Admin API functions
export const adminApi = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await apiClient.get('/admin/activity');
    return response.data;
  },

  getUsers: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUser: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: any) => {
    const response = await apiClient.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getPosts: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/admin/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await apiClient.delete(`/admin/posts/${postId}`);
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await apiClient.put('/admin/settings', settings);
    return response.data;
  },
};

// Challenge API
export const challengeApi = {
  submitChallenge: async (challengeId: string, code: string, language: string) => {
    const response = await apiClient.post(`/challenges/${challengeId}/submit`, {
      code,
      language
    });
    return response.data;
  },
};

// Level and Progress API
export const levelApi = {
  getUserLevel: async (): Promise<{
    level: number;
    points: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
    progress: number;
    stats: {
      challengesCompleted: number;
      problemsSolved: number;
      postsCreated: number;
      commentsMade: number;
    };
    badges: {
      trophy: string;
      code: string;
      check: string;
      star: string;
    };
  }> => {
    const response = await apiClient.get('/level/user');
    return response.data;
  },

  getLevelLeaderboard: async (limit = 10, offset = 0): Promise<Array<{
    rank: number;
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    points: number;
    level: number;
    challengesCompleted: number;
    problemsSolved: number;
    postsCreated: number;
  }>> => {
    const response = await apiClient.get(`/level/leaderboard?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  updateUserPoints: async (points: number, reason: string): Promise<{
    success: boolean;
    newPoints: number;
    level: number;
    progress: number;
    reason: string;
  }> => {
    const response = await apiClient.post('/level/points', { points, reason });
    return response.data;
  },
};

export default api;