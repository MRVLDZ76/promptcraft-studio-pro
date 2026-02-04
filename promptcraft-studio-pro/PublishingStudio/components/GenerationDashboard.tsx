/**
 * Generation Dashboard
 * Real-time progress tracking for book generation
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { BookStatusDetail, BlockStatus as BlockStatusType } from '../types';
import { BlockStatus } from '../types';
import { pollBookStatus } from '../services/publishingService';

interface GenerationDashboardProps {
  bookId: number;
}

const GenerationDashboard: React.FC<GenerationDashboardProps> = ({ bookId }) => {
  const [status, setStatus] = useState<BookStatusDetail | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    let stopPolling: (() => void) | null = null;

    if (polling) {
      stopPolling = pollBookStatus(bookId, (statusUpdate) => {
        setStatus(statusUpdate);

        // Stop polling if completed or failed
        if (statusUpdate.status === 'completed' || statusUpdate.status === 'failed') {
          setPolling(false);
        }
      });
    }

    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, [bookId, polling]);

  if (!status) {
    return (
      <div className="p-6 flex items-center justify-center">
        <ArrowPathIcon className="w-6 h-6 text-purple-600 animate-spin mr-2" />
        <span className="text-gray-600 dark:text-gray-400">Loading status...</span>
      </div>
    );
  }

  const getBlockStatusIcon = (blockStatus: string) => {
    switch (blockStatus) {
      case BlockStatus.COMPLETED:
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case BlockStatus.FAILED:
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case BlockStatus.PROCESSING:
        return <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBlockStatusColor = (blockStatus: string) => {
    switch (blockStatus) {
      case BlockStatus.COMPLETED:
        return 'bg-green-100 dark:bg-green-900/20';
      case BlockStatus.FAILED:
        return 'bg-red-100 dark:bg-red-900/20';
      case BlockStatus.PROCESSING:
        return 'bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Overall Progress
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {status.completion_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${status.completion_percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {status.current_step}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Blocks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {status.total_blocks}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {status.completed_blocks}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Processing</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {status.processing_blocks}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {status.failed_blocks}
          </p>
        </div>
      </div>

      {/* Block Grid */}
      {status.blocks && status.blocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Block Status Grid
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {status.blocks.map((blockStatus, index) => (
              <div
                key={blockStatus.id}
                className={`${getBlockStatusColor(
                  blockStatus.status
                )} rounded p-2 flex items-center justify-center`}
                title={`Block #${index + 1}: ${blockStatus.status}`}
              >
                {getBlockStatusIcon(blockStatus.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Blocks */}
      {status.failed_blocks > 0 && status.blocks && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed Blocks
          </h3>
          <div className="space-y-2">
            {status.blocks
              .filter((b) => b.status === BlockStatus.FAILED)
              .map((blockStatus, index) => (
                <div
                  key={blockStatus.id}
                  className="flex items-start space-x-2 text-sm text-red-700 dark:text-red-300"
                >
                  <XCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Block #{blockStatus.order_index + 1}</p>
                    {blockStatus.error_message && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {blockStatus.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Estimated Time */}
      {status.estimated_completion_time && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Estimated completion in {Math.ceil(status.estimated_completion_time / 60)} minutes
          </p>
        </div>
      )}
    </div>
  );
};

export default GenerationDashboard;
