/**
 * DraggableBlock - Wrapper for drag-and-drop content blocks
 * Uses @dnd-kit for smooth reordering
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface DraggableBlockProps {
  id: number;
  children: React.ReactNode;
  isEditing: boolean;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ id, children, isEditing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <Bars3Icon className="w-5 h-5 text-gray-400 hover:text-purple-600" />
        </div>
      )}
      {children}
    </div>
  );
};

export default DraggableBlock;
