import React, { useState, useCallback } from 'react';
import { X, Hash, Tag, Image as ImageIcon, Video, Code, Globe } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { Button } from './ui/Button';
import Badge from './ui/Badge';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface PostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

interface PostData {
  title: string;
  content: string;
  tags: string[];
  category: string;
  language?: string;
  isPublic: boolean;
}

const PostCreateModal: React.FC<PostCreateModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const [postData, setPostData] = useState<PostData>({
    title: '',
    content: '',
    tags: [],
    category: 'general',
    language: '',
    isPublic: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { success, error: showError } = useToast();

  const categories = [
    { value: 'general', label: 'General Discussion', icon: Globe },
    { value: 'coding', label: 'Coding Help', icon: Code },
    { value: 'algorithm', label: 'Algorithms', icon: Hash },
    { value: 'project', label: 'Project Showcase', icon: ImageIcon },
    { value: 'tutorial', label: 'Tutorial', icon: Video },
    { value: 'question', label: 'Question', icon: Tag }
  ];

  const programmingLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'R', 'MATLAB', 'SQL',
    'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Vue', 'React', 'Angular',
    'Node.js', 'Express', 'Next.js', 'Nuxt.js', 'Svelte', 'Other'
  ];

  const handleInputChange = (field: keyof PostData, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, postData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // For now, we'll use a placeholder URL
      // In a real implementation, you'd upload to your image service
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }, []);

  const handleMentionSearch = useCallback(async (query: string) => {
    try {
      // Search for users to mention
      const users = await api.searchUsers(query, 5);
      return users.users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name || user.username
      }));
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  }, []);

  // Extract hashtags from HTML content
  const extractHashtags = (content: string): string[] => {
    // Remove HTML tags and extract hashtags
    const textContent = content.replace(/<[^>]*>/g, ' ');
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = textContent.match(hashtagRegex) || [];
    
    // Remove duplicates and clean hashtags
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
  };

  const handleSubmit = async () => {
    if (!postData.title.trim() || !postData.content.trim()) {
      showError('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract hashtags from content
      const hashtags = extractHashtags(postData.content);
      const allTags = [...postData.tags, ...hashtags];

      const newPost = await api.createPost({
        title: postData.title,
        content: postData.content,
        tags: allTags,
        category: postData.category,
        language: postData.language,
        isPublic: postData.isPublic
      });

      success('Post created successfully!');
      onPostCreated?.(newPost);
      
      // Reset form
      setPostData({
        title: '',
        content: '',
        tags: [],
        category: 'general',
        language: '',
        isPublic: true
      });
      
      onClose();
    } catch (error: any) {
      console.error('Post creation failed:', error);
      showError(error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoExtractTags = () => {
    const hashtags = extractHashtags(postData.content);
    const newTags = hashtags.filter(tag => !postData.tags.includes(tag));
    if (newTags.length > 0) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Post
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={postData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  maxLength={200}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {postData.title.length}/200 characters
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  content={postData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  placeholder="Share your thoughts, code, or ask a question..."
                  onImageUpload={handleImageUpload}
                  onMentionSearch={handleMentionSearch}
                  maxLength={5000}
                />
                <div className="text-sm text-gray-500 mt-2">
                  💡 Tip: Use @username to mention users, #hashtag for topics
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {postData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={autoExtractTags}
                    title="Extract hashtags from content"
                  >
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <label
                        key={category.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          postData.category === category.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category.value}
                          checked={postData.category === category.value}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="sr-only"
                        />
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Programming Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programming Language (optional)
                </label>
                <select
                  value={postData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select language</option>
                  {programmingLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
        </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      checked={postData.isPublic}
                      onChange={() => handleInputChange('isPublic', true)}
                      className="sr-only"
                    />
                    <Globe className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">Public</div>
                      <div className="text-xs text-gray-500">Anyone can see this post</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!postData.isPublic}
                      onChange={() => handleInputChange('isPublic', false)}
                      className="sr-only"
                    />
                    <Tag className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="text-sm font-medium">Community Only</div>
                      <div className="text-xs text-gray-500">Only community members can see</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Toggle */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="mt-6 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="prose dark:prose-invert max-w-none">
                <h1 className="text-xl font-bold">{postData.title || 'Untitled'}</h1>
                <div dangerouslySetInnerHTML={{ __html: postData.content }} />
                {postData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {postData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
              disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !postData.title.trim() || !postData.content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreateModal;
