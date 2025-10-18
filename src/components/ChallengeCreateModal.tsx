import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import Loading from './ui/Loading';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface ChallengeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: (challenge: any) => void;
}

const ChallengeCreateModal: React.FC<ChallengeCreateModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    points: 100,
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsLoading(true);

    try {
      const challenge = await api.createChallenge({
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        points: parseInt(formData.points.toString()),
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      onChallengeCreated(challenge);
      addToast('Challenge created successfully!', 'success');
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        difficulty: 'Easy',
        points: 100,
        startDate: '',
        endDate: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create challenge');
      addToast('Failed to create challenge', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Challenge"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Challenge Title"
          placeholder="Enter challenge title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Describe the challenge requirements and rules..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <Input
            label="Points"
            type="number"
            placeholder="100"
            value={formData.points}
            onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
            min="1"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            required
          />

          <Input
            label="End Date & Time"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Challenge'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChallengeCreateModal;
