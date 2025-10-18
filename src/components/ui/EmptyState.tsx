import React from 'react';
import { FileText, Code, Trophy, Bell, Search, MessageCircle, Users, UserPlus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      {Icon && (
        <div className={`${iconSizeClasses[size]} text-neutral-400 dark:text-neutral-500 mb-4`}>
          <Icon className="h-full w-full" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          size={size === 'sm' ? 'sm' : 'md'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Pre-built empty state components
export const EmptyPosts: React.FC<{ onCreatePost?: () => void; className?: string }> = ({ 
  onCreatePost, 
  className = '' 
}) => (
  <EmptyState
    icon={FileText}
    title="No posts yet"
    description="Be the first to share your thoughts and start a conversation in the community."
    action={onCreatePost ? {
      label: 'Create Post',
      onClick: onCreatePost,
      variant: 'primary'
    } : undefined}
    className={className}
  />
);

export const EmptyProblems: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={Code}
    title="No problems available"
    description="Check back later for new coding challenges and practice problems."
    className={className}
  />
);

export const EmptyChallenges: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={Trophy}
    title="No challenges yet"
    description="New challenges are coming soon! Stay tuned for exciting competitions."
    className={className}
  />
);

export const EmptyNotifications: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={Bell}
    title="All caught up!"
    description="You have no new notifications. We'll notify you when something important happens."
    className={className}
    size="sm"
  />
);

export const EmptySearch: React.FC<{ query?: string; className?: string }> = ({ 
  query, 
  className = '' 
}) => (
  <EmptyState
    icon={Search}
    title={query ? `No results for "${query}"` : 'No results found'}
    description={query 
      ? 'Try adjusting your search terms or browse our categories to find what you\'re looking for.'
      : 'Try searching for something else or browse our content.'
    }
    className={className}
  />
);

export const EmptyComments: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={MessageCircle}
    title="No comments yet"
    description="Be the first to share your thoughts on this post."
    className={className}
    size="sm"
  />
);

export const EmptyFollowers: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={Users}
    title="No followers yet"
    description="Share your profile and start building your network by connecting with other developers."
    className={className}
  />
);

export const EmptyFollowing: React.FC<{ className?: string }> = ({ className = '' }) => (
  <EmptyState
    icon={UserPlus}
    title="Not following anyone"
    description="Discover amazing developers and follow them to see their latest posts and achievements."
    className={className}
  />
);

export default EmptyState;