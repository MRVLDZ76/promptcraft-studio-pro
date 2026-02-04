/**
 * Book Editor
 * Main editing interface with chapter navigation and block editor
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type {
  BookProject,
  Chapter,
  ContentBlock,
} from '../types';
import { BookStatus } from '../types';
import {
  getBookProject,
  getChapters,
  getBlocks,
  getBookStatus,
  exportBook,
} from '../services/publishingService';
import BlockEditor from './BlockEditor';
import GenerationDashboard from './GenerationDashboard';

interface BookEditorProps {
  bookId: number;
  onBack: () => void;
  onDelete?: () => void;
}

const BookEditor: React.FC<BookEditorProps> = ({ bookId, onBack, onDelete }) => {
  const [book, setBook] = useState<BookProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  useEffect(() => {
    if (selectedChapterId) {
      loadBlocks(selectedChapterId);
    }
  }, [selectedChapterId]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookData, chaptersData] = await Promise.all([
        getBookProject(bookId),
        getChapters(bookId),
      ]);

      setBook(bookData);
      setChapters(chaptersData.results || chaptersData);

      // Auto-select first chapter
      if (chaptersData.results?.length > 0 || chaptersData.length > 0) {
        const firstChapter = chaptersData.results?.[0] || chaptersData[0];
        setSelectedChapterId(firstChapter.id);
      }

      // Show dashboard if generating
      if (bookData.status === BookStatus.GENERATING) {
        setShowDashboard(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load book');
      console.error('Error loading book:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async (chapterId: number) => {
    try {
      const response = await getBlocks(chapterId);
      const blockList = response.results || response;
      setBlocks(blockList);

      // Auto-select first block
      if (blockList.length > 0) {
        setSelectedBlockId(blockList[0].id);
      }
    } catch (err: any) {
      console.error('Error loading blocks:', err);
    }
  };

  const handleExport = async (format: 'pdf' | 'epub' | 'html' | 'audiobook') => {
    try {
      const blob = await exportBook(bookId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book?.title || 'book'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err.message || 'Failed to export book');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case BookStatus.COMPLETED:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case BookStatus.FAILED:
        return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />;
      case BookStatus.GENERATING:
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getChapterCompletion = (chapter: Chapter): number => {
    const chapterBlocks = blocks.filter((b) => b.chapter === chapter.id);
    if (chapterBlocks.length === 0) return 0;
    const completed = chapterBlocks.filter((b) => b.status === 'completed').length;
    return Math.round((completed / chapterBlocks.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ArrowPathIcon className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error || 'Book not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Check if book is pending generation (created as draft when Celery unavailable)
  const isPendingGeneration = book.status === BookStatus.DRAFT && 
    book.description?.includes('Pending generation');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 flex-col">
      {/* Celery Unavailable Banner */}
      {isPendingGeneration && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-6 py-4">
          <div className="flex items-start space-x-3">
            <ExclamationCircleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Generation Service Unavailable
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                Your book has been saved as a draft, but AI generation couldn't start because the background services are not running.
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-xs text-yellow-900 dark:text-yellow-100 font-mono space-y-1">
                <p className="font-semibold mb-2">To start generation, run these commands:</p>
                <p>1. cd backend</p>
                <p>2. docker-compose up -d redis</p>
                <p>3. .\\start_celery_worker.ps1</p>
                <p className="mt-2 font-semibold">Then click the "Regenerate" button below.</p>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                See <strong>START_SERVICES.md</strong> in the backend folder for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar - Chapter List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">\n        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to Library
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {book.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {book.author_name}
          </p>

          {/* Status Bar */}
          <div className="mt-3 flex items-center space-x-2">
            {getStatusIcon(book.status)}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {book.status}
            </span>
            {book.completion_percentage !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({book.completion_percentage}%)
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {book.completion_percentage !== undefined && book.completion_percentage < 100 && (
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${book.completion_percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No chapters yet</p>
              <p className="text-xs mt-1">Book is being generated...</p>
            </div>
          ) : (
            chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapterId(chapter.id)}
                className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 transition-colors ${
                  selectedChapterId === chapter.id
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Chapter {index + 1}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {chapter.title}
                    </p>
                  </div>
                  {selectedChapterId === chapter.id && (
                    <CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" />
                  )}
                </div>

                {/* Chapter Progress */}
                {selectedChapterId === chapter.id && blocks.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>{blocks.length} blocks</span>
                      <span>{getChapterCompletion(chapter)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${getChapterCompletion(chapter)}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Export Buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {book.pdf_url && (
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                PDF
              </button>
            )}
            {book.epub_url && (
              <button
                onClick={() => handleExport('epub')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                EPUB
              </button>
            )}
            {book.html_url && (
              <button
                onClick={() => handleExport('html')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                HTML
              </button>
            )}
            {book.audiobook_url && (
              <button
                onClick={() => handleExport('audiobook')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                Audio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showDashboard && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <GenerationDashboard bookId={bookId} />
          </div>
        )}

        {/* Block Editor */}
        <div className="flex-1 overflow-y-auto">
          {selectedBlockId && selectedBlock ? (
            <BlockEditor
              key={selectedBlockId}
              bookId={bookId}
              block={selectedBlock}
              onBlockUpdated={() => {
                loadBlocks(selectedChapterId!);
                loadBookData();
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                {blocks.length === 0 ? 'No blocks in this chapter yet' : 'Select a block to edit'}
              </p>
            </div>
          )}
        </div>

        {/* Block Navigation */}
        {blocks.length > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
                  if (currentIndex > 0) {
                    setSelectedBlockId(blocks[currentIndex - 1].id);
                  }
                }}
                disabled={blocks.findIndex((b) => b.id === selectedBlockId) === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4 inline mr-1" />
                Previous Block
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Block {blocks.findIndex((b) => b.id === selectedBlockId) + 1} of {blocks.length}
              </span>

              <button
                onClick={() => {
                  const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
                  if (currentIndex < blocks.length - 1) {
                    setSelectedBlockId(blocks[currentIndex + 1].id);
                  }
                }}
                disabled={blocks.findIndex((b) => b.id === selectedBlockId) === blocks.length - 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Block
                <ChevronLeftIcon className="w-4 h-4 inline ml-1 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default BookEditor;
