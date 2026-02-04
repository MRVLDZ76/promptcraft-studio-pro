/**
 * Book List Component
 * Displays all book projects with status and progress
 */

import React from 'react';
import {
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Edit3 } from 'lucide-react';
import { BookProjectListItem, BookStatus, PROJECT_TYPE_LABELS } from '../types';

interface BookListProps {
  books: BookProjectListItem[];
  onSelectBook: (bookId: number) => void;
  onOpenEditor: (bookId: number) => void;
  onRefresh: () => void;
}

const BookList: React.FC<BookListProps> = ({ books, onSelectBook, onOpenEditor, onRefresh }) => {
  const getStatusColor = (status: BookStatus) => {
    switch (status) {
      case BookStatus.COMPLETED:
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case BookStatus.GENERATING:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case BookStatus.FAILED:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: BookStatus) => {
    switch (status) {
      case BookStatus.COMPLETED:
        return <CheckCircleIcon className="w-5 h-5" />;
      case BookStatus.GENERATING:
        return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      case BookStatus.FAILED:
        return <ExclamationCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Books ({books.length})
        </h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-1.5" />
          Refresh
        </button>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Status Bar */}
            {book.status === BookStatus.GENERATING && (
              <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                  style={{ width: `${book.progress_percentage}%` }}
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Type Badge & Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  {PROJECT_TYPE_LABELS[book.project_type]}
                </span>
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    book.status
                  )}`}
                >
                  {getStatusIcon(book.status)}
                  <span className="ml-1">{book.status}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {book.title}
              </h3>

              {/* Subtitle */}
              {book.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                  {book.subtitle}
                </p>
              )}

              {/* Author */}
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                by {book.author_name}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {book.chapter_count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Chapters</div>
                </div>
                <div className="text-center border-x border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {book.total_words.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {book.estimated_pages}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pages</div>
                </div>
              </div>

              {/* Progress Bar (if generating) */}
              {book.status === BookStatus.GENERATING && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Generating...</span>
                    <span>{book.progress_percentage}%</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-3.5 h-3.5 mr-1" />
                  {formatDate(book.updated_at)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditor(book.id);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editor</span>
                  </button>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium group-hover:underline">
                    Open →
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList;
