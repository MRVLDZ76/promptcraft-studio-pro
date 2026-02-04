/**
 * AdvancedFormatToolbar - Additional formatting controls
 * Headings, font sizes, colors, and text alignment
 */

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  PaintBrushIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

interface AdvancedFormatToolbarProps {
  onFormat: (command: string, value?: string) => void;
  isActive?: (command: string) => boolean;
}

const AdvancedFormatToolbar: React.FC<AdvancedFormatToolbarProps> = ({ onFormat, isActive }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const colors = [
    '#000000', '#dc2626', '#ea580c', '#f59e0b', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  ];

  const fontSizes = [
    { label: 'Normal', value: '3' },
    { label: 'Large', value: '5' },
    { label: 'Huge', value: '7' },
  ];

  return (
    <div className="flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
      {/* Heading Selector */}
      <div className="relative">
        <select
          onChange={(e) => onFormat('formatBlock', e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Font Size */}
      <select
        onChange={(e) => onFormat('fontSize', e.target.value)}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
      >
        <option value="3">Normal</option>
        <option value="4">Medium</option>
        <option value="5">Large</option>
        <option value="6">XLarge</option>
        <option value="7">Huge</option>
      </select>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Text Color"
        >
          <PaintBrushIcon className="w-4 h-4" />
        </button>
        {showColorPicker && (
          <div className="absolute top-full mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-10">
            <div className="grid grid-cols-5 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onFormat('foreColor', color);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <button
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Highlight"
        >
          <SwatchIcon className="w-4 h-4" />
        </button>
        {showHighlightPicker && (
          <div className="absolute top-full mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-10">
            <div className="grid grid-cols-5 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onFormat('hiliteColor', color);
                    setShowHighlightPicker(false);
                  }}
                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Remove Formatting */}
      <button
        onClick={() => onFormat('removeFormat')}
        className="px-3 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Clear Formatting"
      >
        Clear
      </button>
    </div>
  );
};

export default AdvancedFormatToolbar;
