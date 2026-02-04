/**
 * BookEditorWorkspace - Visual Book Editor
 * 
 * Designrr-inspired workspace where users can see, customize, and perfect
 * their AI-generated books before publishing.
 * 
 * Week 5: Mobile Optimization
 * - Responsive breakpoints (768px tablet, 375px mobile)
 * - Bottom sheet for properties on mobile
 * - Hamburger menu for chapter navigation
 * - Touch-friendly controls (44px minimum)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  PhotoIcon,
  PaintBrushIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  Squares2X2Icon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { 
  Palette, 
  Upload, 
  Wand2, 
  Search, 
  Check, 
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus
} from 'lucide-react';
import { BookProject, Chapter, ContentBlock } from '../types';
import { getBookProject } from '../services/publishingService';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import { BOOK_TEMPLATES, getTemplateCSS, getTemplate } from '../templates';
import RichTextToolbar from './RichTextToolbar';
import ImageLibraryModal from './ImageLibraryModal';
import DraggableBlock from './DraggableBlock';
import AIImageGeneratorModal from './AIImageGeneratorModal';
import AdvancedFormatToolbar from './AdvancedFormatToolbar';
import LayoutControlsPanel from './LayoutControlsPanel';
import TemplateEditorModal from './TemplateEditorModal';
import ExportModal from './ExportModal';
import { BottomSheet } from '../../components/BottomSheet';
import { MobileMenu, MobileMenuButton } from '../../components/MobileMenu';
import { useDeviceType } from '../../utils/mobileConfig';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface BookEditorWorkspaceProps {
  bookId: number;
  onClose: () => void;
}

const BookEditorWorkspace: React.FC<BookEditorWorkspaceProps> = ({ bookId, onClose }) => {
  const [book, setBook] = useState<BookProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern-minimal');
  const [zoom, setZoom] = useState(100);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [customLayout, setCustomLayout] = useState({
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    columns: 1,
    columnGap: 20,
    dropCap: false,
    pageBreakBefore: false,
  });
  
  // Week 5: Mobile state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const { isMobile, isTablet } = useDeviceType();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Drag and drop sensors - increase activation distance on mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 5, // More forgiving on touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-save book changes
  const { saveStatus, lastSaved } = useAutoSave(bookId, book, {
    debounceMs: 1000,
  });

  // Load book data
  useEffect(() => {
    const loadBook = async () => {
      try {
        const data = await getBookProject(bookId);
        setBook(data);
        setChapters(data.chapters || []);
        if (data.chapters?.length > 0) {
          setSelectedChapter(data.chapters[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load book:', err);
        // Show user-friendly error
        alert(`Failed to load book: ${err.message || 'Unknown error'}`);
      }
    };

    loadBook();
  }, [bookId]);

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Apply template to book
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/publishing/books/${bookId}/apply_template/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ template_id: templateId })
      });
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  const handleExport = async (format: 'pdf' | 'epub' | 'html') => {
    setShowExportModal(true);
  };

  const handleLayoutChange = (property: string, value: any) => {
    setCustomLayout((prev) => ({
      ...prev,
      [property]: value,
    }));
  };

  const handleSaveCustomTemplate = async (template: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/publishing/custom-templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        alert('Template saved successfully!');
      } else {
        alert('Failed to save template');
      }
    } catch (err) {
      console.error('Failed to save template:', err);
      alert('Failed to save template');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('book', bookId.toString());

      const response = await fetch('/api/v1/publishing/media/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const asset = await response.json();
        console.log('Image uploaded:', asset);
        alert('Image uploaded successfully! Click "Search Library" to insert it.');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = async (asset: any) => {
    if (!selectedChapter) return;

    // Create new image block in chapter
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/publishing/chapters/${selectedChapter}/blocks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input_text: '',
          image_url: asset.file_url,
          image_prompt: asset.alt_text || asset.title,
          processing_mode: 'PRESERVE',
        })
      });

      if (response.ok) {
        // Reload chapter data
        const bookResponse = await fetch(`/api/v1/publishing/books/${bookId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (bookResponse.ok) {
          const data = await bookResponse.json();
          setChapters(data.chapters || []);
        }
      }
    } catch (err) {
      console.error('Failed to insert image:', err);
      alert('Failed to insert image');
    }
  };

  const handleGeneratedImage = async (imageUrl: string, prompt: string) => {
    if (!selectedChapter) return;

    // Create new image block with AI-generated image
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/publishing/chapters/${selectedChapter}/blocks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input_text: '',
          image_url: imageUrl,
          image_prompt: prompt,
          processing_mode: 'PRESERVE',
        })
      });

      if (response.ok) {
        // Reload chapter data
        const bookResponse = await fetch(`/api/v1/publishing/books/${bookId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (bookResponse.ok) {
          const data = await bookResponse.json();
          setChapters(data.chapters || []);
        }
      }
    } catch (err) {
      console.error('Failed to insert generated image:', err);
      alert('Failed to insert generated image');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !selectedChapter) return;

    const chapter = chapters.find(c => c.id === selectedChapter);
    if (!chapter) return;

    const oldIndex = chapter.blocks.findIndex(b => b.id.toString() === active.id);
    const newIndex = chapter.blocks.findIndex(b => b.id.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder blocks locally
    const newBlocks = arrayMove(chapter.blocks, oldIndex, newIndex);
    const updatedChapters = chapters.map(c =>
      c.id === selectedChapter ? { ...c, blocks: newBlocks } : c
    );
    setChapters(updatedChapters);

    // Update sequence_order on backend
    try {
      const token = localStorage.getItem('token');
      const updates = newBlocks.map((block: ContentBlock, index: number) => ({
        id: block.id,
        sequence_order: index,
      }));

      await fetch(`/api/v1/publishing/blocks/bulk_update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
    } catch (err) {
      console.error('Failed to update block order:', err);
      // Reload to get correct order
      const bookResponse = await fetch(`/api/v1/publishing/books/${bookId}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (bookResponse.ok) {
        const data = await bookResponse.json();
        setChapters(data.chapters || []);
      }
    }
  };

  const handleFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && view === 'edit') {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 200,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const saveBlockContent = async (blockId: number, content: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/publishing/blocks/${blockId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          processed_text: content
        })
      });
    } catch (err) {
      console.error('Failed to save block:', err);
    }
  };

  const renderChapterContent = (chapter: Chapter) => {
    if (!chapter.blocks || chapter.blocks.length === 0) {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {chapter.summary || 'No content available for this chapter.'}
          </p>
        </div>
      );
    }

    const blockItems = chapter.blocks.map(block => block.id.toString());

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockItems} strategy={verticalListSortingStrategy}>
          <div className="prose dark:prose-invert max-w-none space-y-6" onMouseUp={handleTextSelection}>
            {chapter.blocks.map((block: ContentBlock, index: number) => {
              if (block.image_url) {
                return (
                  <DraggableBlock key={block.id} id={block.id} isEditing={view === 'edit'}>
                    <div className="my-6 chapter-image">
                      <img
                        src={block.image_url}
                        alt={block.image_prompt || ''}
                        className="w-full rounded-lg shadow-lg"
                      />
                      {block.image_prompt && (
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2 italic">
                          {block.image_prompt}
                        </p>
                      )}
                    </div>
                  </DraggableBlock>
                );
              }

              return (
                <DraggableBlock key={block.id} id={block.id} isEditing={view === 'edit'}>
                  <div
                    contentEditable={view === 'edit'}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (view === 'edit') {
                        saveBlockContent(block.id, e.currentTarget.innerHTML);
                      }
                    }}
                    onFocus={() => setEditingBlockId(block.id)}
                    className={`text-gray-800 dark:text-gray-200 leading-relaxed ${
                      view === 'edit' ? 'outline-none focus:ring-2 focus:ring-purple-500 focus:bg-purple-50 dark:focus:bg-purple-900/10 rounded-lg p-2 -mx-2 cursor-text' : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: block.processed_text || block.input_text || '' }}
                  />
                </DraggableBlock>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  // Early return if book not loaded
  if (!book) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  const currentTemplate = getTemplate(selectedTemplate);
  const templateCSS = currentTemplate ? getTemplateCSS(currentTemplate, customLayout) : '';

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {book?.title || 'Book'}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">Visual Editor</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('edit')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'edit'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setView('preview')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'preview'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Save Status */}
          <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chapters Navigator */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">
              Chapters
            </h2>
            <div className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedChapter === chapter.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {chapter.chapter_number}. {chapter.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {chapter.word_count || 0} words
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button className="w-full mt-4 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-colors">
              + Add Chapter
            </button>
          </div>
        </div>

        {/* Center - Live Preview Canvas */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto p-8" ref={editorRef}>
          <style>{templateCSS}</style>
          
          {/* Rich Text Toolbar */}
          {showToolbar && view === 'edit' && (
            <div
              className="fixed z-10"
              style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
            >
              <RichTextToolbar
                onFormat={handleFormatText}
                isActive={(command) => document.queryCommandState(command)}
              />
            </div>
          )}
          
          <div
            className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl book-preview"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div className="p-12">
              {selectedChapter && (
                <div>
                  {/* Chapter Title */}
                  <div className="mb-8">
                    <div className="chapter-number">
                      Chapter {chapters.find(c => c.id === selectedChapter)?.chapter_number}
                    </div>
                    <h1 className="text-4xl font-bold mb-4">
                      {chapters.find(c => c.id === selectedChapter)?.title}
                    </h1>
                    {chapters.find(c => c.id === selectedChapter)?.subtitle && (
                      <h2 className="text-2xl font-semibold mb-6 text-gray-600 dark:text-gray-400">
                        {chapters.find(c => c.id === selectedChapter)?.subtitle}
                      </h2>
                    )}
                  </div>

                  {/* Chapter Content */}
                  {renderChapterContent(chapters.find(c => c.id === selectedChapter)!)}

                  {/* Image Drop Zone - Only in Edit mode */}
                  {view === 'edit' && (
                    <div className="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{uploading ? 'Uploading...' : 'Drop image here or click to upload'}</p>
                      <p className="text-xs mt-2">Or use "Search Library" to insert existing images</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Template Selector */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Squares2X2Icon className="w-4 h-4" />
                <span>Template</span>
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {BOOK_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowTemplateEditor(true)}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <Palette className="w-4 h-4" />
              <span>Customize Template</span>
            </button>

            {/* Layout Controls */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <DocumentTextIcon className="w-4 h-4" />
                <span>Layout Controls</span>
              </label>
              <LayoutControlsPanel
                onLayoutChange={handleLayoutChange}
                currentLayout={customLayout}
              />
            </div>

            {/* Typography Controls */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <DocumentTextIcon className="w-4 h-4" />
                <span>Typography</span>
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Heading Font
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm">
                    <option>Playfair Display</option>
                    <option>Merriweather</option>
                    <option>Lora</option>
                    <option>Roboto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Body Font
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm">
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Open Sans</option>
                    <option>Inter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <PaintBrushIcon className="w-4 h-4" />
                <span>Colors</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#1f2937', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Image Tools */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <PhotoIcon className="w-4 h-4" />
                <span>Images</span>
              </label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                </button>
                <button 
                  onClick={() => setShowAIGenerator(true)}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Generate with AI</span>
                </button>
                <button 
                  onClick={() => setShowImageLibrary(true)}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Library</span>
                </button>
              </div>
            </div>

            {/* Advanced Formatting */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <PaintBrushIcon className="w-4 h-4" />
                <span>Advanced Formatting</span>
              </label>
              <button
                onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {showAdvancedToolbar && <Check className="w-4 h-4" />}
                <span>{showAdvancedToolbar ? 'Toolbar Active' : 'Show Formatting Toolbar'}</span>
              </button>
              {showAdvancedToolbar && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select text to see advanced formatting options
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Rich Text Toolbar */}
      {showToolbar && view === 'edit' && (
        <div
          style={{
            position: 'fixed',
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            zIndex: 10,
          }}
        >
          <RichTextToolbar
            onFormat={handleFormatText}
            isActive={(cmd) => document.queryCommandState(cmd)}
          />
        </div>
      )}

      {/* Advanced Format Toolbar */}
      {showAdvancedToolbar && view === 'edit' && showToolbar && (
        <div
          style={{
            position: 'fixed',
            top: `${toolbarPosition.top + 60}px`,
            left: `${toolbarPosition.left}px`,
            zIndex: 10,
          }}
        >
          <AdvancedFormatToolbar
            onFormat={handleFormatText}
            isActive={(cmd) => document.queryCommandState(cmd)}
          />
        </div>
      )}
      
      {/* Image Library Modal */}
      <ImageLibraryModal
        isOpen={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        onSelectImage={handleSelectImage}
        bookId={bookId}
      />

      {/* AI Image Generator Modal */}
      <AIImageGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerated={handleGeneratedImage}
        bookId={bookId}
      />

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
        template={getTemplate(selectedTemplate)!}
        onSave={handleSaveCustomTemplate}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        bookId={bookId}
        bookTitle={book?.title || 'Book'}
      />
    </div>
  );
};

export default BookEditorWorkspace;
