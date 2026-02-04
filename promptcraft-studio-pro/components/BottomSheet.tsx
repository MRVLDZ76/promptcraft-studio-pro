/**
 * Mobile Bottom Sheet Component
 * Slide-up panel for properties/settings on mobile devices
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Heights in vh: [collapsed, peek, expanded]
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [10, 40, 80],
}) => {
  const [currentSnap, setCurrentSnap] = useState(1); // Start at peek
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const height = snapPoints[currentSnap];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50; // Minimum drag distance to snap

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentSnap > 0) {
        // Dragging down - collapse
        setCurrentSnap(currentSnap - 1);
      } else if (deltaY < 0 && currentSnap < snapPoints.length - 1) {
        // Dragging up - expand
        setCurrentSnap(currentSnap + 1);
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const toggleExpanded = () => {
    if (currentSnap === snapPoints.length - 1) {
      setCurrentSnap(0); // Collapse
      setTimeout(onClose, 300); // Close after animation
    } else {
      setCurrentSnap(snapPoints.length - 1); // Fully expand
    }
  };

  if (!isOpen && currentSnap === 0) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && currentSnap > 0 && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 transition-all duration-300 md:hidden"
        style={{
          height: `${height}vh`,
          transform: isDragging ? `translateY(${currentY - startY}px)` : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={toggleExpanded}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {currentSnap === snapPoints.length - 1 ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
};
