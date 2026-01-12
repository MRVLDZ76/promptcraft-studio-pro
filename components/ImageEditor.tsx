
import React from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { Upload, Wand2, Download, AlertCircle } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [image, setImage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-slate-100">
          <Wand2 className="text-indigo-500" /> Nano Banana Image Editor
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Original</label>
            <div className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              {image ? (
                <img src={image} className="w-full h-full object-contain" alt="Upload preview" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-400">Click to upload image</span>
                </>
              )}
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Edited Result</label>
            <div className="aspect-square bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              {result ? (
                <img src={result} className="w-full h-full object-contain" alt="Result" />
              ) : (
                <span className="text-xs text-slate-400">Edit will appear here</span>
              )}
              {loading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center dark:bg-slate-900/60">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instructions</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              placeholder="e.g., Change the background to a sunset beach, or make the cat wear sunglasses"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleEdit}
              disabled={!image || !prompt || loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" /> Apply Edit
            </button>
            {result && (
              <a 
                href={result} 
                download="edited_image.png"
                className="bg-slate-100 p-3 rounded-lg text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
