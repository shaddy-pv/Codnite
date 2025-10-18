import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import Loading from './ui/Loading';
import { api, User } from '../services/api';
import { useToast } from './ui/Toast';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    githubUsername: user.githubUsername || '',
    linkedinUrl: user.linkedinUrl || '',
    collegeId: user.collegeId || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        githubUsername: user.githubUsername || '',
        linkedinUrl: user.linkedinUrl || '',
        collegeId: user.collegeId || ''
      });
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await api.updateProfile({
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        githubUsername: formData.githubUsername.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined
      });

      onProfileUpdated(updatedUser.user);
      addToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      addToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Name"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <Textarea
          label="Bio"
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="GitHub Username"
            placeholder="your-github-username"
            value={formData.githubUsername}
            onChange={(e) => handleChange('githubUsername', e.target.value)}
          />

          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/your-profile"
            value={formData.linkedinUrl}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
          />
        </div>

        <Input
          label="College ID"
          placeholder="Your college or university"
          value={formData.collegeId}
          onChange={(e) => handleChange('collegeId', e.target.value)}
        />

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
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileEditModal;
