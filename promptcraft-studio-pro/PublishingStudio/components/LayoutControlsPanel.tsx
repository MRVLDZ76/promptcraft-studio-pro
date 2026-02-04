/**
 * LayoutControlsPanel - Advanced layout customization
 * Margins, columns, text-wrap, drop caps, page breaks
 */

import React, { useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface LayoutControlsPanelProps {
  onLayoutChange: (property: string, value: any) => void;
  currentLayout: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    columns: number;
    columnGap: number;
    dropCap: boolean;
    pageBreakBefore: boolean;
  };
}

const LayoutControlsPanel: React.FC<LayoutControlsPanelProps> = ({
  onLayoutChange,
  currentLayout,
}) => {
  const [showMargins, setShowMargins] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  return (
    <div className="space-y-4">
      {/* Margins Section */}
      <div>
        <button
          onClick={() => setShowMargins(!showMargins)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Custom Margins</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${showMargins ? 'rotate-180' : ''}`}
          />
        </button>

        {showMargins && (
          <div className="space-y-3 ml-6">
            {/* Top Margin */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Top: {currentLayout.marginTop}mm
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={currentLayout.marginTop}
                onChange={(e) => onLayoutChange('marginTop', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Right Margin */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Right: {currentLayout.marginRight}mm
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={currentLayout.marginRight}
                onChange={(e) => onLayoutChange('marginRight', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Bottom Margin */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Bottom: {currentLayout.marginBottom}mm
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={currentLayout.marginBottom}
                onChange={(e) => onLayoutChange('marginBottom', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Left Margin */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Left: {currentLayout.marginLeft}mm
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={currentLayout.marginLeft}
                onChange={(e) => onLayoutChange('marginLeft', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Column Layout Section */}
      <div>
        <button
          onClick={() => setShowColumns(!showColumns)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          <div className="flex items-center space-x-2">
            <Squares2X2Icon className="w-4 h-4" />
            <span>Column Layout</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${showColumns ? 'rotate-180' : ''}`}
          />
        </button>

        {showColumns && (
          <div className="space-y-3 ml-6">
            {/* Column Count */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                Columns
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => onLayoutChange('columns', count)}
                    className={`px-3 py-2 rounded text-sm ${
                      currentLayout.columns === count
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Gap */}
            {currentLayout.columns > 1 && (
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Gap: {currentLayout.columnGap}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={currentLayout.columnGap}
                  onChange={(e) => onLayoutChange('columnGap', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Typography Effects */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Typography Effects
        </label>
        <div className="space-y-2 ml-6">
          {/* Drop Cap */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.dropCap}
              onChange={(e) => onLayoutChange('dropCap', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Drop Cap (first letter)
            </span>
          </label>
        </div>
      </div>

      {/* Page Breaks */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Page Control
        </label>
        <div className="space-y-2 ml-6">
          {/* Page Break Before */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.pageBreakBefore}
              onChange={(e) => onLayoutChange('pageBreakBefore', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page break before chapter
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LayoutControlsPanel;
