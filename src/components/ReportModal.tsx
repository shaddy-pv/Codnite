import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Shield, MessageSquare, User } from 'lucide-react';
import Button from './ui/Button';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import { PortalModal } from './ui/PortalModal';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment' | 'user';
  contentId: string;
  contentTitle?: string;
}

interface ReportReason {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  severity: 'low' | 'medium' | 'high';
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const reportReasons: ReportReason[] = [
    {
      id: 'spam',
      label: 'Spam',
      description: 'Repetitive, unwanted, or promotional content',
      icon: MessageSquare,
      severity: 'medium'
    },
    {
      id: 'harassment',
      label: 'Harassment',
      description: 'Bullying, threats, or targeted abuse',
      icon: User,
      severity: 'high'
    },
    {
      id: 'inappropriate',
      label: 'Inappropriate Content',
      description: 'Offensive, explicit, or inappropriate material',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      id: 'misinformation',
      label: 'Misinformation',
      description: 'False or misleading information',
      icon: Flag,
      severity: 'medium'
    },
    {
      id: 'violence',
      label: 'Violence or Threats',
      description: 'Content promoting violence or making threats',
      icon: Shield,
      severity: 'high'
    },
    {
      id: 'copyright',
      label: 'Copyright Violation',
      description: 'Unauthorized use of copyrighted material',
      icon: Flag,
      severity: 'medium'
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Something else that violates our community guidelines',
      icon: Flag,
      severity: 'low'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      showError('Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      showError('Please provide details for your report');
      return;
    }

    setIsSubmitting(true);
    try {
      const reason = selectedReason === 'other' ? customReason : selectedReason;
      
      if (contentType === 'post') {
        await api.reportPost(contentId, reason);
      } else if (contentType === 'comment') {
        await api.reportComment(contentId, reason);
      } else if (contentType === 'user') {
        await api.reportUser(contentId, reason);
      }

      success('Report submitted successfully. Thank you for helping keep our community safe.');
      onClose();
      
      // Reset form
      setSelectedReason('');
      setCustomReason('');
    } catch (error: any) {
      showError(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${contentType}`}
      size="md"
    >

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help us understand what's wrong with this {contentType}. Your report will be reviewed by our moderation team.
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                What's the issue?
              </h3>
              
              {reportReasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                
                return (
                  <label
                    key={reason.id}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`
                        p-1 rounded
                        ${reason.severity === 'high' ? 'bg-red-100 dark:bg-red-900/20' : 
                          reason.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/20' : 
                          'bg-gray-100 dark:bg-gray-700'}
                      `}>
                        <Icon className={`
                          w-4 h-4
                          ${reason.severity === 'high' ? 'text-red-600' : 
                            reason.severity === 'medium' ? 'text-orange-600' : 
                            'text-gray-600'}
                        `} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {reason.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {reason.description}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Custom reason input */}
            {selectedReason === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please provide details
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Additional info */}
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5" />
                <div className="text-xs text-primary-800 dark:text-primary-200">
                  <p className="font-medium mb-1">Your report is anonymous</p>
                  <p>We'll review this content and take appropriate action. False reports may result in account restrictions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
    </PortalModal>
  );
};

export default ReportModal;
