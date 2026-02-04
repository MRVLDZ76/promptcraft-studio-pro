
import React from 'react';
import { transcribeAudio } from '../services/geminiService';
import { Mic, Square, Loader2, AlertCircle, Copy, CheckCircle2, Upload, Link as LinkIcon, FileAudio, FileVideo } from 'lucide-react';

type Tab = 'record' | 'upload' | 'link';

export const TranscriptionStudio: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('record');
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copying, setCopying] = React.useState(false);
  const [ytUrl, setYtUrl] = React.useState('');
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Microphone access denied or error occurred.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    await handleTranscription(file);
  };

  const handleTranscription = async (blob: Blob | File) => {
    setLoading(true);
    setTranscription('');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = blob.type || 'audio/webm';
        const result = await transcribeAudio(base64Data, mimeType);
        setTranscription(result);
      };
    } catch (err: any) {
      setError(err.message || "Failed to transcribe media.");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!ytUrl.trim()) return;
    setError("Direct YouTube URL processing requires a backend proxy to fetch media. Please download the file and use the 'Upload' tab for reliable local processing.");
  };

  const handleCopy = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 dark:bg-neutral-900 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-neutral-100">
            <Mic className="text-neutral-500" /> AI Media Transcription
          </h2>
          <div className="flex bg-neutral-100 p-1 rounded-lg dark:bg-neutral-800">
            {(['record', 'upload', 'link'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-neutral-600 shadow-sm dark:bg-neutral-700 dark:text-neutral-400' 
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'record' && (
          <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 mb-6 transition-all">
            <div className="relative mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-neutral-700 hover:bg-neutral-600'
                } text-white`}
              >
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
              </button>
              {isRecording && (
                 <div className="absolute -inset-2 border-2 border-red-500 rounded-full animate-ping opacity-20" />
              )}
            </div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {isRecording ? "Recording... Click to stop and transcribe." : "Click microphone to start recording."}
            </p>
          </div>
        )}

        {activeTab === 'upload' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 mb-6 cursor-pointer hover:border-neutral-400 transition-all group"
          >
            <div className="flex gap-4 mb-4">
              <FileAudio className="w-10 h-10 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
              <FileVideo className="w-10 h-10 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Drag & drop or <span className="text-neutral-600 font-bold">browse</span> audio/video files
            </p>
            <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-widest font-bold">Supports MP3, WAV, MP4, WEBM</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="audio/*,video/*" 
              onChange={handleFileUpload}
            />
          </div>
        )}

        {activeTab === 'link' && (
          <div className="p-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 mb-6">
            <div className="max-w-md mx-auto space-y-4">
              <label className="block text-xs font-bold text-neutral-500 uppercase">Paste Video Link</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm focus:ring-2 focus:ring-neutral-500 outline-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                  />
                </div>
                <button 
                  onClick={handleUrlSubmit}
                  className="bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-600 transition-colors"
                >
                  Analyze
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed italic">
                Note: Browser-based transcription of external URLs may be limited by CORS. Local file upload is recommended for full reliability.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Transcription Result</label>
            {transcription && (
              <button 
                onClick={handleCopy}
                className="text-xs flex items-center gap-1.5 text-neutral-600 font-semibold hover:underline"
              >
                {copying ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copying ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className={`min-h-[200px] w-full p-5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm leading-relaxed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 ${loading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing media with Gemini...</span>
                </div>
              ) : transcription ? (
                transcription
              ) : (
                <span className="text-neutral-400 italic">No output yet. Input media to start.</span>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm mt-4 p-4 bg-red-50 rounded-lg dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> 
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
