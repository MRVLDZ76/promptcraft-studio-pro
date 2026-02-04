/**
 * Save Status Indicator
 * Visual feedback for auto-save state
 */

import React from 'react';
import {
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  errorMessage?: string | null;
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaved,
  errorMessage,
  className = ''
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <ArrowPathIcon className="w-4 h-4 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
      case 'saved':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          text: lastSaved ? `Saved ${formatTime(lastSaved)}` : 'Saved',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="w-4 h-4" />,
          text: errorMessage || 'Save failed',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        };
      default:
        return {
          icon: <CloudIcon className="w-4 h-4" />,
          text: 'Auto-save enabled',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-800'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${className}`}>
      <span className={config.color}>{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

export default SaveStatusIndicator;
