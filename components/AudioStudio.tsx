
import React from 'react';
import { generateSpeech } from '../services/geminiService';
import { Volume2, Play, Loader2, Download, AlertCircle } from 'lucide-react';

export const AudioStudio: React.FC = () => {
  const [text, setText] = React.useState('');
  const [voice, setVoice] = React.useState('Zephyr');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

  const decodeAudio = async (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Raw PCM data needs wrapping for simple <audio> tag playback or using Web Audio API
    // For simplicity, we'll use Web Audio API to play it
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    // Convert AudioBuffer to Wav for download/playback
    const wavBlob = audioBufferToWav(buffer);
    return URL.createObjectURL(wavBlob);
  };

  // Helper to convert AudioBuffer to Wav Blob
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i));
    };

    writeString('RIFF');
    view.setUint32(pos, length - 8, true); pos += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(pos, 16, true); pos += 4;
    view.setUint16(pos, 1, true); pos += 2;
    view.setUint16(pos, 1, true); pos += 2;
    view.setUint32(pos, buffer.sampleRate, true); pos += 4;
    view.setUint32(pos, buffer.sampleRate * 2, true); pos += 4;
    view.setUint16(pos, 2, true); pos += 2;
    view.setUint16(pos, 16, true); pos += 2;
    writeString('data');
    view.setUint32(pos, length - pos - 4, true); pos += 4;

    const channel = buffer.getChannelData(0);
    while (pos < length) {
      let sample = Math.max(-1, Math.min(1, channel[offset++]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await generateSpeech(text, voice);
      const url = await decodeAudio(base64);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to generate audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-slate-100">
          <Volume2 className="text-indigo-500" /> AI Speech Studio (TTS)
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Text to Speak</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-40 rounded-lg border-slate-200 bg-slate-50 p-4 text-base focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              placeholder="Enter text here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Voice</label>
              <select
                value={voice}
                onChange={e => setVoice(e.target.value)}
                className="w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !text}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Generate Audio
              </button>
            </div>
          </div>

          {audioUrl && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
              <audio src={audioUrl} controls className="h-10" />
              <a href={audioUrl} download="speech.wav" className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                <Download className="w-5 h-5" />
              </a>
            </div>
          )}

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
