import React, { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import ChatModal from './ChatModal';

interface MessageButtonProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const MessageButton: React.FC<MessageButtonProps> = ({
  userId,
  userName,
  userAvatar,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMessageClick = async () => {
    setLoading(true);
    try {
      // Open chat modal
      setIsChatOpen(true);
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleMessageClick}
        variant="outline"
        size={size}
        disabled={loading}
        leftIcon={showIcon ? (loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />) : undefined}
        className={`transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 ${className}`}
      >
        {loading ? 'Opening...' : 'Message'}
      </Button>

      {isChatOpen && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}
    </>
  );
};

export default MessageButton;

