import React, { useState, useRef } from 'react';
import { ProjectData, Scene, ProductionMode } from '../types';
import { generateVeoVideo } from '../services/geminiService';
import { generateVideo, remixVideo, getAvailableProviders } from '../services/multiProviderVideoService';
import { VideoProvider, VideoGenerationConfig, getDefaultConfig, PROVIDER_CONFIG, supportsRemix } from '../types/videoProviders';
import { 
  analyzeSceneDuration, 
  generateComplexScene, 
  optimizeSceneBoundaries,
  isContinuationScene 
} from '../services/intelligentSceneGenerator';
import { saveVideoAsset } from '../services/assetService';
import RenderModal from './RenderModal';
import SocialMediaUploadPanel from './SocialMediaUploadPanel';
import { 
  PlayIcon, 
  ArrowPathIcon, 
  ExclamationCircleIcon, 
  VideoCameraIcon, 
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  FilmIcon,
  XMarkIcon,
  ArchiveBoxArrowDownIcon,
  CheckCircleIcon,
  ArrowRightStartOnRectangleIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  LightBulbIcon,
  ShareIcon
} from '@heroicons/react/24/solid';
// @ts-ignore - ESM CDN imports work in Vite
import JSZip from 'https://esm.sh/jszip@3.10.1';
// @ts-ignore - ESM CDN imports work in Vite
import saveAs from 'https://esm.sh/file-saver@2.0.5';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onReset: () => void;
  onGoBack?: () => void;
}

type ExportType = 'INDIVIDUAL' | 'SEQUENCE' | 'SINGLE_FILE';
type Quality = 'LOW' | 'MEDIUM' | 'HIGH';

