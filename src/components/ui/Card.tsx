import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Share2, Bookmark } from 'lucide-react';
import Avatar from './Avatar';
import Badge from './Badge';

interface CardProps {
  type?: 'post' | 'problem' | 'challenge' | 'container';
  author?: {
    name: string;
    avatar: string;
    college?: string;
    username: string;
  };
  content?: {
    text?: string;
    code?: string;
    language?: string;
    image?: string;
  };
  tags?: string[];
  stats?: {
    likes: number;
    comments: number;
  };
  time?: string;
  link?: string;
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  type = 'post',
  author,
  content,
  tags,
  stats,
  time,
  link,
  className = '',
  children
}) => {
  // If used as a container (no specific props), render as a simple container
  if (type === 'container' || (!author && !content && !stats && children)) {
    return (
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 ${className}`}>
        {children}
      </div>
    );
  }

  // Original card functionality for posts/problems/challenges
  return (
    <div className={`bg-dark-600 rounded-xl border border-dark-500 overflow-hidden animate-fade-in ${className}`}>
      {/* Card Header */}
      {author && (
        <div className="flex items-center p-4 border-b border-dark-500">
          <Avatar src={author.avatar} size="md" />
          <div className="ml-3">
            <div className="flex items-center">
              <Link to={`/profile/${author.username}`} className="font-medium text-dark-100 hover:underline">
                {author.name}
              </Link>
              {type === 'problem' && <Badge text="Problem Creator" color="blue" className="ml-2" />}
            </div>
            <div className="flex items-center text-dark-300 text-sm">
              {author.college && (
                <>
                  <span>{author.college}</span>
                  <span className="mx-1">•</span>
                </>
              )}
              <span>{time}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-4">
        {content?.text && <p className="text-dark-100 mb-4">{content.text}</p>}
        {content?.code && (
          <div className="bg-dark-700 rounded-md p-4 mb-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary-blue text-xs">
                {content.language}
              </span>
              <button className="text-dark-300 text-xs hover:text-dark-100">
                Copy
              </button>
            </div>
            <pre className="text-dark-200 text-sm font-mono">
              <code>{content.code}</code>
            </pre>
          </div>
        )}
        {content?.image && (
          <div className="rounded-md overflow-hidden mb-4">
            <img src={content.image} alt="Post content" className="w-full object-cover" />
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <Badge key={index} text={tag} color="purple" />
            ))}
          </div>
        )}
        {children}
      </div>
      
      {/* Card Footer */}
      {stats && (
        <div className="px-4 py-3 border-t border-dark-500 flex justify-between">
          <div className="flex space-x-4">
            <button className="flex items-center text-dark-300 hover:text-primary-blue transition-colors">
              <ThumbsUp className="h-4 w-4 mr-1.5" />
              <span className="text-sm">{stats.likes}</span>
            </button>
            <button className="flex items-center text-dark-300 hover:text-primary-blue transition-colors">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              <span className="text-sm">{stats.comments}</span>
            </button>
          </div>
          <div className="flex space-x-4">
            <button className="text-dark-300 hover:text-primary-blue transition-colors">
              <Bookmark className="h-4 w-4" />
            </button>
            <button className="text-dark-300 hover:text-primary-blue transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
export { Card };