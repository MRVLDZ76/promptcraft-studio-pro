/**
 * TemplateEditorModal - Customize and create custom templates
 * Edit fonts, colors, layouts, save custom templates
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { BookTemplate } from '../templates';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: BookTemplate;
  onSave: (template: BookTemplate) => void;
}

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template: initialTemplate,
  onSave,
}) => {
  const [template, setTemplate] = useState<BookTemplate>(initialTemplate);
  const [activeTab, setActiveTab] = useState<'fonts' | 'colors' | 'layout'>('fonts');

  const updateFont = (key: 'heading' | 'body' | 'accent', value: string) => {
    setTemplate({
      ...template,
      fonts: { ...template.fonts, [key]: value },
    });
  };

  const updateColor = (key: keyof typeof template.colors, value: string) => {
    setTemplate({
      ...template,
      colors: { ...template.colors, [key]: value },
    });
  };

  const updateLayout = (key: string, value: any) => {
    if (key in template.layout.margins) {
      setTemplate({
        ...template,
        layout: {
          ...template.layout,
          margins: { ...template.layout.margins, [key]: value },
        },
      });
    } else {
      setTemplate({
        ...template,
        layout: { ...template.layout, [key]: value },
      });
    }
  };

  const handleSave = () => {
    onSave(template);
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${template.id}-template.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        setTemplate(importedTemplate);
      } catch (err) {
        alert('Failed to import template. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customize Template: {template.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {(['fonts', 'colors', 'layout'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className="space-y-6">
              {activeTab === 'fonts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Heading Font
                    </label>
                    <input
                      type="text"
                      value={template.fonts.heading}
                      onChange={(e) => updateFont('heading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Playfair Display"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Body Font
                    </label>
                    <input
                      type="text"
                      value={template.fonts.body}
                      onChange={(e) => updateFont('body', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Georgia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Accent Font
                    </label>
                    <input
                      type="text"
                      value={template.fonts.accent}
                      onChange={(e) => updateFont('accent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Lato"
                    />
                  </div>
                </>
              )}

              {activeTab === 'colors' && (
                <>
                  {Object.entries(template.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => updateColor(key as keyof typeof template.colors, e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateColor(key as keyof typeof template.colors, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'layout' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Page Width: {template.layout.pageWidth}
                    </label>
                    <input
                      type="text"
                      value={template.layout.pageWidth}
                      onChange={(e) => updateLayout('pageWidth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Line Height: {template.layout.lineHeight}
                    </label>
                    <input
                      type="range"
                      min="1.2"
                      max="2.5"
                      step="0.1"
                      value={template.layout.lineHeight}
                      onChange={(e) => updateLayout('lineHeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paragraph Spacing: {template.layout.paragraphSpacing}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.25"
                      value={template.layout.paragraphSpacing}
                      onChange={(e) => updateLayout('paragraphSpacing', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  {Object.entries(template.layout.margins).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        Margin {key}: {value}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateLayout(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Preview Panel */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Live Preview</h3>
              <div
                className="bg-white dark:bg-gray-800 rounded p-4 shadow-inner"
                style={{
                  fontFamily: template.fonts.body,
                  color: template.colors.text,
                  lineHeight: template.layout.lineHeight,
                }}
              >
                <h1
                  style={{
                    fontFamily: template.fonts.heading,
                    color: template.colors.primary,
                    marginBottom: '1rem',
                  }}
                >
                  Chapter Title
                </h1>
                <p style={{ marginBottom: `${template.layout.paragraphSpacing}rem` }}>
                  This is a preview of how your template will look. The heading uses {template.fonts.heading}, while
                  the body text uses {template.fonts.body}.
                </p>
                <p style={{ color: template.colors.secondary }}>
                  Secondary color text example.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
            <label className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer">
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2"
            >
              <CheckIcon className="w-5 h-5" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
