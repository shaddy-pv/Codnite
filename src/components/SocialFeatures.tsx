import React, { useState, useCallback, useEffect } from 'react';
import { Hash, AtSign, ExternalLink, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface Mention {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
}

interface Hashtag {
  tag: string;
  count: number;
  trending?: boolean;
}

interface SocialFeaturesProps {
  content: string;
  onMentionClick?: (username: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

const SocialFeatures: React.FC<SocialFeaturesProps> = ({
  content,
  onMentionClick,
  onHashtagClick,
  className = ''
}) => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);

  // Extract mentions and hashtags from content
  const extractMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  }, []);

  const extractHashtags = useCallback((text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  }, []);

  // Load mention details
  const loadMentions = useCallback(async (usernames: string[]) => {
    if (usernames.length === 0) return;

    setIsLoadingMentions(true);
    try {
      const mentionPromises = usernames.map(async (username) => {
        try {
          const user = await api.getUserByUsername(username);
          return {
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            avatarUrl: user.avatarUrl
          };
        } catch (error) {
          return {
            id: username,
            username,
            name: username,
            avatarUrl: undefined
          };
        }
      });

      const mentionResults = await Promise.all(mentionPromises);
      setMentions(mentionResults);
    } catch (error) {
      console.error('Failed to load mentions:', error);
    } finally {
      setIsLoadingMentions(false);
    }
  }, []);

  // Load hashtag details
  const loadHashtags = useCallback(async (tags: string[]) => {
    if (tags.length === 0) return;

    setIsLoadingHashtags(true);
    try {
      const hashtagPromises = tags.map(async (tag) => {
        try {
          const stats = await api.getHashtagStats(tag);
          return {
            tag,
            count: stats.postCount,
            trending: stats.trending
          };
        } catch (error) {
          return {
            tag,
            count: 0,
            trending: false
          };
        }
      });

      const hashtagResults = await Promise.all(hashtagPromises);
      setHashtags(hashtagResults);
    } catch (error) {
      console.error('Failed to load hashtags:', error);
    } finally {
      setIsLoadingHashtags(false);
    }
  }, []);

  // Load trending hashtags
  const loadTrendingHashtags = useCallback(async () => {
    try {
      const trending = await api.getTrendingHashtags();
      setTrendingHashtags(trending);
    } catch (error) {
      console.error('Failed to load trending hashtags:', error);
    }
  }, []);

  // Process content when it changes
  useEffect(() => {
    const extractedMentions = extractMentions(content);
    const extractedHashtags = extractHashtags(content);

    loadMentions(extractedMentions);
    loadHashtags(extractedHashtags);
  }, [content, extractMentions, extractHashtags, loadMentions, loadHashtags]);

  // Load trending hashtags on mount
  useEffect(() => {
    loadTrendingHashtags();
  }, [loadTrendingHashtags]);

  const renderContentWithLinks = () => {
    let processedContent = content;

    // Replace mentions with clickable links
    processedContent = processedContent.replace(
      /@(\w+)/g,
      (match, username) => {
        const mention = mentions.find(m => m.username === username);
        return `<span class="mention-link cursor-pointer text-blue-600 hover:text-blue-800 underline" data-mention="${username}">${match}</span>`;
      }
    );

    // Replace hashtags with clickable links
    processedContent = processedContent.replace(
      /#(\w+)/g,
      (match, tag) => {
        const hashtag = hashtags.find(h => h.tag === tag);
        return `<span class="hashtag-link cursor-pointer text-green-600 hover:text-green-800 underline" data-hashtag="${tag}">${match}</span>`;
      }
    );

    return processedContent;
  };

  const handleMentionClick = (username: string) => {
    onMentionClick?.(username);
  };

  const handleHashtagClick = (hashtag: string) => {
    onHashtagClick?.(hashtag);
  };

  // Add click handlers to the rendered content
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('mention-link')) {
        const username = target.getAttribute('data-mention');
        if (username) {
          handleMentionClick(username);
        }
      } else if (target.classList.contains('hashtag-link')) {
        const hashtag = target.getAttribute('data-hashtag');
        if (hashtag) {
          handleHashtagClick(hashtag);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Content with social links */}
      <div 
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderContentWithLinks() }}
      />

      {/* Mentions Section */}
      {mentions.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AtSign className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mentioned Users
            </h3>
          </div>
          
          <div className="space-y-2">
            {isLoadingMentions ? (
              <div className="text-sm text-gray-500">Loading mentions...</div>
            ) : (
              mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  onClick={() => handleMentionClick(mention.username)}
                >
                  <Avatar
                    src={mention.avatarUrl}
                    alt={mention.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {mention.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{mention.username}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hashtags Section */}
      {hashtags.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hashtags
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isLoadingHashtags ? (
              <div className="text-sm text-gray-500">Loading hashtags...</div>
            ) : (
              hashtags.map((hashtag) => (
                <Badge
                  key={hashtag.tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                  onClick={() => handleHashtagClick(hashtag.tag)}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag.tag}
                  {hashtag.count > 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      ({hashtag.count})
                    </span>
                  )}
                  {hashtag.trending && (
                    <TrendingUp className="w-3 h-3 ml-1 text-orange-500" />
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trending Topics
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <Badge
                key={hashtag.tag}
                variant="secondary"
                className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                onClick={() => handleHashtagClick(hashtag.tag)}
              >
                <Hash className="w-3 h-3 mr-1" />
                {hashtag.tag}
                <span className="ml-1 text-xs opacity-75">
                  ({hashtag.count})
                </span>
                <TrendingUp className="w-3 h-3 ml-1 text-orange-500" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeatures;
