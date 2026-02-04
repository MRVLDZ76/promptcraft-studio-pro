/**
 * ExportModal - Export book to PDF, EPUB, or HTML
 * Shows progress, handles Celery task polling
 */

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { FileText, BookOpen, Globe } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  bookTitle: string;
}

type ExportFormat = 'pdf' | 'epub' | 'html';
type ExportStatus = 'idle' | 'processing' | 'completed' | 'error';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, bookId, bookTitle }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [taskId, setTaskId] = useState<string>('');

  const formatOptions = [
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF Document',
      description: 'High-quality PDF with embedded fonts',
      icon: FileText,
      size: '~2-5 MB',
    },
    {
      id: 'epub' as ExportFormat,
      name: 'EPUB eBook',
      description: 'Compatible with Kindle, iBooks, etc.',
      icon: BookOpen,
      size: '~1-3 MB',
    },
    {
      id: 'html' as ExportFormat,
      name: 'HTML Website',
      description: 'Static website with navigation',
      icon: Globe,
      size: '~500 KB',
    },
  ];

  const pollTaskStatus = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/publishing/export-status/${taskId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'completed') {
          setStatus('completed');
          setDownloadUrl(data.download_url);
          setProgress(100);
        } else if (data.status === 'failed') {
          setStatus('error');
          setErrorMessage(data.error || 'Export failed');
        } else {
          // Still processing
          setProgress(data.progress || 50);
          setTimeout(() => pollTaskStatus(taskId), 2000); // Poll every 2 seconds
        }
      }
    } catch (err) {
      console.error('Error polling task:', err);
      setStatus('error');
      setErrorMessage('Failed to check export status');
    }
  };

  const handleExport = async () => {
    setStatus('processing');
    setProgress(10);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/publishing/books/${bookId}/export/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          format: selectedFormat,
          include_cover: true,
          include_toc: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTaskId(data.task_id);
        setProgress(30);
        
        // Start polling
        pollTaskStatus(data.task_id);
      } else {
        const error = await response.json();
        setStatus('error');
        setErrorMessage(error.detail || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setStatus('error');
      setErrorMessage('Failed to start export');
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${selectedFormat}_${Date.now()}.${selectedFormat}`;
      link.click();
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setProgress(0);
    setDownloadUrl('');
    setErrorMessage('');
    setTaskId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Book</h2>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose a format to export "<strong>{bookTitle}</strong>"
              </p>

              <div className="space-y-3">
                {formatOptions.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedFormat === format.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <IconComponent className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{format.name}</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{format.size}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{format.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {status === 'processing' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generating {selectedFormat.toUpperCase()}...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">This may take a minute</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progress}%</p>
            </div>
          )}

          {status === 'completed' && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Export Complete!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your {selectedFormat.toUpperCase()} is ready to download
              </p>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2 mx-auto"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download {selectedFormat.toUpperCase()}</span>
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Export Failed</h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{errorMessage}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === 'idle' && (
          <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
