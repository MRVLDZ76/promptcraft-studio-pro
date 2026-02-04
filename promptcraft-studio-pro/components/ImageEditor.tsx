
import React from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { Upload, Wand2, Download, AlertCircle, Settings } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [image, setImage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [quality, setQuality] = React.useState('2K');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setError(null);
    try {
      const edited = await editImageWithGemini(image, prompt);
      setResult(edited);
    } catch (err: any) {
      setError(err.message || 'Failed to edit image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Content - Wider */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 dark:bg-neutral-900 dark:border-neutral-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 dark:text-neutral-100">
              <Wand2 className="text-neutral-500 w-7 h-7" /> Nano Banana Image Editor
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Original</label>
                <div className="aspect-square bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center relative overflow-hidden dark:bg-neutral-800 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                  {image ? (
                    <img src={image} className="w-full h-full object-contain" alt="Upload preview" />
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="w-12 h-12 text-neutral-400 mb-3 mx-auto" />
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Click to upload image</span>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">Supports JPG, PNG, WebP</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Edited Result</label>
                <div className="aspect-square bg-neutral-50 rounded-xl border-2 border-neutral-300 flex flex-col items-center justify-center relative overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                  {result ? (
                    <img src={result} className="w-full h-full object-contain" alt="Result" />
                  ) : (
                    <div className="text-center p-6">
                      <Wand2 className="w-12 h-12 text-neutral-400 mb-3 mx-auto" />
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Edit will appear here</span>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center dark:bg-neutral-900/80 backdrop-blur-sm">
                      <div className="animate-spin w-12 h-12 border-4 border-neutral-300 border-t-neutral-700 rounded-full mb-3" />
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Applying edits...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3">Instructions</label>
                <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white p-4 text-base focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 transition-all"
                  placeholder="e.g., Change the background to a sunset beach, or make the cat wear sunglasses"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleEdit}
                  disabled={!image || !prompt || loading}
                  className="flex-1 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white py-4 px-6 rounded-xl font-semibold hover:from-neutral-600 hover:to-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-base shadow-lg"
                >
                  <Wand2 className="w-5 h-5" /> Apply Edit
                </button>
                {result && (
                  <a 
                    href={result} 
                    download="edited_image.png"
                    className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 p-4 rounded-xl text-neutral-700 dark:text-neutral-300 transition-all shadow-sm flex items-center justify-center"
                    title="Download"
                  >
                    <Download className="w-6 h-6" />
                  </a>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> 
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sidebar */}
      <div className="w-80 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-neutral-500" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Settings</h3>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['1:1', '16:9', '9:16', '4:3', '3:2', '3:4'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Image Quality */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Image Quality
            </label>
            <div className="space-y-2">
              {['1K', '2K', '4K'].map((qual) => (
                <button
                  key={qual}
                  onClick={() => setQuality(qual)}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-left ${
                    quality === qual
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {qual}
                  <span className="text-xs opacity-70 ml-2">
                    {qual === '1K' && '(1024x1024)'}
                    {qual === '2K' && '(2048x2048)'}
                    {qual === '4K' && '(4096x4096)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Info */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Model Target
            </label>
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">Universal</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">AI-powered image editing for all image types</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Quick Tips
            </label>
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <p className="flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                <span>Be specific about colors, styles, and locations</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                <span>Use natural language like "make it sunny" or "add glasses"</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                <span>Multiple edits can be combined in one instruction</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

