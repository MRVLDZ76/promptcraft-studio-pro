/**
 * Mobile Hamburger Menu
 * Navigation drawer for chapter list on mobile
 */

import React, { useEffect } from 'react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, children }) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[80vw]
          bg-white dark:bg-gray-800 shadow-2xl z-50
          transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {children}
        </div>
      </div>
    </>
  );
};

interface MobileMenuButtonProps {
  onClick: () => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      aria-label="Open menu"
    >
      <Bars3Icon className="w-6 h-6" />
    </button>
  );
};