const VideoProduction: React.FC<Props> = ({ projectData, updateProject, onReset, onGoBack }) => {
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportQuality, setExportQuality] = useState<Quality>('HIGH');
  const [exportType, setExportType] = useState<ExportType>('SEQUENCE');  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string; isSafetyError: boolean }>({ show: false, message: '', isSafetyError: false });
  const [batchRendering, setBatchRendering] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider>('veo');
  const [videoConfig, setVideoConfig] = useState<VideoGenerationConfig>(getDefaultConfig('veo'));
  const [availableProviders, setAvailableProviders] = useState<VideoProvider[]>([]);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [sceneOptimizations, setSceneOptimizations] = useState<any[]>([]);
  const [generationPlan, setGenerationPlan] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const isExternal = projectData.mode === ProductionMode.EXTERNAL;

  // Load available providers on mount
  React.useEffect(() => {
    const providers = getAvailableProviders();
    setAvailableProviders(providers);
    if (providers.length > 0 && !providers.includes(selectedProvider)) {
      setSelectedProvider(providers[0]);
      setVideoConfig(getDefaultConfig(providers[0]));
    }
  }, []);

  // Analyze scenes for optimization opportunities
  React.useEffect(() => {
    if (projectData.storyboard.length > 1) {
      const optimizations = optimizeSceneBoundaries(projectData.storyboard);
      setSceneOptimizations(optimizations);
    }
  }, [projectData.storyboard]);

  const handleGenerateScene = async (scene: Scene) => {
    setGeneratingSceneId(scene.id);
    setGenerationProgress('');
    setGenerationPlan(null);
    
    // Build enhanced prompt with character descriptions for consistency
    let refImage = undefined;
    let enhancedPrompt = scene.visualPrompt;
    
    if (scene.characterIds.length > 0) {
      const sceneCharacters = scene.characterIds
        .map(id => projectData.characters.find(c => c.id === id))
        .filter(c => c !== undefined);
      
      // Add character visual descriptions to prompt for consistency
      if (sceneCharacters.length > 0) {
        const charDescriptions = sceneCharacters
          .map(c => `${c!.name}: ${c!.visualDescription}`)
          .join('; ');
        enhancedPrompt = `${scene.visualPrompt}\n\nCHARACTER DETAILS (maintain consistency): ${charDescriptions}`;
      }
      
      // Use first character's reference image
      const mainChar = sceneCharacters[0];
      if (mainChar && mainChar.referenceImageUrl) {
        refImage = mainChar.referenceImageUrl;
      }
    }

    try {
      updateSceneStatus(scene.id, 'generating');
      
      // Analyze duration requirements
      const plan = analyzeSceneDuration(
        scene.durationSeconds,
        selectedProvider,
        projectData.storyboard[scene.number] // next scene for continuity check
      );
      
      setGenerationPlan(plan);
      
      // Use complex generation for multi-segment scenes
      if (plan.method !== 'single') {
        console.log(`Using ${plan.method} method for ${scene.durationSeconds}s scene`);
        
        const result = await generateComplexScene(
          scene,
          selectedProvider,
          videoConfig,
          refImage,
          (progress) => setGenerationProgress(progress)
        );
        
        const updatedStoryboard = projectData.storyboard.map(s =>
          s.id === scene.id ? {
            ...s,
            status: 'completed',
            videoUrl: result.videoUrl,
            videoId: result.videoId,
            provider: selectedProvider
          } as Scene : s
        );
        updateProject({ storyboard: updatedStoryboard });
        
        // Save video asset
        saveVideoAsset(scene.number, result.videoUrl, scene.durationSeconds, projectData.id).then(asset => {
          if (asset) {
            console.log(`Complex scene asset saved (${plan.method}):`, asset.id);
          }
        }).catch(err => {
          console.warn('Failed to save video asset:', err);
        });
      } else {
        // Simple single generation
        const result = await generateVideo(enhancedPrompt, videoConfig, refImage);
        
        const updatedStoryboard = projectData.storyboard.map(s => 
          s.id === scene.id ? { 
            ...s, 
            status: 'completed', 
            videoUrl: result.videoUrl,
            videoId: result.videoId,
            provider: result.provider
          } as Scene : s
        );
        updateProject({ storyboard: updatedStoryboard });
        
        // Save video asset to backend
        saveVideoAsset(scene.number, result.videoUrl, scene.durationSeconds, projectData.id).then(asset => {
          if (asset) {
            console.log(`Video asset saved to backend (${result.provider}):`, asset.id);
          }
        }).catch(err => {
          console.warn('Failed to save video asset to backend:', err);
        });
      }
    } catch (e: any) {
      console.error('Video generation error:', e);
      updateSceneStatus(scene.id, 'failed');
      
      // Check if it's a safety filter error
      const isSafetyError = e.message?.includes('VEO_SAFETY_FILTER');
      const errorMessage = e.message || 'Video generation failed. Please try again.';
      
      setErrorModal({
        show: true,
        message: errorMessage,
        isSafetyError: isSafetyError
      });
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const updateSceneStatus = (id: string, status: Scene['status']) => {
    const updated = projectData.storyboard.map(s => s.id === id ? { ...s, status } : s);
    updateProject({ storyboard: updated });
  };

  const markSceneCopied = (id: string) => {
    const updated = projectData.storyboard.map(s => s.id === id ? { ...s, copied: true } : s);
    updateProject({ storyboard: updated });
  };

  const copyPrompt = (text: string, sceneId: string) => {
    navigator.clipboard.writeText(text);
    if (isExternal) {
      markSceneCopied(sceneId);
    }
  };

  const handleRemixVideo = async (scene: Scene, newPrompt: string) => {
    if (!scene.videoId || !scene.provider) {
      alert('This video cannot be remixed. Only Sora-generated videos support remix.');
      return;
    }

    if (!supportsRemix(scene.provider as VideoProvider)) {
      alert(`${PROVIDER_CONFIG[scene.provider as VideoProvider].name} does not support remix.`);
      return;
    }

    setGeneratingSceneId(scene.id);
    try {
      updateSceneStatus(scene.id, 'generating');
      const result = await remixVideo({
        videoId: scene.videoId,
        newPrompt: newPrompt,
        provider: scene.provider as VideoProvider
      });

      const updatedStoryboard = projectData.storyboard.map(s =>
        s.id === scene.id ? {
          ...s,
          status: 'completed',
          videoUrl: result.videoUrl,
          videoId: result.videoId,
          visualPrompt: newPrompt // Update prompt to reflect remix
        } as Scene : s
      );
      updateProject({ storyboard: updatedStoryboard });

      alert('Video remixed successfully!');
    } catch (e: any) {
      console.error('Remix error:', e);
      updateSceneStatus(scene.id, 'failed');
      alert(`Remix failed: ${e.message}`);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleProviderChange = (provider: VideoProvider) => {
    setSelectedProvider(provider);
    setVideoConfig(getDefaultConfig(provider));
  };

  const handleRenderAllVideos = async () => {
    const pendingScenes = projectData.storyboard.filter(
      s => s.status === 'pending' || s.status === 'failed'
    );
    
    if (pendingScenes.length === 0) {
      alert('All scenes are already rendered or currently rendering.');
      return;
    }
    
    if (!confirm(`Start batch rendering ${pendingScenes.length} scenes?\n\nThis will render videos one by one. You can monitor progress below.`)) {
      return;
    }
    
    setBatchRendering(true);
    setBatchProgress({ current: 0, total: pendingScenes.length });
    
    // Process scenes sequentially, but get fresh scene data each iteration
    for (let i = 0; i < pendingScenes.length; i++) {
      setBatchProgress({ current: i + 1, total: pendingScenes.length });
      
      try {
        // Get the current scene by ID to ensure we have the latest status
        const currentScene = projectData.storyboard.find(s => s.id === pendingScenes[i].id);
        if (currentScene && (currentScene.status === 'pending' || currentScene.status === 'failed')) {
          await handleGenerateScene(currentScene);
        }
        // Small delay between renders to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to render scene ${pendingScenes[i].number}:`, error);
        // Continue with next scene even if one fails
      }
    }
    
    setBatchRendering(false);
    setBatchProgress(null);
    alert(`Batch rendering complete! ${pendingScenes.length} scenes processed.`);
  };
  
  const getExternalCopyText = (scene: Scene) => {
    return `PROJECT CONTEXT / STYLE NOTES:\n${projectData.contextNote}\n\nNARRATIVE CONTEXT:\n${scene.narrativeText}\n\nVISUAL PROMPT:\n${scene.visualPrompt}`;
  };

  const handleDownloadSingle = async (scene: Scene) => {
    if (!scene.videoUrl) return;
    try {
      const response = await fetch(scene.videoUrl);
      const blob = await response.blob();
      saveAs(blob, `${projectData.title.replace(/\s+/g, '_')}_scene_${scene.number}.mp4`);
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download video.");
    }
  };

  const handleFinishProject = () => {
    if (isExternal) {
      const uncopiedCount = projectData.storyboard.filter(s => !s.copied).length;
      if (uncopiedCount > 0) {
        alert(`You have ${uncopiedCount} scenes remaining. Please copy all prompts before finishing the project.`);
        return;
      }
    } else {
      // Check if there are completed scenes
      const completedScenes = projectData.storyboard.filter(s => s.status === 'completed' && s.videoUrl);
      
      if (completedScenes.length === 0) {
        alert("No completed scenes to render. Generate videos for your scenes first.");
        return;
      }
      
      // Open render modal for concatenation option
      setShowRenderModal(true);
      return;
    }
    
    if (confirm("Are you sure you want to complete this project? This will clear the current workspace and return to the template selection.")) {
      onReset();
    }
  };

  const handleRenderComplete = (videoUrl: string) => {
    console.log('Render complete:', videoUrl);
    // Optionally show success message or auto-download
  };

  const renderSequence = async (scenes: Scene[], quality: Quality): Promise<Blob> => {
    let width = 1920;
    let height = 1080;
    let bitrate = 5000000;
    
    if (quality === 'MEDIUM') {
      width = 1280;
      height = 720;
      bitrate = 2500000;
    } else if (quality === 'LOW') {
      width = 854;
      height = 480;
      bitrate = 1000000;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");

    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm;codecs=vp9';
    
    // Setup Audio
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();
    
    // Setup Video Element
    const video = document.createElement('video');
    video.crossOrigin = "anonymous";
    video.width = width;
    video.height = height;
    video.muted = false; // We want audio

    // Connect Video Audio to Destination
    // Note: createMediaElementSource can only be called once per element. 
    // We create it once and reuse the element.
    const source = audioCtx.createMediaElementSource(video);
    source.connect(dest);
    source.connect(audioCtx.destination); // Optional: hear it while rendering (good for debug, maybe annoying for user)

    // Setup Recorder
    const canvasStream = canvas.captureStream(30);
    // Combine video track from canvas and audio track from destination
    const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);

    const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: bitrate
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise(async (resolve, reject) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            audioCtx.close();
            resolve(blob);
        };

        recorder.start();

        try {
            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                setExportProgress(`Rendering scene ${i + 1} of ${scenes.length}...`);
                
                await new Promise<void>((resolveScene, rejectScene) => {
                    video.src = scene.videoUrl!;
                    video.currentTime = 0;
                    
                    const drawFrame = () => {
                        if (video.paused || video.ended) return;
                        ctx.drawImage(video, 0, 0, width, height);
                        requestAnimationFrame(drawFrame);
                    };

                    video.onloadeddata = async () => {
                        try {
                           await video.play();
                           drawFrame();
                        } catch (e) {
                           console.error("Play failed", e);
                           rejectScene(e);
                        }
                    };

                    video.onended = () => {
                        resolveScene();
                    };
                    
                    video.onerror = (e) => {
                        console.error("Video error", e);
                        // Skip faulty video or reject? Let's skip to keep process alive but log it
                        resolveScene(); 
                    };
                });
            }
        } catch (e) {
            reject(e);
        } finally {
            recorder.stop();
        }
    });
  };

  const handleExportPackage = async () => {
    setIsExporting(true);
    setExportProgress('Preparing assets...');
    
    try {
      const completedScenes = projectData.storyboard.filter(s => s.status === 'completed' && s.videoUrl);
      
      if (completedScenes.length === 0) {
        alert("No completed scenes to export.");
        setIsExporting(false);
        return;
      }

      if (exportType === 'SINGLE_FILE') {
         setExportProgress('Initializing renderer...');
         // Render Single File
         try {
           const blob = await renderSequence(completedScenes, exportQuality);
           const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
           saveAs(blob, `${projectData.title.replace(/\s+/g, '_')}_full_movie.${ext}`);
         } catch (e) {
           console.error("Rendering failed", e);
           alert("Rendering failed. Ensure video assets are valid and accessible. Check console for details.");
         }
      } else {
         // Create ZIP
         const zip = new JSZip();
         const folder = zip.folder("assets");

         let ffmpegList = "";
         
         // Fetch and add videos
         for (let i = 0; i < completedScenes.length; i++) {
           const scene = completedScenes[i];
           setExportProgress(`Compressing scene ${i + 1}/${completedScenes.length}...`);
           const filename = `scene_${String(scene.number).padStart(3, '0')}.mp4`;
           try {
             const response = await fetch(scene.videoUrl!);
             const blob = await response.blob();
             folder?.file(filename, blob);
             ffmpegList += `file 'assets/${filename}'\n`;
           } catch (e) {
             console.error(`Failed to fetch scene ${scene.number}`, e);
           }
         }

         // Add Manifest
         const manifest = {
           project: projectData.title,
           segment: projectData.segment,
           generatedAt: new Date().toISOString(),
           quality: exportQuality,
           scenes: completedScenes.map(s => ({
             number: s.number,
             prompt: s.visualPrompt,
             narrative: s.narrativeText
           }))
         };
         zip.file("project_manifest.json", JSON.stringify(manifest, null, 2));

         // Add Stitching Scripts
         if (exportType === 'SEQUENCE') {
            zip.file("ffmpeg_concat_list.txt", ffmpegList);
            const shScript = `#!/bin/bash\n# Quick stitch script\nffmpeg -f concat -safe 0 -i ffmpeg_concat_list.txt -c copy ${projectData.title.replace(/\s+/g, '_')}_full_sequence.mp4`;
            zip.file("render_sequence.sh", shScript);
         }

         setExportProgress('Finalizing package...');
         const content = await zip.generateAsync({ type: "blob" });
         saveAs(content, `${projectData.title.replace(/\s+/g, '_')}_export_package.zip`);
      }
      
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      <div className="border-b border-neutral-200 dark:border-zinc-800 pb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1 block">Step 04</span>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {isExternal ? 'Export Studio' : 'Production Studio'}
            </h2>
            <p className="text-neutral-600 dark:text-zinc-400 mt-2 text-sm">
              {isExternal 
                ? 'Copy prompts for external video generation (Google Studio Flow, Veo, etc).' 
                : 'Generate high-fidelity video clips using AI video models.'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {isExternal && (
              <div className="px-3 py-1 rounded bg-blue-900/20 text-blue-400 text-xs font-bold border border-blue-800">
                EXTERNAL MODE
              </div>
            )}
            {!isExternal && (
               <>
                 <button 
                   onClick={() => setShowProviderSettings(!showProviderSettings)}
                   className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-bold transition-all text-sm border border-zinc-700"
                   title="Video generation settings"
                 >
                   <CpuChipIcon className="w-4 h-4" />
                   <span>{PROVIDER_CONFIG[selectedProvider].name}</span>
                 </button>
                 <button 
                   onClick={handleRenderAllVideos}
                   disabled={batchRendering || generatingSceneId !== null}
                   className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Render all pending videos in sequence"
                 >
                   <FilmIcon className="w-4 h-4" />
                   <span>{batchRendering ? 'Rendering...' : 'Render All Videos'}</span>
                 </button>
                 <button 
                   onClick={() => setShowUploadPanel(true)}
                   className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all text-sm"
                   title="Publish to YouTube, Instagram, Facebook"
                 >
                   <ShareIcon className="w-4 h-4" />
                   <span>Publish to Social</span>
                 </button>
                 <button 
                   onClick={() => setShowExportModal(true)}
                   className="flex items-center space-x-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-lg font-bold shadow-lg transition-all text-sm"
                 >
                   <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                   <span>Export Project</span>
                 </button>
               </>
            )}
          </div>
        </div>

        {/* Provider Settings Panel */}
        {showProviderSettings && !isExternal && (
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl animate-fade-in">
            <h3 className="text-sm font-bold text-white mb-3">Video Generation Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Provider Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value as VideoProvider)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                  disabled={availableProviders.length <= 1}
                >
                  {availableProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {PROVIDER_CONFIG[provider].name}
                    </option>
                  ))}
                </select>
                {availableProviders.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">⚠️ No API keys configured</p>
                )}
              </div>

              {/* Duration Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Duration (seconds)</label>
                <select
                  value={videoConfig.duration}
                  onChange={(e) => setVideoConfig({...videoConfig, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  {PROVIDER_CONFIG[selectedProvider].durations.map(duration => (
                    <option key={duration} value={duration}>{duration}s</option>
                  ))}
                </select>
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Resolution</label>
                <select
                  value={videoConfig.resolution}
                  onChange={(e) => setVideoConfig({...videoConfig, resolution: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  {PROVIDER_CONFIG[selectedProvider].resolutions.map(res => (
                    <option key={res} value={res}>{res}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider Features */}
            <div className="mt-3 flex items-center space-x-4 text-xs">
              {PROVIDER_CONFIG[selectedProvider].supportsReferenceImage && (
                <span className="text-green-400">✓ Reference Images</span>
              )}
              {PROVIDER_CONFIG[selectedProvider].supportsRemix && (
                <span className="text-blue-400">✓ Remix/Extend</span>
              )}
              <span className="text-zinc-500">Max prompt: {PROVIDER_CONFIG[selectedProvider].maxPromptLength} chars</span>
            </div>
          </div>
        )}

        {/* Scene Optimization Suggestions */}
        {sceneOptimizations.length > 0 && !isExternal && (
          <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-xl p-4 animate-fade-in">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-400 mb-2">
                  💡 Scene Optimization Suggestions
                </h3>
                <p className="text-xs text-blue-300 mb-3">
                  Detected {sceneOptimizations.length} opportunity(ies) to improve video flow
                </p>
                {sceneOptimizations.map((opt, i) => (
                  <div key={i} className="bg-blue-950/30 rounded-lg p-3 mb-2">
                    <p className="text-xs text-blue-200 mb-2">{opt.reasoning}</p>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          // TODO: Implement merge scenes logic
                          alert('Scene merge feature coming soon!');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
                      >
                        Apply Suggestion
                      </button>
                      <span className="text-xs text-blue-400">
                        Suggested duration: {opt.suggestedDuration}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complex Scene Generation Plan */}
      {generationPlan && generationPlan.method !== 'single' && generatingSceneId && (
        <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <CpuChipIcon className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-purple-400 mb-2">
                🔧 Advanced Generation Plan Active
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-purple-500">Method:</span>
                  <span className="ml-2 text-purple-300 font-mono">
                    {generationPlan.method === 'remix' ? '🔄 Remix Extension' : '🔗 Daisy Chain'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-500">Segments:</span>
                  <span className="ml-2 text-purple-300 font-mono">
                    {generationPlan.segments.map((s: any) => `${s.duration}s`).join(' + ')}
                  </span>
                </div>
                <div>
                  <span className="text-purple-500">Total Duration:</span>
                  <span className="ml-2 text-purple-300 font-mono">{generationPlan.totalDuration}s</span>
                </div>
                <div>
                  <span className="text-purple-500">Provider:</span>
                  <span className="ml-2 text-purple-300 font-mono">{PROVIDER_CONFIG[selectedProvider].name}</span>
                </div>
              </div>
              {generationProgress && (
                <div className="mt-3 bg-purple-950/30 rounded p-2">
                  <p className="text-xs text-purple-300">{generationProgress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Rendering Progress */}
      {batchProgress && (
        <div className="bg-gradient-to-r from-primary-900/20 to-blue-900/20 border border-primary-800 rounded-xl p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-primary-400">Batch Rendering in Progress</span>
            </div>
            <span className="text-xs text-primary-500 font-mono">{batchProgress.current} / {batchProgress.total}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 transition-all duration-500"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isExternal ? 'gap-4' : 'xl:grid-cols-2 gap-8'}`}>
        {projectData.storyboard.map((scene) => (
          <div key={scene.id} className={`bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border shadow-sm flex flex-col transition-all ${
             isExternal && scene.copied ? 'border-green-600/50 dark:border-green-900/50 bg-green-50 dark:bg-green-900/5' : 'border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700'
          }`}>
            
            {/* Conditional Content */}
            {isExternal ? (
               // EXTERNAL MODE LAYOUT
               <div className="p-6 flex flex-col md:flex-row gap-6 items-start relative">
                  {scene.copied && (
                    <div className="absolute top-4 right-4 text-green-500" title="Prompts Copied">
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-shrink-0 w-16 text-center pt-2">
                     <span className={`text-2xl font-bold ${scene.copied ? 'text-green-500' : 'text-zinc-700'}`}>#{scene.number}</span>
                     <div className="text-[10px] text-zinc-500 uppercase mt-1">{scene.durationSeconds}s</div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                     <div>
                        <label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Narrative Context</label>
                        <p className="text-zinc-300 text-sm italic">"{scene.narrativeText}"</p>
                     </div>
                     <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 relative group">
                        <label className="text-[10px] uppercase text-blue-500 font-bold block mb-2">Veo Prompt (Copy for Studio Flow)</label>
                        <p className="text-xs text-zinc-400 font-mono leading-relaxed">{scene.visualPrompt}</p>
                        
                        <button 
                          onClick={() => copyPrompt(scene.visualPrompt, scene.id)}
                          className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy Prompt Only"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col space-y-2 pt-2">
                     <button 
                        onClick={() => copyPrompt(getExternalCopyText(scene), scene.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                          scene.copied 
                          ? 'bg-green-900/20 text-green-400 border-green-800' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                        }`}
                     >
                        <ClipboardDocumentIcon className="w-4 h-4" /> <span>{scene.copied ? 'Copied' : 'Copy Full Context'}</span>
                     </button>
                  </div>
               </div>
            ) : (
              // INTEGRATED MODE LAYOUT
              <>
                <div className="aspect-video bg-zinc-950 flex items-center justify-center relative border-b border-zinc-800 group">
                  {scene.videoUrl ? (
                    <>
                      <video 
                        src={scene.videoUrl} 
                        controls 
                        className="w-full h-full object-cover" 
                        crossOrigin="anonymous" 
                      />
                      <button 
                        onClick={() => handleDownloadSingle(scene)}
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download Clip"
                      >
                         <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-8 w-full h-full flex items-center justify-center">
                      {scene.status === 'generating' ? (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-xs text-primary-500 font-medium tracking-wide animate-pulse uppercase">Rendering Scene...</p>
                        </div>
                      ) : scene.status === 'failed' ? (
                        <div className="text-red-500 flex flex-col items-center">
                          <ExclamationCircleIcon className="w-8 h-8 mb-2"/>
                          <p className="text-xs font-bold uppercase">Generation Error</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950/50">
                          <VideoCameraIcon className="w-10 h-10 text-zinc-800 mb-2"/>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Ready to Render</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm ${
                      scene.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-900' :
                      scene.status === 'generating' ? 'bg-amber-900/30 text-amber-400 border-amber-900' :
                      scene.status === 'failed' ? 'bg-red-900/30 text-red-400 border-red-900' :
                      'bg-zinc-800/80 text-zinc-400 border-zinc-700 backdrop-blur-md'
                    }`}>
                      Scene {scene.number} &bull; {scene.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">"{scene.narrativeText}"</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                    <div className="flex -space-x-2">
                      {scene.characterIds.map(charId => {
                        const char = projectData.characters.find(c => c.id === charId);
                        return char && char.referenceImageUrl ? (
                          <img key={charId} src={char.referenceImageUrl} className="w-6 h-6 rounded-full border border-zinc-900 object-cover ring-2 ring-zinc-800" title={char.name} alt={char.name}/>
                        ) : null;
                      })}
                    </div>

                    <button
                      onClick={() => handleGenerateScene(scene)}
                      disabled={generatingSceneId !== null || scene.status === 'generating'}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        scene.status === 'completed' 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {scene.status === 'completed' ? (
                        <><ArrowPathIcon className="w-3 h-3"/> <span>Regenerate</span></>
                      ) : (
                        <><PlayIcon className="w-3 h-3"/> <span>Start Render</span></>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Finish Project Button */}
      <div className="fixed bottom-6 right-8">
        <button
          onClick={handleFinishProject}
          className="flex items-center space-x-2 bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-3 rounded-full font-bold shadow-2xl hover:shadow-white/20 transition-all transform hover:-translate-y-1"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          <span>Finish Project</span>
        </button>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950/50">
               <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-600/20">
                     <ArchiveBoxArrowDownIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Export Project</h3>
               </div>
              <button onClick={() => setShowExportModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Export Type</label>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setExportType('SEQUENCE')}
                    className={`flex items-center p-3 rounded-lg border transition-all text-left space-x-4 ${
                      exportType === 'SEQUENCE' 
                        ? 'bg-zinc-800 border-primary-500 text-white ring-1 ring-primary-500' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-2 bg-zinc-800 rounded border border-zinc-700">
                      <FilmIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Production Package (ZIP)</span>
                      <span className="text-[10px] opacity-60">Source clips + FFmpeg stitching script. Best for editing.</span>
                    </div>
                  </button>
                  
                   <button 
                    onClick={() => setExportType('SINGLE_FILE')}
                    className={`flex items-center p-3 rounded-lg border transition-all text-left space-x-4 ${
                      exportType === 'SINGLE_FILE' 
                        ? 'bg-zinc-800 border-primary-500 text-white ring-1 ring-primary-500' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-2 bg-zinc-800 rounded border border-zinc-700">
                      <CpuChipIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Rendered Sequence (MP4/WebM)</span>
                      <span className="text-[10px] opacity-60">Browser-rendered single file. Good for quick preview.</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setExportType('INDIVIDUAL')}
                    className={`flex items-center p-3 rounded-lg border transition-all text-left space-x-4 ${
                      exportType === 'INDIVIDUAL' 
                        ? 'bg-zinc-800 border-primary-500 text-white ring-1 ring-primary-500' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-2 bg-zinc-800 rounded border border-zinc-700">
                      <VideoCameraIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Individual Clips (ZIP)</span>
                      <span className="text-[10px] opacity-60">Separate video files only.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quality Settings */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Quality Profile</label>
                <select 
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as Quality)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="HIGH">Source / High (1080p, 5Mbps)</option>
                  <option value="MEDIUM">Balanced (720p, 2.5Mbps)</option>
                  <option value="LOW">Draft (480p, 1Mbps)</option>
                </select>
                <p className="text-[10px] text-zinc-500 italic">
                  {exportType === 'SINGLE_FILE' 
                    ? '* Affects the resolution and bitrate of the browser-side rendering.'
                    : '* Affects metadata only. Source clips are always original quality from Veo.'}
                </p>
              </div>

            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-950/30 flex justify-end space-x-3">
               <button 
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
               >
                  Cancel
               </button>
               <button 
                  onClick={handleExportPackage}
                  disabled={isExporting}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary-900/20 disabled:opacity-50 transition-all text-sm"
               >
                  {isExporting ? (
                     <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> <span>{exportProgress || 'Processing...'}</span></>
                  ) : (
                     <><ArrowDownTrayIcon className="w-4 h-4" /> <span>Download Package</span></>
                  )}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MODAL - Safety Filter & General Errors */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className={`flex items-center justify-between p-6 border-b ${errorModal.isSafetyError ? 'border-amber-900/50 bg-amber-950/30' : 'border-red-900/50 bg-red-950/30'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${errorModal.isSafetyError ? 'bg-amber-600/10 border-amber-600/20' : 'bg-red-600/10 border-red-600/20'}`}>
                  {errorModal.isSafetyError ? (
                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
                  ) : (
                    <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {errorModal.isSafetyError ? 'Content Policy Restriction' : 'Generation Error'}
                </h3>
              </div>
              <button onClick={() => setErrorModal({ show: false, message: '', isSafetyError: false })} className="text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Error Message */}
              <div className={`rounded-lg p-4 border ${errorModal.isSafetyError ? 'bg-amber-950/20 border-amber-900/30' : 'bg-red-950/20 border-red-900/30'}`}>
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {errorModal.message}
                </pre>
              </div>

              {/* Solutions Section for Safety Errors */}
              {errorModal.isSafetyError && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <LightBulbIcon className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">Recommended Solutions</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Solution 1 */}
                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
                      <h5 className="text-sm font-bold text-emerald-400 mb-2">✓ Use Generic Descriptions</h5>
                      <p className="text-xs text-zinc-400 mb-2">Remove specific people's names and use generic character descriptions:</p>
                      <ul className="text-xs text-zinc-500 space-y-1 ml-4">
                        <li>• Instead of "David": use "a young shepherd in his 20s"</li>
                        <li>• Instead of "Moses": use "an elderly prophet with a staff"</li>
                        <li>• Instead of "Napoleon": use "a military leader in French uniform"</li>
                      </ul>
                    </div>

                    {/* Solution 2 */}
                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
                      <h5 className="text-sm font-bold text-blue-400 mb-2">🎨 Switch to Animated/Stylized Style</h5>
                      <p className="text-xs text-zinc-400 mb-2">Non-photorealistic styles often work better for historical figures:</p>
                      <ul className="text-xs text-zinc-500 space-y-1 ml-4">
                        <li>• Animated Stylized (Pixar-style)</li>
                        <li>• Low Poly 3D</li>
                        <li>• Pencil Sketch</li>
                        <li>• Surreal Dreamscape</li>
                      </ul>
                    </div>

                    {/* Solution 3 */}
                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
                      <h5 className="text-sm font-bold text-purple-400 mb-2">📤 Upload Custom Assets</h5>
                      <p className="text-xs text-zinc-400 mb-2">Create or source non-copyrighted reference images:</p>
                      <ul className="text-xs text-zinc-500 space-y-1 ml-4">
                        <li>• Commission custom artwork</li>
                        <li>• Use public domain historical images</li>
                        <li>• Create fictional character designs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/30 flex justify-between">
              <button 
                onClick={() => setErrorModal({ show: false, message: '', isSafetyError: false })}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
              <div className="flex space-x-3">
                {onGoBack && errorModal.isSafetyError && (
                  <>
                    <button 
                      onClick={() => {
                        setErrorModal({ show: false, message: '', isSafetyError: false });
                        // Go back 2 steps to Casting (Step 2)
                        onGoBack();
                        onGoBack();
                      }}
                      className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-zinc-700"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>Back to Casting</span>
                    </button>
                    <button 
                      onClick={() => {
                        setErrorModal({ show: false, message: '', isSafetyError: false });
                        // Go back 1 step to Storyboard (Step 3)
                        onGoBack();
                      }}
                      className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-lg shadow-primary-900/20"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>Back to Storyboard</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* RENDER MODAL - Server-side concatenation */}
      {showRenderModal && projectData.id && (
        <RenderModal
          projectId={projectData.id}
          sceneIds={projectData.storyboard
            .filter(s => s.status === 'completed' && s.videoUrl)
            .map(s => s.id)
          }
          onClose={() => setShowRenderModal(false)}
          onComplete={handleRenderComplete}
        />
      )}

      {/* SOCIAL MEDIA UPLOAD MODAL */}
      {showUploadPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-gradient-to-r from-red-950/50 to-pink-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg">
                  <ShareIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Publish to Social Media</h3>
              </div>
              <button onClick={() => setShowUploadPanel(false)} className="text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <SocialMediaUploadPanel 
                project={projectData} 
                onUploadComplete={(uploadId) => {
                  console.log('Upload started with ID:', uploadId);
                  setShowUploadPanel(false);
                  // Optionally show a success message or switch to Social Media dashboard
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoProduction;