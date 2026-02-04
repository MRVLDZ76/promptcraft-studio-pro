
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
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 dark:bg-neutral-900 dark:border-neutral-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-neutral-100">
          <Wand2 className="text-neutral-500" /> Nano Banana Image Editor
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase">Original</label>
            <div className="aspect-square bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center relative overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
              {image ? (
                <img src={image} className="w-full h-full object-contain" alt="Upload preview" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-neutral-300 mb-2" />
                  <span className="text-xs text-neutral-400">Click to upload image</span>
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
            <label className="text-xs font-bold text-neutral-400 uppercase">Edited Result</label>
            <div className="aspect-square bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col items-center justify-center relative overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
              {result ? (
                <img src={result} className="w-full h-full object-contain" alt="Result" />
              ) : (
                <span className="text-xs text-neutral-400">Edit will appear here</span>
              )}
              {loading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center dark:bg-neutral-900/60">
                  <div className="animate-spin w-8 h-8 border-4 border-neutral-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Instructions</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full rounded-lg border-neutral-200 bg-neutral-50 p-3 text-sm focus:ring-neutral-500 focus:border-neutral-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
              placeholder="e.g., Change the background to a sunset beach, or make the cat wear sunglasses"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleEdit}
              disabled={!image || !prompt || loading}
              className="flex-1 bg-neutral-700 text-white py-3 rounded-lg font-medium hover:bg-neutral-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" /> Apply Edit
            </button>
            {result && (
              <a 
                href={result} 
                download="edited_image.png"
                className="bg-neutral-100 p-3 rounded-lg text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
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
