import { useState, useEffect } from 'react';
import { levelApi } from '../services/api';

export interface LevelData {
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
}

export const useLevelData = () => {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number>(0);

  const fetchLevelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setLevelData(null);
        setLoading(false);
        return;
      }
      const data = await levelApi.getUserLevel();
      
      // Check for level up
      if (previousLevel > 0 && data.level > previousLevel) {
        setShowLevelUp(true);
      }
      
      setPreviousLevel(data.level);
      setLevelData(data);
    } catch (err: any) {
      // Gracefully handle 401 (unauthorized) and suppress noisy logs
      const status = err?.response?.status;
      if (status === 401) {
        setLevelData(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch level data');
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePoints = async (points: number, reason: string) => {
    try {
      const result = await levelApi.updateUserPoints(points, reason);
      // Refresh level data after points update
      await fetchLevelData();
      return result;
    } catch (err) {
      console.error('Failed to update points:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLevelData();
  }, []);

  return {
    levelData,
    loading,
    error,
    refetch: fetchLevelData,
    updatePoints,
    showLevelUp,
    hideLevelUp: () => setShowLevelUp(false),
  };
};

export default useLevelData;
