/**
 * Publishing Studio - Main App Component
 * Entry point for the Publishing Studio interface
 */

import React, { useState, useEffect } from 'react';
import { BookProjectListItem, BookStatus } from './types';
import { getBookProjects } from './services/publishingService';
import BookList from './components/BookList';
import CreateBookWizard from './components/CreateBookWizard';
import BookEditor from './components/BookEditor';
import BookEditorWorkspace from './components/BookEditorWorkspace';
import { PlusIcon } from '@heroicons/react/24/outline';

const PublishingStudioApp: React.FC = () => {
  const [books, setBooks] = useState<BookProjectListItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [editorBookId, setEditorBookId] = useState<number | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookProjects();
      setBooks(response.results || response);
    } catch (err: any) {
      setError(err.message || 'Failed to load books');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookCreated = (bookId: number) => {
    setShowCreateWizard(false);
    setSelectedBookId(bookId);
    loadBooks();
  };

  const handleBookDeleted = () => {
    setSelectedBookId(null);
    loadBooks();
  };

  const handleBack = () => {
    setSelectedBookId(null);
    loadBooks();
  };

  const handleOpenEditor = (bookId: number) => {
    setEditorBookId(bookId);
  };

  const handleCloseEditor = () => {
    setEditorBookId(null);
    loadBooks();
  };

  // If visual editor is open
  if (editorBookId) {
    return (
      <BookEditorWorkspace
        bookId={editorBookId}
        onClose={handleCloseEditor}
      />
    );
  }

  // If a book is selected, show the editor
  if (selectedBookId) {
    return (
      <BookEditor
        bookId={selectedBookId}
        onBack={handleBack}
        onDelete={handleBookDeleted}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Publishing Studio
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create books, audiobooks, and courses with AI
              </p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Book
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
              <PlusIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No books yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first book to get started
            </p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Book
            </button>
          </div>
        ) : (
          <BookList
            books={books}
            onSelectBook={setSelectedBookId}
            onOpenEditor={handleOpenEditor}
            onRefresh={loadBooks}
          />
        )}
      </div>

      {/* Create Book Wizard Modal */}
      {showCreateWizard && (
        <CreateBookWizard
          onClose={() => setShowCreateWizard(false)}
          onBookCreated={handleBookCreated}
        />
      )}
    </div>
  );
};

export default PublishingStudioApp;
