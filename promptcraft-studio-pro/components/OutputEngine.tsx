
import React from 'react';
import { PromptState, QAIssue } from '../types';
import { generateImagePro } from '../services/geminiService';
import { Copy, RotateCcw, RotateCw, Wand2, CheckCircle2, AlertTriangle, Info, Hammer, Image as ImageIcon, Loader2, Download } from 'lucide-react';

interface Props {
  prompt: string;
  state: PromptState;
  onPolish: () => Promise<void>;
  loading: boolean;
  issues: QAIssue[];
  onApplyFixes: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const OutputEngine: React.FC<Props> = ({ 
  prompt, state, onPolish, loading, issues, onApplyFixes, onUndo, onRedo, canUndo, canRedo 
}) => {
  const [copying, setCopying] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleGenerateImage = async () => {
    setGenerating(true);
    setError(null);
    try {
      const img = await generateImagePro(prompt, state.imageSize, state.aspect);
      setGeneratedImage(img);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setGenerating(false);
    }
  };

  const score = Math.max(0, 100 - issues.reduce((acc, it) => acc + (it.severity === 'warn' ? 15 : 5), 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden group dark:bg-neutral-900 dark:border-neutral-800">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2 flex justify-between items-center dark:bg-neutral-800 dark:border-neutral-700">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Final Prompt</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400 mr-2">{prompt.length} chars</span>
            <div className="flex items-center bg-neutral-100 rounded-md p-0.5 dark:bg-neutral-700/50">
              <button 
                onClick={onUndo} 
                disabled={!canUndo} 
                title="Undo"
                className={`p-1.5 rounded-md transition-all ${
                  canUndo 
                    ? 'text-neutral-600 hover:text-neutral-600 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-600' 
                    : 'text-neutral-300 cursor-not-allowed dark:text-neutral-600'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo} 
                title="Redo"
                className={`p-1.5 rounded-md transition-all ${
                  canRedo 
                    ? 'text-neutral-600 hover:text-neutral-600 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-600' 
                    : 'text-neutral-300 cursor-not-allowed dark:text-neutral-600'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={handleCopy} className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors ml-1">
              {copying ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <textarea 
          readOnly 
          style={{ height: '28rem' }}
          value={prompt}
          className="w-full h-56 p-5 text-sm text-neutral-700 font-mono resize-none focus:outline-none bg-transparent dark:text-neutral-300" 
        />
        
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onPolish}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 px-4 rounded-lg font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <Wand2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Polish</span>
        </button>

        <button 
          onClick={handleGenerateImage}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span>Generate {state.imageSize} Image</span>
        </button>
      </div>

      {generatedImage && (
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-4 dark:bg-neutral-900 dark:border-neutral-800">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Result</h3>
             <a href={generatedImage} download="generated_image.png" className="p-1.5 text-neutral-400 hover:text-neutral-600">
                <Download className="w-4 h-4" />
             </a>
           </div>
           <div className="relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img src={generatedImage} alt="Generated" className="w-full h-auto object-contain max-h-[600px]" />
           </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-900/30">
          <AlertTriangle className="w-4 h-4 inline mr-2" /> {error}
        </div>
      )}

      {/* Prompt QA */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2 flex justify-between items-center dark:bg-neutral-800 dark:border-neutral-700">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Prompt QA</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold ${score > 80 ? 'text-green-500' : 'text-yellow-500'}`}>Score: {score}</span>
            <button onClick={onApplyFixes} className="text-[10px] bg-white border border-neutral-200 px-2 py-1 rounded shadow-sm hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">
              <Hammer className="w-3 h-3 inline mr-1" /> Quick Fix
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {issues.length === 0 ? (
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Prompt is clean and optimized.</span>
            </div>
          ) : (
            issues.map((it, i) => (
              <div key={i} className="flex gap-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                {it.severity === 'warn' ? <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{it.title}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{it.detail}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
