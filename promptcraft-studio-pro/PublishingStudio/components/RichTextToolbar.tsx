/**
 * RichTextToolbar - Formatting controls for inline editing
 * Provides bold, italic, underline, lists, and text alignment
 */

import React from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  Bars3Icon,
  Bars3CenterLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/24/outline';

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  isActive?: (command: string) => boolean;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onFormat, isActive }) => {
  const buttons = [
    { command: 'bold', icon: BoldIcon, label: 'Bold' },
    { command: 'italic', icon: ItalicIcon, label: 'Italic' },
    { command: 'underline', icon: UnderlineIcon, label: 'Underline' },
    { command: 'insertUnorderedList', icon: ListBulletIcon, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListBulletIcon, label: 'Numbered List' },
    { command: 'justifyLeft', icon: Bars3Icon, label: 'Align Left' },
    { command: 'justifyCenter', icon: Bars3CenterLeftIcon, label: 'Align Center' },
    { command: 'justifyRight', icon: Bars3BottomRightIcon, label: 'Align Right' },
  ];

  return (
    <div className="flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
      {buttons.map(({ command, icon: Icon, label }) => (
        <button
          key={command}
          onClick={() => onFormat(command)}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isActive?.(command) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
      
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      
      <button
        onClick={() => {
          const url = prompt('Enter URL:');
          if (url) onFormat('createLink', url);
        }}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RichTextToolbar;
