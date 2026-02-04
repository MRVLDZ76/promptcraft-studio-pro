
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-10 shadow-sm relative overflow-hidden min-h-[600px]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-purple-600 opacity-40" />
        
        <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-neutral-900 dark:text-white uppercase tracking-tighter">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <Volume2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          AI Speech Studio
        </h2>

        <div className="space-y-8">
          <div>
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3 block">Text to Speak</label>
            <textarea
              value={text}
              style={{ height: '28rem' }}
              onChange={e => setText(e.target.value)}
              className="w-full h-56 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 text-lg text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter your text here to convert to speech..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3 block">Voice Selection</label>
              <select
                value={voice}
                onChange={e => setVoice(e.target.value)}
                className="w-full text-base bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !text}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin ml-2" /> : <Play className="w-6 h-6 ml-2" />}
                Generate Audio &nbsp;&nbsp;
              </button>
            </div>
          </div>

          {audioUrl && (
            <div className="mt-10 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <audio src={audioUrl} controls className="h-12 flex-1" />
              <a href={audioUrl} download="speech.wav" className="p-3 ml-4 text-neutral-600 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors bg-white dark:bg-neutral-700 rounded-lg">
                <Download className="w-6 h-6" />
              </a>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-base mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
