import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Sparkles } from 'lucide-react';

interface LevelUpNotificationProps {
  isVisible: boolean;
  newLevel: number;
  points: number;
  onClose: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  isVisible,
  newLevel,
  points,
  onClose
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('enter');
      const timer1 = setTimeout(() => setAnimationPhase('show'), 100);
      const timer2 = setTimeout(() => setAnimationPhase('exit'), 3000);
      const timer3 = setTimeout(() => onClose(), 3500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-500 ${
        animationPhase === 'enter' ? 'opacity-0' : 
        animationPhase === 'show' ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Notification Card */}
      <div className={`relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 
        border-2 border-yellow-300 dark:border-yellow-600 rounded-2xl p-8 shadow-2xl pointer-events-auto
        transform transition-all duration-500 ease-out ${
          animationPhase === 'enter' ? 'scale-50 opacity-0 rotate-12' :
          animationPhase === 'show' ? 'scale-100 opacity-100 rotate-0' :
          'scale-75 opacity-0 -rotate-6'
        }`}>
        
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                i % 4 === 0 ? 'bg-yellow-400' :
                i % 4 === 1 ? 'bg-orange-400' :
                i % 4 === 2 ? 'bg-red-400' : 'bg-pink-400'
              } animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            Level Up!
          </h2>

          {/* Level */}
          <div className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-2">
            Level {newLevel}
          </div>

          {/* Points */}
          <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {points.toLocaleString()} points earned!
          </div>

          {/* Sparkles */}
          <div className="flex justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-spin" />
            <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
            <Star className="w-5 h-5 text-yellow-500 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpNotification;
