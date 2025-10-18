import React, { useRef, useEffect, useState } from 'react';
import { useVirtualScroll } from '../hooks/usePerformance';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualizedList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const { visibleItems, totalHeight, handleScroll } = useVirtualScroll(
    items.length,
    itemHeight,
    containerHeight,
    overscan
  );

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(items[index], index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Optimized PostList component using virtualization
interface PostListProps {
  posts: any[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  containerHeight?: number;
  className?: string;
}

export const VirtualizedPostList: React.FC<PostListProps> = React.memo(({
  posts,
  onLike,
  onComment,
  onShare,
  onBookmark,
  containerHeight = 600,
  className = ''
}) => {
  const renderPost = useCallback((post: any, index: number) => {
    return (
      <div key={post.id} className="p-4">
        {/* Post content would go here */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {post.title}
          </h3>
          <p className="text-neutral-700 dark:text-neutral-300">
            {post.content}
          </p>
        </div>
      </div>
    );
  }, []);

  return (
    <VirtualizedList
      items={posts}
      itemHeight={200} // Estimated post height
      containerHeight={containerHeight}
      renderItem={renderPost}
      overscan={3}
      className={className}
    />
  );
});

VirtualizedPostList.displayName = 'VirtualizedPostList';

export default VirtualizedList;
