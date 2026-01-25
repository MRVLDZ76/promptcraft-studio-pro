import React from 'react';
import { analyzeVideoContent } from '../services/geminiServiceRAG'; // RAG-enhanced version
import { fetchYouTubeProfile, fetchInstagramProfile, detectPlatform, extractUsername, CreatorProfile } from '../services/socialMediaService';
import { VideoSearchModal } from './VideoSearchModal';
import { ChannelVideoSelector } from './ChannelVideoSelector';
import { YouTubeVideoResult, getVideoTranscriptWithFallback, TranscriptData, extractYouTubeVideoId } from '../services/serpApiService';
import { AnalysisMode, Participant } from '../types';
import { cacheCreatorProfile, getCachedCreatorProfile, cacheVideoTranscript, getCachedVideoTranscript } from '../services/supabaseClient';
import { inputProcessor, InputType, ProcessedInput } from '../services/inputProcessor';
import { 
  ScoringEngine, 
  AnalysisResult as ScoringResult, 
  formatScore, 
  getScoreColorClass,
  getSeverityColorClass,
  FALLACY_DISPLAY_NAMES
} from '../services/scoringEngine';
import { 
  getFactVerificationService, 
  FactVerificationReport 
} from '../services/factVerificationService';
import { FactVerificationPanel } from './FactVerificationPanel';
// Phase 4: Advanced Features Imports
import { 
  getSpeakerDiarizationService, 
  DiarizationResult, 
  formatSpeakingTime 
} from '../services/speakerDiarizationService';
import { 
  getExportService, 
  ExportService, 
  ExportData, 
  ExportFormat 
} from '../services/exportService';
import { 
  getMultiLanguageService, 
  SUPPORTED_LANGUAGES, 
  getLanguageSelectorOptions 
} from '../services/multiLanguageService';
import {
  TimestampLink,
  TranscriptTimeline,
  SeekableClaim,
  SeekableFallacy,
  DiarizationPanel,
  formatTimestamp
} from './TimestampLink';
// Phase 5: Live Debate Mode
import { LiveDebatePanel } from './LiveDebatePanel';
import { LiveDebateService, DebateSession, DebaterProfile } from '../services/liveDebateService';
import { 
  Settings2, 
  Loader2, 
  Brain, 
  ShieldCheck,
  Users,
  Activity,
  ClipboardList,
  FileUp,
  Gavel,
  BarChart3,
  Globe,
  Binary,
  Coins,
  Monitor,
  Scale,
  Verified,
  History,
  Youtube,
  Instagram,
  AlertCircle,
  Zap,
  Link as LinkIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Eye,
  Play,
  Download,
  Trash2,
  Search,
  Maximize2,
  X,
  Mic,
  MicOff,
  Upload,
  Radio,
  Video
} from 'lucide-react';

const COUNTRIES = ['Global', 'USA', 'China', 'EU', 'UK', 'India', 'Japan', 'Brazil', 'Spain', 'Mexico'];
const YEARS = ['2020', '2022', '2023', '2024', '2025', '2030'];
const DEMOGRAPHICS = ['Universal', 'Experts / Peer Reviewers', 'Policy Makers', 'Gen Z / Social Media', 'General Public', 'Academic Community'];
const PERSONAS = ['Neutral Arbiter', 'Scientific Peer Reviewer', 'Supreme Court Justice', 'Fact Checker', 'Socratic Inquisitor'];
const LOGIC_STYLES = ['Elite Peer Review', 'Common Sense', 'Factual Rigor', 'Philosophical Consistency', 'Statistical Probability'];
const STAKEHOLDER_MODES = ['Expert-to-Expert', 'Expert-to-Public', 'Peer-to-Peer'];

export const AnalysisStudio: React.FC = () => {
  const [analysisMode, setAnalysisMode] = React.useState<AnalysisMode>(AnalysisMode.ARENA);
  const [video, setVideo] = React.useState<string | null>(null);
  const [videoMime, setVideoMime] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState('Evaluate the primary arguments and identify any logical fallacies.');

  // Calibration State
  const [country, setCountry] = React.useState('Global');
  const [year, setYear] = React.useState('2024');
  const [demography, setDemography] = React.useState('Experts / Peer Reviewers');
  const [persona, setPersona] = React.useState('Neutral Arbiter');
  const [logicStyle, setLogicStyle] = React.useState('Elite Peer Review');
  const [stakeholderMode, setStakeholderMode] = React.useState('Expert-to-Public');
  const [marginOfError, setMarginOfError] = React.useState(10);
  const [systemMode, setSystemMode] = React.useState<'arena' | 'solo'>('arena'); // Debate (Arena) or Solo Analysis
  const [inputMode, setInputMode] = React.useState<'content' | 'live'>('content'); // Phase 5: Content Analysis vs Live Debate
  const [liveDebateSession, setLiveDebateSession] = React.useState<DebateSession | null>(null);
  
  // WSDC Weights State (Editable Adjudication Matrix)
  const [wsdcWeights, setWsdcWeights] = React.useState({ content: 40, style: 40, strategy: 20 });
  const [tempWeights, setTempWeights] = React.useState({ content: 40, style: 40, strategy: 20 });
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [editingWeights, setEditingWeights] = React.useState(false);
  
  // RAG State
  const [ragUrls, setRagUrls] = React.useState('');
  const [enableRAG, setEnableRAG] = React.useState(true); // RAG toggle
  const [systemPrompt, setSystemPrompt] = React.useState('Focus on identifying structural contradictions and evidentiary gaps.');
  const [contextFiles, setContextFiles] = React.useState<string[]>([]);
  
  // Participants State
  const [pA, setPA] = React.useState<Participant>({
    name: 'Proponent Alpha',
    vector: 'Efficiency',
    socialUrl: '@alpha_logic',
    followers: '1.2M',
    level: 8,
    thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop'
  });
  const [pB, setPB] = React.useState<Participant>({
    name: 'Skeptic Beta',
    vector: 'Ethics',
    socialUrl: '@beta_critique',
    followers: '850K',
    level: 7,
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  });

  const [arenaStats, setArenaStats] = React.useState({
    pointsA: 0, pointsB: 0, truthPot: '$0', followersA: '+0', followersB: '+0', award: 'Standby'
  });

  // Creator Profile Expansion State
  const [expandedProfileA, setExpandedProfileA] = React.useState(false);
  const [expandedProfileB, setExpandedProfileB] = React.useState(false);
  const [profileDataA, setProfileDataA] = React.useState<CreatorProfile | null>(null);
  const [profileDataB, setProfileDataB] = React.useState<CreatorProfile | null>(null);
  const [loadingProfileA, setLoadingProfileA] = React.useState(false);
  const [loadingProfileB, setLoadingProfileB] = React.useState(false);

  // Chain of Thought & Temporal Analysis State
  const [showCoT, setShowCoT] = React.useState(true);
  const [extractedJSON, setExtractedJSON] = React.useState<any>(null);
  const [temporalScores, setTemporalScores] = React.useState<Array<{time: number, scoreA: number, scoreB: number}>>([]);
  
  // Scoring Engine State
  const [scoringResult, setScoringResult] = React.useState<ScoringResult | null>(null);
  const [showAuditLog, setShowAuditLog] = React.useState(false);
  
  // Phase 3: Fact Verification State
  const [factVerificationReport, setFactVerificationReport] = React.useState<FactVerificationReport | null>(null);
  const [isVerifyingFacts, setIsVerifyingFacts] = React.useState(false);
  const [verificationProgress, setVerificationProgress] = React.useState(0);
  const [currentVerificationClaim, setCurrentVerificationClaim] = React.useState('');
  const [showFactPanel, setShowFactPanel] = React.useState(false);
  
  // Phase 4: Advanced Features State
  const [diarizationResult, setDiarizationResult] = React.useState<DiarizationResult | null>(null);
  const [isDiarizing, setIsDiarizing] = React.useState(false);
  const [showDiarizationPanel, setShowDiarizationPanel] = React.useState(false);
  const [currentVideoTime, setCurrentVideoTime] = React.useState(0);
  const [videoDuration, setVideoDuration] = React.useState(0);
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');
  const [showExportPanel, setShowExportPanel] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  
  // Arbiter Tuning Presets
  const [arbiterPreset, setArbiterPreset] = React.useState('custom');
  
  // Fallacy Log Storage - Enhanced with full metadata
  const [fallacyLog, setFallacyLog] = React.useState<Array<{
    id?: string;
    timestamp: Date;
    videoTimestamp?: number;
    fallacy: string;
    speaker: string;
    speakerId?: string;
    impact: string;
    severity?: number;
    type?: string;
    quote?: string;
    explanation?: string;
  }>>([]);
  
  // Visual Display Mode
  const [visualMode, setVisualMode] = React.useState(true);
  
  // Video Search Modal State
  const [showVideoSearch, setShowVideoSearch] = React.useState(false);
  
  // Channel Video Selector State
  const [showChannelVideoSelector, setShowChannelVideoSelector] = React.useState(false);
  const [selectedChannelHandle, setSelectedChannelHandle] = React.useState('');
  const [selectedChannelName, setSelectedChannelName] = React.useState('');
  const [currentParticipant, setCurrentParticipant] = React.useState<'A' | 'B'>('A');
  
  // Transcript State
  const [transcript, setTranscript] = React.useState<string>('');
  const [loadingTranscript, setLoadingTranscript] = React.useState(false);
  const [transcriptError, setTranscriptError] = React.useState<string>('');
  
  // Microphone Recording State
  const [isRecording, setIsRecording] = React.useState(false);
  const [micSession, setMicSession] = React.useState<{ stop: () => ProcessedInput; isActive: () => boolean } | null>(null);
  const [interimTranscript, setInterimTranscript] = React.useState('');
  
  // Input Processing State
  const [inputMetadata, setInputMetadata] = React.useState<ProcessedInput['metadata'] | null>(null);
  const [processingFile, setProcessingFile] = React.useState(false);
  
  // Popup Modal States
  const [popupContent, setPopupContent] = React.useState<'logicCalibration' | 'knowledgeIngestion' | 'fallacyLog' | 'wsdcMatrix' | 'inputStream' | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const contextInputRef = React.useRef<HTMLInputElement>(null);
  
  // Load fallacy log from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('fallacyLog');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setFallacyLog(withDates);
      } catch (e) {
        console.error('Failed to parse fallacy log from localStorage:', e);
      }
    }
  }, []);
  
  // Persist fallacy log to localStorage whenever it changes
  React.useEffect(() => {
    if (fallacyLog.length > 0) {
      localStorage.setItem('fallacyLog', JSON.stringify(fallacyLog));
    }
  }, [fallacyLog]);
  
  // Load logic calibration settings from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('logicCalibrationSettings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.country) setCountry(settings.country);
        if (settings.year) setYear(settings.year);
        if (settings.demography) setDemography(settings.demography);
        if (settings.persona) setPersona(settings.persona);
        if (settings.logicStyle) setLogicStyle(settings.logicStyle);
        if (settings.stakeholderMode) setStakeholderMode(settings.stakeholderMode);
        if (settings.marginOfError !== undefined) setMarginOfError(settings.marginOfError);
        if (settings.systemMode) setSystemMode(settings.systemMode);
        if (settings.wsdcWeights) setWsdcWeights(settings.wsdcWeights);
        if (settings.ragUrls) setRagUrls(settings.ragUrls);
        if (settings.systemPrompt) setSystemPrompt(settings.systemPrompt);
        if (settings.prompt) setPrompt(settings.prompt);
        if (settings.arbiterPreset) setArbiterPreset(settings.arbiterPreset);
      } catch (e) {
        console.error('Failed to parse logic calibration settings:', e);
      }
    }
  }, []);
  
  // Persist logic calibration settings whenever they change
  React.useEffect(() => {
    const settings = {
      country,
      year,
      demography,
      persona,
      logicStyle,
      stakeholderMode,
      marginOfError,
      systemMode,
      wsdcWeights,
      ragUrls,
      systemPrompt,
      prompt,
      arbiterPreset
    };
    localStorage.setItem('logicCalibrationSettings', JSON.stringify(settings));
  }, [country, year, demography, persona, logicStyle, stakeholderMode, marginOfError, systemMode, wsdcWeights, ragUrls, systemPrompt, prompt, arbiterPreset]);
  
  // Load participant and profile data from localStorage on mount
  React.useEffect(() => {
    const storedParticipants = localStorage.getItem('participants');
    const storedProfiles = localStorage.getItem('creatorProfiles');
    
    if (storedParticipants) {
      try {
        const { pA: savedPA, pB: savedPB } = JSON.parse(storedParticipants);
        if (savedPA) setPA(savedPA);
        if (savedPB) setPB(savedPB);
      } catch (e) {
        console.error('Failed to parse participants from localStorage:', e);
      }
    }
    
    if (storedProfiles) {
      try {
        const { profileA, profileB } = JSON.parse(storedProfiles);
        if (profileA) setProfileDataA(profileA);
        if (profileB) setProfileDataB(profileB);
      } catch (e) {
        console.error('Failed to parse profiles from localStorage:', e);
      }
    }
  }, []);
  
  // Persist participant data to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('participants', JSON.stringify({ pA, pB }));
  }, [pA, pB]);
  
  // Persist profile data to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('creatorProfiles', JSON.stringify({ 
      profileA: profileDataA, 
      profileB: profileDataB 
    }));
  }, [profileDataA, profileDataB]);
  
  // Arbiter Tuning Preset Options
  const ARBITER_PRESETS = {
    custom: 'Custom Query',
    comprehensive: 'Comprehensive Analysis',
    fallacy_focus: 'Fallacy Detection Focus',
    evidence_audit: 'Evidence Quality Audit',
    toulmin: 'Toulmin Structure Analysis',
    comparative: 'Comparative Strength Analysis',
    factcheck: 'Fact-Checking Protocol'
  };
  
  const PRESET_PROMPTS = {
    custom: prompt,
    comprehensive: 'Conduct a comprehensive debate analysis covering: 1) Toulmin model deconstruction of all major claims, 2) Systematic fallacy detection across 12 categories, 3) Evidence quality and source credibility assessment, 4) Rhetorical effectiveness and delivery analysis, 5) Strategic structure and time management evaluation. Provide detailed scoring with justification.',
    fallacy_focus: 'Execute intensive fallacy detection protocol: Identify and classify ALL logical fallacies across 12 types (Ad Hominem, Strawman, Slippery Slope, False Dilemma, Appeal to Authority, Hasty Generalization, Post Hoc, Red Herring, Circular Reasoning, Appeal to Emotion, Bandwagon, No True Scotsman). For each fallacy: specify timestamp, speaker, exact quote, classification, severity (1-10), and impact on argument validity.',
    evidence_audit: 'Perform rigorous evidence quality audit: 1) Identify all factual claims and assertions, 2) Classify evidence type (anecdotal, statistical, expert testimony, scientific study), 3) Assess source credibility and recency, 4) Flag unsupported claims and contradictions, 5) Cross-reference against RAG knowledge sources, 6) Score evidence strength (1-10) for each major argument.',
    toulmin: 'Execute Toulmin Model systematic analysis: Deconstruct EVERY argument into 6 components (Claim, Grounds, Warrant, Backing, Qualifier, Rebuttal). For each: 1) Extract verbatim quote, 2) Classify component type, 3) Assess logical validity, 4) Identify missing elements, 5) Evaluate warrant strength, 6) Score structural integrity (1-10). Generate argument map with node relationships.',
    comparative: 'Conduct comparative strength analysis: 1) Identify strongest argument from each participant with detailed justification, 2) Identify weakest argument with vulnerability analysis, 3) Compare argumentation strategies (offensive vs defensive balance), 4) Evaluate refutation effectiveness (did they address core claims or strawmen?), 5) Assess momentum shifts throughout debate, 6) Determine decisive turning points with timestamps.',
    factcheck: 'Execute fact-checking protocol: 1) Extract all verifiable factual claims, 2) Classify claim type (historical, statistical, scientific, legal), 3) Verify against RAG knowledge sources, 4) Flag claims as VERIFIED, DISPUTED, or UNVERIFIABLE, 5) Identify misrepresentations or out-of-context quotes, 6) Provide corrected facts with authoritative sources, 7) Calculate truth density score (% of claims verified).'
  };

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: LIVE DEBATE MODE HANDLERS
  // ═══════════════════════════════════════════════════════════════
  
  // Handler when live debate session completes
  const handleLiveDebateComplete = React.useCallback((session: DebateSession) => {
    console.log('🎙️ Live debate session completed:', session.topic);
    setLiveDebateSession(session);
    
    // Update participant info from live debate
    const debaterA = session.debaters.A;
    if (debaterA) {
      setPA((prev: Participant) => ({
        ...prev,
        name: debaterA.name,
        thumbnail: debaterA.avatar || prev.thumbnail
      }));
    }
    
    const debaterB = session.debaters.B;
    if (debaterB) {
      setPB((prev: Participant) => ({
        ...prev,
        name: debaterB.name,
        thumbnail: debaterB.avatar || prev.thumbnail
      }));
    }
  }, []);
  
  // Handler when live transcript is ready for analysis
  const handleLiveTranscriptReady = React.useCallback((fullTranscript: string) => {
    console.log('📝 Live transcript ready:', fullTranscript.length, 'chars');
    setTranscript(fullTranscript);
    setInputMetadata({
      source: 'live-debate',
      wordCount: fullTranscript.split(/\s+/).filter(w => w).length,
      confidence: 0.85, // Live transcription confidence
      language: 'en'
    });
    
    // Switch to content mode to see analysis
    setInputMode('content');
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // UNIFIED FILE HANDLER (Phase 1: InputProcessor Integration)
  // ═══════════════════════════════════════════════════════════════
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    setError(null);
    setTranscriptError('');
    setInputMetadata(null);

    try {
      console.log(`📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      const processed = await inputProcessor.processFile(file);
      
      // Update transcript with processed content
      setTranscript(processed.transcript);
      setInputMetadata(processed.metadata);
      
      // For video files, also store the base64 for potential preview
      if (processed.type === InputType.FILE_VIDEO) {
        setVideoMime(file.type);
        const reader = new FileReader();
        reader.onloadend = () => setVideo(reader.result as string);
        reader.readAsDataURL(file);
      }
      
      // Validation check
      const validation = inputProcessor.validateInput(processed);
      if (!validation.valid) {
        setTranscriptError(`Warning: ${validation.errors.join(', ')}`);
      }
      
      console.log(`✅ File processed successfully:`, {
        type: processed.type,
        words: processed.metadata.wordCount,
        confidence: `${(processed.metadata.confidence * 100).toFixed(0)}%`,
        language: processed.metadata.language
      });
      
    } catch (err: any) {
      console.error('❌ File processing failed:', err);
      setError(err.message || 'Failed to process file');
      setTranscriptError(err.message || 'Failed to process file');
    } finally {
      setProcessingFile(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // MICROPHONE RECORDING HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const startMicrophoneRecording = () => {
    setError(null);
    setTranscriptError('');
    setInterimTranscript('');
    
    const session = inputProcessor.startMicrophoneCapture({
      onInterimTranscript: (text) => {
        setInterimTranscript(text);
      },
      onFinalTranscript: (text) => {
        setTranscript(text);
        setInterimTranscript('');
      },
      onError: (err) => {
        setTranscriptError(err);
        setIsRecording(false);
        setMicSession(null);
      }
    });
    
    if (session.isActive()) {
      setMicSession(session);
      setIsRecording(true);
      console.log('🎤 Microphone recording started');
    }
  };

  const stopMicrophoneRecording = () => {
    if (micSession) {
      const result = micSession.stop();
      setTranscript(result.transcript);
      setInputMetadata(result.metadata);
      setIsRecording(false);
      setMicSession(null);
      setInterimTranscript('');
      console.log(`🎤 Recording stopped: ${result.metadata.wordCount} words`);
    }
  };

  const handleVideoSelect = async (selectedVideo: YouTubeVideoResult) => {
    // Set video URL from YouTube
    setVideo(`https://www.youtube.com/watch?v=${selectedVideo.video_id}`);
    setVideoMime('video/youtube');
    
    // Auto-fill participant data from channel info
    setPA({
      ...pA,
      name: selectedVideo.channel.name,
      socialUrl: selectedVideo.channel.link,
      thumbnail: selectedVideo.channel.thumbnail
    });
    
    setShowVideoSearch(false);
    
    // Fetch transcript automatically with caching
    setLoadingTranscript(true);
    setTranscriptError('');
    try {
      // Check cache first
      const cachedTranscript = await getCachedVideoTranscript(selectedVideo.video_id);
      if (cachedTranscript) {
        console.log('✅ Using cached transcript:', cachedTranscript.transcript_text.length, 'characters');
        setTranscript(cachedTranscript.transcript_text);
      } else {
        // Fetch from API
        const transcriptData = await getVideoTranscriptWithFallback(selectedVideo.video_id);
        setTranscript(transcriptData.full_transcript);
        console.log('✅ Transcript loaded:', transcriptData.full_transcript.length, 'characters');
        
        // Cache for future use
        await cacheVideoTranscript({
          video_id: selectedVideo.video_id,
          video_url: `https://www.youtube.com/watch?v=${selectedVideo.video_id}`,
          title: selectedVideo.title,
          channel_name: selectedVideo.channel?.name || '',
          transcript_text: transcriptData.full_transcript,
          language_code: typeof transcriptData.languages?.[0] === 'string' ? transcriptData.languages[0] : transcriptData.languages?.[0]?.language_code || 'en',
          duration: '0'
        });
      }
    } catch (error: any) {
      console.error('❌ Transcript fetch failed:', error);
      setTranscriptError(error.message || 'Failed to load transcript');
      setTranscript('');
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleChannelVideoSelect = async (video: YouTubeVideoResult, transcriptData: TranscriptData) => {
    // Set video URL
    setVideo(`https://www.youtube.com/watch?v=${video.video_id}`);
    setVideoMime('video/youtube');
    
    // Format transcript
    const formattedTranscript = transcriptData.transcript
      .map(snippet => snippet.text)
      .join(' ');
    
    setTranscript(formattedTranscript);
    console.log('✅ Transcript loaded from channel selector:', formattedTranscript.length, 'characters');
    
    // Cache transcript for future use
    try {
      await cacheVideoTranscript({
        video_id: video.video_id,
        video_url: `https://www.youtube.com/watch?v=${video.video_id}`,
        title: video.title,
        channel_name: video.channel?.name || '',
        transcript_text: formattedTranscript,
        language_code: typeof transcriptData.languages?.[0] === 'string' ? transcriptData.languages[0] : transcriptData.languages?.[0]?.language_code || 'en',
        duration: '0'
      });
    } catch (error) {
      console.warn('Failed to cache transcript:', error);
    }
    
    // Update the appropriate participant
    const setParticipant = currentParticipant === 'A' ? setPA : setPB;
    const participant = currentParticipant === 'A' ? pA : pB;
    
    setParticipant({
      ...participant,
      name: video.channel.name,
      socialUrl: video.channel.link,
      thumbnail: video.channel.thumbnail
    });
    
    setShowChannelVideoSelector(false);
  };

  const handleContextUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const names = Array.from(files).map((f: File) => f.name);
      setContextFiles(prev => [...prev, ...names]);
    }
  };

  // WSDC Weight Management
  const validateAndApplyWeights = () => {
    const total = tempWeights.content + tempWeights.style + tempWeights.strategy;
    if (total !== 100) {
      setError(`WSDC weights must sum to 100% (current: ${total}%)`);
      return false;
    }
    setWsdcWeights(tempWeights);
    setEditingWeights(false);
    setError(null);
    return true;
  };

  const resetWeights = () => {
    const defaultWeights = { content: 40, style: 40, strategy: 20 };
    setTempWeights(defaultWeights);
    setWsdcWeights(defaultWeights);
    setEditingWeights(false);
  };

  // Fetch creator profile data from social media APIs
  const fetchCreatorProfile = async (socialUrl: string, isParticipantA: boolean) => {
    const setLoading = isParticipantA ? setLoadingProfileA : setLoadingProfileB;
    const setProfileData = isParticipantA ? setProfileDataA : setProfileDataB;
    const participant = isParticipantA ? pA : pB;
    const setParticipant = isParticipantA ? setPA : setPB;

    setLoading(true);
    try {
      const platform = detectPlatform(socialUrl);
      const username = extractUsername(socialUrl);
      
      let profile: CreatorProfile | null = null;

      // Check cache first to avoid repeated API calls
      const cachedProfile = await getCachedCreatorProfile(platform, username);
      if (cachedProfile) {
        console.log(`Using cached profile for ${username}`, cachedProfile);
        
        // Prefer raw_data if available, fall back to top-level fields
        const profileData = cachedProfile.raw_data || {};
        
        profile = {
          username: profileData.username || cachedProfile.username,
          displayName: profileData.displayName || cachedProfile.display_name,
          followers: profileData.followers || cachedProfile.followers_text || cachedProfile.followers_count?.toString() || '0',
          thumbnail: profileData.thumbnail || cachedProfile.thumbnail || '',
          platform: cachedProfile.platform,
          verified: profileData.verified ?? cachedProfile.verified ?? false,
          description: profileData.description || cachedProfile.description,
          totalVideos: profileData.totalVideos || cachedProfile.total_videos,
          totalViews: profileData.totalViews || cachedProfile.total_views?.toString()
        };
      } else if (platform === 'youtube' || socialUrl.includes('youtube') || socialUrl.startsWith('@')) {
        // Using SerpAPI - no YouTube API key needed
        profile = await fetchYouTubeProfile(username);
        
        // Cache the profile for future use
        if (profile) {
          await cacheCreatorProfile({
            platform: 'youtube',
            username: username,
            handle: profile.username || username,
            display_name: profile.displayName,
            thumbnail: profile.thumbnail,
            description: profile.description,
            followers_count: parseInt(profile.followers.replace(/[^0-9.]/g, '').replace('.', '')) || 0,
            followers_text: profile.followers,
            total_videos: profile.totalVideos,
            verified: profile.verified || false,
            raw_data: profile
          });
        }
      } else if (platform === 'instagram') {
        profile = await fetchInstagramProfile(username);
        
        // Cache the profile
        if (profile) {
          await cacheCreatorProfile({
            platform: 'instagram',
            username: username,
            handle: profile.username || username,
            display_name: profile.displayName,
            thumbnail: profile.thumbnail,
            description: profile.description,
            followers_count: parseInt(profile.followers.replace(/[^0-9.]/g, '').replace('.', '')) || 0,
            followers_text: profile.followers,
            total_videos: profile.totalVideos,
            verified: profile.verified || false,
            raw_data: profile
          });
        }
      }

      if (profile) {
        setProfileData(profile);
        // Update participant data with fetched info
        setParticipant({
          ...participant,
          name: profile.displayName,
          followers: profile.followers,
          thumbnail: profile.thumbnail,
          socialUrl: profile.username,
        });
        
        // For YouTube, open video selector
        if (platform === 'youtube' || socialUrl.includes('youtube') || socialUrl.startsWith('@')) {
          setSelectedChannelHandle(username);
          setSelectedChannelName(profile.displayName);
          setCurrentParticipant(isParticipantA ? 'A' : 'B');
          setShowChannelVideoSelector(true);
        }
      }
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const parseStats = (text: string) => {
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Try to parse as direct JSON first (new API format)
    // ═══════════════════════════════════════════════════════════════════════
    let parsed: any = null;
    
    try {
      // Try parsing the entire response as JSON
      const trimmed = text.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsed = JSON.parse(trimmed);
        console.log('✅ Parsed direct JSON response:', Object.keys(parsed));
      }
    } catch (e) {
      // Not direct JSON, continue with legacy parsing
    }
    
    // If we have direct JSON, process it immediately
    if (parsed && (parsed.gamification || parsed.scores || parsed.argument_nodes)) {
      console.log('🎯 Processing structured API response...');
      
      setExtractedJSON(parsed);
      
      // Extract gamification data
      if (parsed.gamification) {
        const g = parsed.gamification;
        setArenaStats({
          pointsA: g.points_a ?? 0,
          pointsB: g.points_b ?? 0,
          truthPot: g.truth_pot ?? '$0',
          followersA: g.followers_a ?? '+0',
          followersB: g.followers_b ?? '+0',
          award: g.award ?? 'Master of Logic'
        });
      }
      
      // Extract temporal scores for visualization
      if (parsed.temporal_scores && Array.isArray(parsed.temporal_scores)) {
        setTemporalScores(parsed.temporal_scores.map((ts: any) => ({
          time: ts.timestamp,
          scoreA: ts.participant_a_score,
          scoreB: ts.participant_b_score || 0
        })));
      }
      
      // Extract fallacies from the dedicated fallacies array (primary source)
      const fallaciesFromDirect = (parsed.fallacies || []).map((f: any, idx: number) => ({
        id: f.id || `fal_${idx + 1}`,
        timestamp: f.timestamp ? new Date(Date.now() - (f.timestamp * 1000)) : new Date(),
        videoTimestamp: f.timestamp || 0,
        fallacy: `[${(f.type || 'FALLACY').toUpperCase()}] ${f.quote || ''} - ${f.explanation || ''}`,
        speaker: f.speaker === 'A' ? pA.name : f.speaker === 'B' ? pB.name : f.speaker,
        speakerId: f.speaker,
        impact: String(f.score_deduction || -5),
        severity: f.severity || 5,
        type: f.type,
        quote: f.quote,
        explanation: f.explanation
      }));
      
      // Also extract from argument_nodes as fallback (for backward compatibility)
      const fallaciesFromNodes = (parsed.argument_nodes || [])
        .filter((node: any) => node.fallacy_type || node.logic_status === 'FALLACY')
        .map((node: any, idx: number) => ({
          id: `node_fal_${idx + 1}`,
          timestamp: new Date(),
          videoTimestamp: node.timestamp_in || 0,
          fallacy: `[${(node.fallacy_type || 'FALLACY').toUpperCase()}] ${node.claim_text_full || node.claim_text_short}`,
          speaker: node.speaker_id === 'A' ? pA.name : pB.name,
          speakerId: node.speaker_id,
          impact: String(node.score_impact || -5),
          severity: Math.abs(node.score_impact || 5),
          type: node.fallacy_type,
          quote: node.claim_text_short,
          explanation: node.claim_text_full
        }));
      
      // Prefer dedicated fallacies array, use nodes as supplement
      // Deduplicate by quote to avoid counting same fallacy twice
      const seenQuotes = new Set<string>();
      const allFallacies = [...fallaciesFromDirect];
      
      for (const nodeFallacy of fallaciesFromNodes) {
        if (!seenQuotes.has(nodeFallacy.quote || '')) {
          seenQuotes.add(nodeFallacy.quote || '');
          allFallacies.push(nodeFallacy);
        }
      }
      
      if (allFallacies.length > 0) {
        console.log(`📊 Extracted ${allFallacies.length} fallacies (${fallaciesFromDirect.length} direct, ${fallaciesFromNodes.length} from nodes)`);
        setFallacyLog(allFallacies);
      } else {
        console.log('✅ No fallacies detected - clean logical argumentation');
      }
      
      // Log final_verdict fallacy summary if available
      if (parsed.final_verdict?.fallacy_count) {
        console.log(`📊 Fallacy Summary: A=${parsed.final_verdict.fallacy_count.a || 0}, B=${parsed.final_verdict.fallacy_count.b || 0}`);
        console.log(`📊 Total Deductions: A=${parsed.final_verdict.total_fallacy_deduction?.a || 0}, B=${parsed.final_verdict.total_fallacy_deduction?.b || 0}`);
      }
      
      // Extract claims if available
      if (parsed.claims && Array.isArray(parsed.claims)) {
        const verifiedCount = parsed.claims.filter((c: any) => c.verified).length;
        console.log(`📊 Extracted ${parsed.claims.length} claims (${verifiedCount} verified)`);
      }
      
      // Extract fact verification report from RAG metadata
      if (parsed.ragMetadata?.factVerificationReport) {
        console.log('📊 Extracting fact verification report...');
        setFactVerificationReport(parsed.ragMetadata.factVerificationReport);
        setShowFactPanel(true);
      }
      
      // Calculate scores using Scoring Engine
      if (parsed.argument_nodes || parsed.claims || parsed.scores) {
        try {
          const engine = ScoringEngine.fromUserSettings({
            marginOfError,
            wsdcWeights
          });
          
          // Use scores from API if available, otherwise calculate
          const result = engine.calculateScores(
            {
              claims: parsed.claims || [],
              fallacies: allFallacies.map(f => ({
                type: f.type,
                speaker: f.speaker.includes('A') ? 'A' : 'B',
                severity: f.severity,
                quote: f.quote || '',
                explanation: f.fallacy
              })),
              wsdcScores: parsed.scores,
              gamification: parsed.gamification
            },
            {
              A: pA.name,
              B: systemMode === 'arena' ? pB.name : undefined
            }
          );
          
          setScoringResult(result);
          
          console.log('✅ Scoring Engine completed:', {
            winner: result.winner,
            margin: result.winMargin?.toFixed(1) || 'N/A',
            truthDensity: `${(result.overallTruthDensity || 0).toFixed(1)}%`,
            fallacies: allFallacies.length
          });
          
        } catch (scoringError) {
          console.error('❌ Scoring Engine error:', scoringError);
          // Still show basic scores from API
        }
      }
      
      return; // Exit early if we processed direct JSON
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LEGACY PARSING: Text-based extraction for backward compatibility
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📜 Falling back to legacy text parsing...');
    
    // === GAMIFICATION DATA (Text-based extraction for backward compatibility) ===
    const pointsAMatch = text.match(/POINTS_A:\s*(\d+)/i)?.[1] || '0';
    const pointsBMatch = text.match(/POINTS_B:\s*(\d+)/i)?.[1] || '0';
    const pot = text.match(/TRUTH_POT:\s*(\$[\d,.]+)/i)?.[1] || '$0';
    const fA = text.match(/FOLLOWERS_A:\s*(\+[\d,]+)/i)?.[1] || '+0';
    const fB = text.match(/FOLLOWERS_B:\s*(\+[\d,]+)/i)?.[1] || '+0';
    const aw = text.match(/AWARD:\s*(.+)/i)?.[1]?.trim() || 'Awaiting Logic';
    setArenaStats({ pointsA: parseInt(pointsAMatch), pointsB: parseInt(pointsBMatch), truthPot: pot, followersA: fA, followersB: fB, award: aw });
    
    // === FALLACY LOG (Text-based extraction) ===
    if (text.includes('Fallacy Log') || text.includes('FALLACY')) {
      const fallacySection = text.match(/Fallacy Log:([\s\S]+?)(Reliability Score|Query|JSON_OUTPUT|$)/)?.[1];
      if (fallacySection) {
        const newFallacies = fallacySection.split('\n')
          .filter(l => l.trim().length > 5)
          .map(line => {
            const speakerMatch = line.match(/(Participant A|Participant B|Subject Alpha|Subject Beta|Speaker [AB])/i);
            const impactMatch = line.match(/(-\d+|\+\d+)\s*points/i);
            return {
              timestamp: new Date(),
              fallacy: line.trim().replace(/^[-*]\s*/, ''),
              speaker: speakerMatch ? speakerMatch[1] : 'Unknown',
              impact: impactMatch ? impactMatch[1] : '0'
            };
          });
        setFallacyLog(prev => [...prev, ...newFallacies]);
      }
    }
    
    // === STRUCTURED JSON EXTRACTION (Legacy format with markers) ===
    const jsonMatch = text.match(/JSON_OUTPUT_START\s*([\s\S]*?)\s*JSON_OUTPUT_END/);
    if (jsonMatch) {
      try {
        // Clean the JSON string (remove any markdown artifacts)
        let jsonStr = jsonMatch[1].trim();
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        
        const parsed = JSON.parse(jsonStr);
        console.log('✅ Parsed structured JSON output:', Object.keys(parsed));
        
        setExtractedJSON(parsed);
        
        // Extract temporal scores for visualization
        if (parsed.temporal_scores && Array.isArray(parsed.temporal_scores)) {
          setTemporalScores(parsed.temporal_scores.map((ts: any) => ({
            time: ts.timestamp,
            scoreA: ts.participant_a_score,
            scoreB: ts.participant_b_score || 0
          })));
        }
        
        // Override gamification stats from JSON if available (more accurate)
        if (parsed.gamification) {
          const g = parsed.gamification;
          setArenaStats(prev => ({
            ...prev,
            pointsA: g.points_a ?? prev.pointsA,
            pointsB: g.points_b ?? prev.pointsB,
            truthPot: g.truth_pot ?? prev.truthPot,
            award: g.award ?? prev.award
          }));
        }
        
        // Extract structured fallacies from JSON (for Scoring Engine)
        if (parsed.fallacies && Array.isArray(parsed.fallacies)) {
          const jsonFallacies = parsed.fallacies.map((f: any) => ({
            timestamp: new Date(),
            fallacy: `[${f.type?.toUpperCase()}] ${f.quote || ''} - ${f.explanation || ''}`,
            speaker: f.speaker === 'A' ? 'Participant A' : f.speaker === 'B' ? 'Participant B' : f.speaker,
            impact: f.severity ? `-${f.severity * 5}` : '0',
            severity: f.severity || 5,
            type: f.type,
            quote: f.quote
          }));
          
          // Log fallacy count for debugging
          console.log(`📊 Extracted ${jsonFallacies.length} fallacies from JSON`);
          
          // Only add if we have structured fallacies
          if (jsonFallacies.length > 0) {
            setFallacyLog(prev => {
              // Avoid duplicates by checking if fallacy already exists
              const existingQuotes = new Set(prev.map(f => f.fallacy.substring(0, 50)));
              const newOnes = jsonFallacies.filter((f: any) => !existingQuotes.has(f.fallacy.substring(0, 50)));
              return [...prev, ...newOnes];
            });
          }
        }
        
        // Log claims count for debugging (Scoring Engine will use these)
        if (parsed.claims && Array.isArray(parsed.claims)) {
          const verifiedCount = parsed.claims.filter((c: any) => c.verified).length;
          console.log(`📊 Extracted ${parsed.claims.length} claims (${verifiedCount} verified)`);
        }
        
        // ═══════════════════════════════════════════════════════════════
        // PHASE 3: Extract Fact Verification Report from RAG metadata
        // ═══════════════════════════════════════════════════════════════
        if (parsed.ragMetadata?.factVerificationReport) {
          console.log('📊 Phase 3: Extracting fact verification report from analysis...');
          setFactVerificationReport(parsed.ragMetadata.factVerificationReport);
          setShowFactPanel(true);
        }
        
        // ═══════════════════════════════════════════════════════════════
        // SCORING ENGINE INTEGRATION (Phase 2)
        // ═══════════════════════════════════════════════════════════════
        if (parsed.claims || parsed.fallacies) {
          try {
            // Create scoring engine with current calibration settings
            const engine = ScoringEngine.fromUserSettings({
              marginOfError,
              wsdcWeights
            });
            
            // Calculate scores using structured output
            const result = engine.calculateScores(
              {
                claims: parsed.claims,
                fallacies: parsed.fallacies,
                wsdcScores: parsed.wsdcScores,
                gamification: parsed.gamification
              },
              {
                A: pA.name,
                B: systemMode === 'arena' ? pB.name : undefined
              }
            );
            
            setScoringResult(result);
            
            // Override arena stats with scoring engine results (most accurate)
            setArenaStats(prev => ({
              ...prev,
              pointsA: Math.round(result.participantA.totalScore),
              pointsB: result.participantB ? Math.round(result.participantB.totalScore) : 0,
              truthPot: `$${(result.overallTruthDensity * 10).toFixed(2)}`,
              award: result.winner === 'TIE' 
                ? 'Logical Parity' 
                : `${result.winner === 'A' ? pA.name : pB.name} Prevails`
            }));
            
            console.log('✅ Scoring Engine completed:', {
              winner: result.winner,
              margin: result.winMargin.toFixed(1),
              truthDensity: `${result.overallTruthDensity.toFixed(1)}%`,
              claims: result.claims.length,
              fallacies: result.fallacies.length
            });
            
          } catch (scoringError) {
            console.error('❌ Scoring Engine error:', scoringError);
          }
        }
        
      } catch (e) {
        console.error('❌ Failed to parse JSON output:', e);
        console.log('Raw JSON string:', jsonMatch[1].substring(0, 200) + '...');
      }
    } else {
      console.warn('⚠️ No JSON_OUTPUT_START...END block found in response');
      // Clear scoring result if no structured output
      setScoringResult(null);
    }
  };

  // Dynamically generate Supervisor Intelligence Directive from Logic Calibrator settings
  const generateSupervisorPrompt = React.useCallback(() => {
    const mode = systemMode === 'arena' ? 'DEBATE ANALYSIS (Arena Mode)' : 'SOLO CONTENT ANALYSIS';
    const participants = systemMode === 'arena' 
      ? `${pA.name} vs ${pB.name}` 
      : pA.name;
    
    return `SUPERVISOR INTELLIGENCE DIRECTIVE - RAG ORCHESTRATION PROTOCOL:

═══════════════════════════════════════════════════════════════
🎯 ANALYSIS MODE: ${mode}
👤 PARTICIPANTS: ${participants}
${systemMode === 'arena' ? `   • Participant A: ${pA.name} (${pA.vector} Focus)
   • Participant B: ${pB.name} (${pB.vector} Focus)` : `   • Subject: ${pA.name} (${pA.vector} Focus)`}
═══════════════════════════════════════════════════════════════

You are calibrating this ${systemMode === 'arena' ? 'debate' : 'content'} analysis through the following parameters:

🌍 REGIONAL CONTEXT: ${country} (${year})
- Epistemic standards: ${country === 'Global' ? 'Universal scientific consensus' : `${country}-specific cultural and legal frameworks`}
- Temporal calibration: ${year} knowledge cutoff and societal norms

👥 TARGET AUDIENCE: ${demography}
- Expertise level: ${demography.includes('Experts') ? 'Peer-review rigor' : demography.includes('Gen Z') ? 'Social media accessibility' : 'General public comprehension'}
- Communication style: ${demography.includes('Academic') ? 'Formal academic discourse' : 'Clear, engaging narrative'}

⚖️ ARBITER PERSONA: ${persona}
- Judgment lens: ${persona === 'Neutral Arbiter' ? 'Balanced, objective analysis' : persona === 'Scientific Peer Reviewer' ? 'Empirical evidence primacy' : persona === 'Supreme Court Justice' ? 'Precedent and constitutional rigor' : persona === 'Fact Checker' ? 'Verifiable truth emphasis' : 'Philosophical consistency and logical coherence'}

🧠 LOGIC RIGOUR: ${logicStyle}
- Standard: ${logicStyle === 'Elite Peer Review' ? 'Nature/Science journal-level scrutiny' : logicStyle === 'Common Sense' ? 'Layperson reasoning patterns' : logicStyle === 'Factual Rigor' ? 'Fact-checking and source verification' : logicStyle === 'Philosophical Consistency' ? 'Logical validity and coherence' : 'Statistical and probabilistic reasoning'}
- Fallacy sensitivity: ${logicStyle === 'Elite Peer Review' ? 'Maximum (any logical flaw penalized)' : logicStyle === 'Common Sense' ? 'Moderate (obvious fallacies only)' : 'High (systematic fallacy detection)'}

🎯 STAKEHOLDER MODE: ${stakeholderMode}
- Communication context: ${stakeholderMode === 'Expert-to-Expert' ? 'Technical precision, assume domain knowledge' : stakeholderMode === 'Expert-to-Public' ? 'Translate complexity to accessibility' : 'Peer discourse with shared baseline'}

📊 MARGIN OF ERROR: ±${marginOfError}%
- Acceptable uncertainty range in scoring and classification
- Confidence thresholds for claims and rebuttals

🔗 RAG INTEGRATION:
- Cross-reference all factual claims against provided knowledge sources
- Weight external evidence according to source credibility and temporal relevance
- Flag unsupported assertions and contradictions with knowledge base
- Synthesize multi-source information to validate or refute arguments

🎖️ WSDC ADJUDICATION MATRIX (Editable Weights):
- Content: ${wsdcWeights.content}% (Logic, Evidence, Consistency)
- Style: ${wsdcWeights.style}% (Rhetoric, Clarity, Delivery)
- Strategy: ${wsdcWeights.strategy}% (Structure, Refutation, Time Management)
- Total: ${wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}% [VALIDATED]

APPLY these calibrations dynamically throughout your analysis. ${systemMode === 'arena' ? `Compare ${pA.name} vs ${pB.name} using these criteria.` : `Evaluate ${pA.name}'s content using these criteria.`} Adjust your judgment criteria based on the specified persona, audience, and regional context.`;
  }, [country, year, demography, persona, logicStyle, stakeholderMode, marginOfError, wsdcWeights, systemMode, pA, pB]);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Manual Fact Verification Handler
  // ═══════════════════════════════════════════════════════════════
  const runManualFactVerification = async () => {
    if (!scoringResult || scoringResult.claims.length === 0) {
      setError('No claims available for verification. Run analysis first.');
      return;
    }

    setIsVerifyingFacts(true);
    setVerificationProgress(0);
    setCurrentVerificationClaim('');
    setShowFactPanel(true);

    try {
      const verificationService = getFactVerificationService({
        maxConcurrentVerifications: 3,
        maxSourcesPerClaim: 5,
        timeoutPerClaim: 15000,
        retryFailedClaims: true
      });

      // Set up progress callback for UI updates
      verificationService.setProgressCallback((progress, currentClaim) => {
        setVerificationProgress(progress);
        setCurrentVerificationClaim(currentClaim);
      });

      // Convert scoring engine claims to verification format
      const claimsToVerify = scoringResult.claims.map(c => ({
        text: c.text,
        speaker: c.speaker,
        category: c.category,
        timestamp: c.timestamp
      }));

      const report = await verificationService.verifyAllClaims(
        claimsToVerify,
        { 
          A: pA.name, 
          B: systemMode === 'arena' ? pB.name : undefined 
        }
      );

      setFactVerificationReport(report);
      
      console.log('✅ Manual fact verification complete:', {
        totalClaims: report.summary.totalClaims,
        verified: report.summary.verified,
        false: report.summary.false,
        truthDensity: `${report.summary.truthDensity.toFixed(1)}%`
      });

    } catch (err: any) {
      console.error('❌ Fact verification error:', err);
      setError(`Fact verification failed: ${err.message}`);
    } finally {
      setIsVerifyingFacts(false);
      setVerificationProgress(100);
      setCurrentVerificationClaim('');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Speaker Diarization Handler
  // ═══════════════════════════════════════════════════════════════
  const runSpeakerDiarization = async () => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No transcript available for diarization. Load a video or record audio first.');
      return;
    }

    setIsDiarizing(true);
    try {
      const diarizationService = getSpeakerDiarizationService();
      
      // Convert transcript to segments (basic parsing)
      const lines = transcript.split('\n').filter(l => l.trim());
      const segments = lines.map((line, idx) => ({
        text: line,
        startTime: idx * 10, // Approximate 10s per line
        endTime: (idx + 1) * 10,
        confidence: 0.9
      }));

      const result = await diarizationService.diarize(segments, {
        participantNames: { A: pA.name, B: systemMode === 'arena' ? pB.name : undefined }
      });

      setDiarizationResult(result);
      setVideoDuration(result.totalDuration);
      setShowDiarizationPanel(true);

      console.log('✅ Speaker diarization complete:', {
        speakers: result.speakers.length,
        segments: result.segments.length,
        transitions: result.speakerTransitions,
        ratioA: `${result.speakingTimeRatio.A.toFixed(1)}%`,
        ratioB: `${result.speakingTimeRatio.B.toFixed(1)}%`
      });

    } catch (err: any) {
      console.error('❌ Diarization error:', err);
      setError(`Speaker diarization failed: ${err.message}`);
    } finally {
      setIsDiarizing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Video Seek Handler (Timestamp Linking)
  // ═══════════════════════════════════════════════════════════════
  const handleVideoSeek = (timeInSeconds: number) => {
    setCurrentVideoTime(timeInSeconds);
    
    // If there's a video element reference, seek to the time
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.play().catch(console.error);
    }

    // Scroll to the relevant part of the transcript if diarization exists
    if (diarizationResult) {
      const segment = diarizationResult.segments.find(
        s => s.startTime <= timeInSeconds && s.endTime >= timeInSeconds
      );
      if (segment) {
        console.log(`[Seek] Jumping to ${formatTimestamp(timeInSeconds)} - Speaker ${segment.speaker}`);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Export Handler
  // ═══════════════════════════════════════════════════════════════
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const exportService = getExportService({
        branding: {
          title: 'PromptCraft Studio Pro',
          subtitle: 'Logic Analysis Report',
          color: '#6366f1'
        }
      });

      const exportData: ExportData = {
        analysis: {
          mode: systemMode,
          timestamp: new Date(),
          duration: videoDuration || undefined,
          videoUrl: undefined
        },
        participants: {
          A: {
            name: pA.name,
            score: arenaStats.pointsA,
            truthDensity: scoringResult?.participants.A.truthDensity || 0
          },
          B: systemMode === 'arena' ? {
            name: pB.name,
            score: arenaStats.pointsB,
            truthDensity: scoringResult?.participants.B?.truthDensity || 0
          } : undefined
        },
        scoringResult: scoringResult || undefined,
        factVerification: factVerificationReport || undefined,
        diarization: diarizationResult || undefined,
        transcript: transcript || undefined,
        calibration: {
          country,
          year,
          persona,
          marginOfError,
          wsdcWeights
        }
      };

      const result = await exportService.export(exportData, format);

      if (result.success) {
        // Trigger download for non-PDF formats
        if (format !== 'pdf') {
          exportService.download(result);
        }
        console.log(`✅ Export complete: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`);
      }

      setShowExportPanel(false);
    } catch (err: any) {
      console.error('❌ Export error:', err);
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Check if we have valid input for analysis
  const hasValidInput = React.useMemo(() => {
    return !!(video || transcript || (ragUrls && ragUrls.trim().length > 0));
  }, [video, transcript, ragUrls]);

  const runAnalysis = async () => {
    // Warn if no input source
    if (!hasValidInput) {
      const proceed = window.confirm(
        '⚠️ No input source detected!\n\n' +
        'The AI will generate a demonstration analysis based on participant profiles only.\n\n' +
        'For accurate analysis, please:\n' +
        '• Upload a video/audio file\n' +
        '• Search for a YouTube video\n' +
        '• Record via microphone\n' +
        '• Add RAG reference URLs\n\n' +
        'Continue with demo analysis anyway?'
      );
      if (!proceed) return;
    }

    setLoading(true);
    setError(null);
    try {
      const base64 = video ? video.split(',')[1] : null;
      
      // Generate dynamic supervisor prompt from calibration settings
      const supervisorPrompt = generateSupervisorPrompt();
      
      // Merge supervisor prompt with system instruction for RAG intelligence
      const enhancedSystemInstruction = `${supervisorPrompt}\n\n${systemPrompt}\n\nCalibration Context: Region=${country}, Year=${year}, Demography=${demography}, Persona=${persona}, Logic Style=${logicStyle}`;
      
      const res = await analyzeVideoContent(base64, videoMime, prompt, {
        mode: analysisMode,
        participantA: pA,
        participantB: analysisMode === AnalysisMode.ARENA ? pB : undefined,
        wsdcWeights,
        ragUrls: ragUrls.split('\n').filter(Boolean),
        contextFiles,
        transcript: transcript || undefined,
        systemInstruction: enhancedSystemInstruction,
        supervisorPrompt,
        calibration: { country, year, demography, persona, logicStyle, stakeholderMode, marginOfError },
        enableRAG // Pass RAG toggle to service
      });
      setResult(res);
      parseStats(res);
      if (soundEnabled) {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play().catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || "Logic engine failure.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate reliability/truth density from multiple sources
  const reliability = React.useMemo(() => {
    // Priority 1: Scoring Engine result
    if (scoringResult?.overallTruthDensity) {
      return Math.round(scoringResult.overallTruthDensity);
    }
    // Priority 2: Extracted JSON claims
    if (extractedJSON?.claims?.length > 0) {
      const verified = extractedJSON.claims.filter((c: any) => c.verified).length;
      return Math.round((verified / extractedJSON.claims.length) * 100);
    }
    // Priority 3: RAG metadata
    if (extractedJSON?.ragMetadata?.factVerificationReport?.summary?.truthDensity) {
      return Math.round(extractedJSON.ragMetadata.factVerificationReport.summary.truthDensity);
    }
    // Priority 4: Legacy text extraction
    const match = result.match(/Reliability Rating:\s*(\d+)%/i);
    return match ? match[1] : '0';
  }, [scoringResult, extractedJSON, result]);

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 overflow-hidden font-sans">
      
      {/* 1. The Arbiter Scoreboard */}
      <header className="shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 z-30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-[1600px] mx-auto">
          
          {/* Proponent A Card */}
          <div className="flex items-center gap-4 w-full md:w-1/3 group">
            <div className="relative shrink-0">
              <img src={pA.thumbnail} className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700 transition-all group-hover:scale-105" alt="pA" />
              <div className="absolute -bottom-1 -right-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[8px] font-semibold px-1.5 rounded-sm">LVL {pA.level}</div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-1.5 min-w-0">
                   <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{pA.name}</span>
                 </div>
                 <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{arenaStats.pointsA} PTS</span>
               </div>
               <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-1000" style={{ width: `${arenaStats.pointsA}%` }} />
               </div>
               <div className="flex justify-between items-center mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                  <span className="flex items-center gap-1">{pA.socialUrl}</span>
                  <span>{arenaStats.followersA} FOLLOWERS</span>
               </div>
            </div>
          </div>

          {/* Logic Pot & Mode Select */}
          <div className="flex flex-col items-center gap-1 w-full md:w-auto">
            <div className="flex items-center gap-4">
               <div className="text-center">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">Truth Pot</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1">
                    <Coins className="w-4 h-4" /> {arenaStats.truthPot}
                  </span>
               </div>
               <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">Mode</span>
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5 border border-neutral-200 dark:border-neutral-700">
                    <button onClick={() => { setAnalysisMode(AnalysisMode.ARENA); setSystemMode('arena'); }} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${analysisMode === AnalysisMode.ARENA ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>1v1</button>
                    <button onClick={() => { setAnalysisMode(AnalysisMode.MONOLOGUE); setSystemMode('solo'); }} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${analysisMode === AnalysisMode.MONOLOGUE ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Solo</button>
                  </div>
               </div>
               <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
               {/* Phase 5: Input Mode Toggle - Content Analysis vs Live Debate */}
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">Input</span>
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5 border border-neutral-200 dark:border-neutral-700">
                    <button 
                      onClick={() => setInputMode('content')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${inputMode === 'content' ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                      <Video className="w-3 h-3" /> Content
                    </button>
                    <button 
                      onClick={() => setInputMode('live')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${inputMode === 'live' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                      <Radio className="w-3 h-3" /> Live
                    </button>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-1">
               <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">{arenaStats.award}</span>
            </div>
          </div>

          {/* Participant B Card */}
          <div className="flex items-center gap-4 w-full md:w-1/3 flex-row-reverse text-right group">
            <div className="relative shrink-0">
              {analysisMode === AnalysisMode.ARENA ? (
                <img src={pB.thumbnail} className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700 transition-all group-hover:scale-105" alt="pB" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <ShieldCheck className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
              )}
              <div className={`absolute -bottom-1 -left-1 text-white dark:text-neutral-900 text-[8px] font-semibold px-1.5 rounded-sm ${analysisMode === AnalysisMode.ARENA ? 'bg-neutral-700 dark:bg-neutral-300' : 'bg-neutral-600 dark:bg-neutral-400'}`}>
                {analysisMode === AnalysisMode.ARENA ? `LVL ${pB.level}` : 'DATA'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1 flex-row-reverse">
                 <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate ml-2">
                  {analysisMode === AnalysisMode.ARENA ? pB.name : 'FACTUAL MATRIX'}
                 </span>
                 <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {arenaStats.pointsB} PTS
                 </span>
               </div>
               <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex flex-row-reverse">
                  <div className="h-full bg-neutral-700 dark:bg-neutral-300 transition-all duration-1000" style={{ width: `${arenaStats.pointsB}%` }} />
               </div>
               <div className="flex justify-between items-center mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 flex-row-reverse">
                  <span className="flex items-center gap-1">
                    {analysisMode === AnalysisMode.ARENA ? (
                      <>{pB.socialUrl}</>
                    ) : (
                      <>RAG Knowledge Base</>
                    )}
                  </span>
                  <span>
                    {analysisMode === AnalysisMode.ARENA ? `${arenaStats.followersB} FOLLOWERS` : ''}
                  </span>
               </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Calibration Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar: Deep Logic Calibration */}
        <aside className="w-full lg:w-72 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto p-4 space-y-5">
          
          {/* Creator Profile Editor - Expandable with API Integration */}
          <div className="space-y-3">
             <div className="flex items-center gap-2"><Users className="w-4 h-4 text-neutral-400" /><h3 className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Creator Profiles</h3></div>
             
             {/* Subject Alpha - Expandable */}
             <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
               <div className="p-3 space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Subject A</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <button 
                       onClick={() => fetchCreatorProfile(pA.socialUrl, true)}
                       disabled={loadingProfileA}
                       className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                       title="Fetch YouTube profile data"
                     >
                       {loadingProfileA ? (
                         <Loader2 className="w-3 h-3 text-neutral-500 animate-spin" />
                       ) : (
                         <RefreshCw className="w-3 h-3 text-neutral-500" />
                       )}
                     </button>
                     <button 
                       onClick={() => {
                         setExpandedProfileA(!expandedProfileA);
                         // Auto-fetch profile when expanding if not already loaded
                         if (!expandedProfileA && !profileDataA && !loadingProfileA) {
                           fetchCreatorProfile(pA.socialUrl, true);
                         }
                       }}
                       className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 rounded transition-colors"
                     >
                       {expandedProfileA ? (
                         <ChevronUp className="w-3 h-3 text-neutral-500" />
                       ) : (
                         <ChevronDown className="w-3 h-3 text-neutral-500" />
                       )}
                     </button>
                   </div>
                 </div>
                 
                 {profileDataA?.thumbnail && (
                   <img src={profileDataA.thumbnail} alt={pA.name} className="w-full h-20 object-cover rounded-lg" />
                 )}
                 
                 <input value={pA.name} onChange={e => setPA({...pA, name: e.target.value})} placeholder="Creator name" className="w-full text-xs font-bold bg-transparent border-b border-neutral-200 dark:border-neutral-500/20 outline-none pb-1 focus:border-neutral-500" />
                 <div className="flex gap-2">
                   <input value={pA.socialUrl} onChange={e => setPA({...pA, socialUrl: e.target.value})} placeholder="@username or URL" className="flex-1 text-[10px] bg-transparent outline-none text-neutral-400 dark:text-neutral-500 font-mono border-b border-neutral-200 dark:border-neutral-500/20 pb-1" />
                   {profileDataA && (
                     <a href={`https://youtube.com/${profileDataA.username}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 rounded transition-colors">
                       <ExternalLink className="w-3 h-3 text-neutral-500" />
                     </a>
                   )}
                 </div>
                 
                 <div className="flex gap-2">
                   <div className="flex-1 bg-white dark:bg-black/40 rounded p-1.5 border border-neutral-100 dark:border-neutral-500/10">
                     <label className="text-[8px] block font-black text-neutral-400 dark:text-neutral-600 uppercase">Followers</label>
                     <input value={pA.followers} onChange={e => setPA({...pA, followers: e.target.value})} className="w-full text-[10px] font-bold bg-transparent outline-none text-neutral-600 dark:text-neutral-300" />
                   </div>
                   <div className="w-16 bg-white dark:bg-black/40 rounded p-1.5 border border-neutral-100 dark:border-neutral-500/10">
                     <label className="text-[8px] block font-black text-neutral-400 dark:text-neutral-600 uppercase">Level</label>
                     <input type="number" value={pA.level} onChange={e => setPA({...pA, level: parseInt(e.target.value)})} className="w-full text-[10px] font-bold bg-transparent outline-none text-neutral-600 dark:text-neutral-300 text-center" />
                   </div>
                 </div>
               </div>
               
               {/* Expanded Details */}
               {expandedProfileA && profileDataA && (
                 <div className="border-t border-neutral-200 dark:border-neutral-500/10 p-3 space-y-2 bg-white dark:bg-black/20">
                   <div className="flex items-center gap-2 mb-2">
                     <Verified className="w-3 h-3 text-neutral-500" />
                     <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Profile Details</span>
                   </div>
                   
                   {profileDataA.description && (
                     <div className="text-[9px] text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                       {profileDataA.description}
                     </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-2">
                     {profileDataA.totalVideos !== undefined && (
                       <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded p-2">
                         <div className="flex items-center gap-1 mb-0.5">
                           <Play className="w-2.5 h-2.5 text-neutral-500" />
                           <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Videos</span>
                         </div>
                         <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">{profileDataA.totalVideos.toLocaleString()}</span>
                       </div>
                     )}
                     {profileDataA.totalViews && (
                       <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded p-2">
                         <div className="flex items-center gap-1 mb-0.5">
                           <Eye className="w-2.5 h-2.5 text-neutral-500" />
                           <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Views</span>
                         </div>
                         <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">{profileDataA.totalViews}</span>
                       </div>
                     )}
                   </div>
                   
                   {profileDataA.engagement && (
                     <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Engagement</span>
                         <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">{profileDataA.engagement}</span>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>

             {/* Subject Beta - Expandable (Arena mode only) */}
             {analysisMode === AnalysisMode.ARENA && (
               <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-500/10 overflow-hidden">
                 <div className="p-3 space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-neutral-700 dark:text-neutral-400 uppercase tracking-widest">Subject Beta</span>
                       <Instagram className="w-3 h-3 text-neutral-700" />
                     </div>
                     <div className="flex items-center gap-1">
                       <button 
                         onClick={() => fetchCreatorProfile(pB.socialUrl, false)}
                         disabled={loadingProfileB}
                         className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-400/20 rounded transition-colors disabled:opacity-50"
                         title="Fetch Instagram/YouTube profile data"
                       >
                         {loadingProfileB ? (
                           <Loader2 className="w-3 h-3 text-neutral-600 animate-spin" />
                         ) : (
                           <RefreshCw className="w-3 h-3 text-neutral-600" />
                         )}
                       </button>
                       <button 
                         onClick={() => {
                           setExpandedProfileB(!expandedProfileB);
                           // Auto-fetch profile when expanding if not already loaded
                           if (!expandedProfileB && !profileDataB && !loadingProfileB) {
                             fetchCreatorProfile(pB.socialUrl, false);
                           }
                         }}
                         className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-400/20 rounded transition-colors"
                       >
                         {expandedProfileB ? (
                           <ChevronUp className="w-3 h-3 text-neutral-600" />
                         ) : (
                           <ChevronDown className="w-3 h-3 text-neutral-600" />
                         )}
                       </button>
                     </div>
                   </div>
                   
                   {profileDataB?.thumbnail && (
                     <img src={profileDataB.thumbnail} alt={pB.name} className="w-full h-20 object-cover rounded-lg" />
                   )}
                   
                   <input value={pB.name} onChange={e => setPB({...pB, name: e.target.value})} placeholder="Creator name" className="w-full text-xs font-bold bg-transparent border-b border-neutral-200 dark:border-neutral-500/20 outline-none pb-1 focus:border-neutral-600" />
                   <div className="flex gap-2">
                     <input value={pB.socialUrl} onChange={e => setPB({...pB, socialUrl: e.target.value})} placeholder="@username or URL" className="flex-1 text-[10px] bg-transparent outline-none text-neutral-400 dark:text-neutral-500 font-mono border-b border-neutral-200 dark:border-neutral-500/20 pb-1" />
                     {profileDataB && profileDataB.platform === 'youtube' && (
                       <a href={`https://youtube.com/${profileDataB.username}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-400/20 rounded transition-colors">
                         <ExternalLink className="w-3 h-3 text-neutral-600" />
                       </a>
                     )}
                   </div>
                   
                   <div className="flex gap-2">
                     <div className="flex-1 bg-white dark:bg-black/40 rounded p-1.5 border border-neutral-100 dark:border-neutral-500/10">
                       <label className="text-[8px] block font-black text-neutral-400 dark:text-neutral-600 uppercase">Followers</label>
                       <input value={pB.followers} onChange={e => setPB({...pB, followers: e.target.value})} className="w-full text-[10px] font-bold bg-transparent outline-none text-neutral-700 dark:text-neutral-400" />
                     </div>
                     <div className="w-16 bg-white dark:bg-black/40 rounded p-1.5 border border-neutral-100 dark:border-neutral-500/10">
                       <label className="text-[8px] block font-black text-neutral-400 dark:text-neutral-600 uppercase">Level</label>
                       <input type="number" value={pB.level} onChange={e => setPB({...pB, level: parseInt(e.target.value)})} className="w-full text-[10px] font-bold bg-transparent outline-none text-neutral-700 dark:text-neutral-400 text-center" />
                     </div>
                   </div>
                 </div>
                 
                 {/* Expanded Details */}
                 {expandedProfileB && profileDataB && (
                   <div className="border-t border-neutral-200 dark:border-neutral-500/10 p-3 space-y-2 bg-white dark:bg-black/20">
                     <div className="flex items-center gap-2 mb-2">
                       <Verified className="w-3 h-3 text-neutral-600" />
                       <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Profile Details</span>
                     </div>
                     
                     {profileDataB.description && (
                       <div className="text-[9px] text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                         {profileDataB.description}
                       </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-2">
                       {profileDataB.totalVideos !== undefined && (
                         <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded p-2">
                           <div className="flex items-center gap-1 mb-0.5">
                             <Play className="w-2.5 h-2.5 text-neutral-600" />
                             <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Videos</span>
                           </div>
                           <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-400">{profileDataB.totalVideos.toLocaleString()}</span>
                         </div>
                       )}
                       {profileDataB.totalViews && (
                         <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded p-2">
                           <div className="flex items-center gap-1 mb-0.5">
                             <Eye className="w-2.5 h-2.5 text-neutral-600" />
                             <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Views</span>
                           </div>
                           <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-400">{profileDataB.totalViews}</span>
                         </div>
                       )}
                     </div>
                     
                     {profileDataB.engagement && (
                       <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-2">
                         <div className="flex items-center justify-between">
                           <span className="text-[7px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Engagement</span>
                           <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-400">{profileDataB.engagement}</span>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* Logic Calibration Controls */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-500/10 space-y-4">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                 <h3 className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Logic Calibration</h3>
               </div>
               <button
                 onClick={() => setPopupContent('logicCalibration')}
                 className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                 title="Expand to full window"
               >
                 <Maximize2 className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-500" />
               </button>
             </div>
             
             {/* System Mode Selector */}
             <div className="space-y-1">
               <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">System Mode</label>
               <div className="flex gap-2">
                 <button
                   onClick={() => { setSystemMode('arena'); setAnalysisMode(AnalysisMode.ARENA); }}
                   className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                     systemMode === 'arena'
                       ? 'bg-neutral-800 dark:bg-neutral-200 dark:text-black text-white shadow-lg'
                       : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                   }`}
                 >
                   <Users className="w-3 h-3 mx-auto mb-1" />
                   Arena (Debate)
                 </button>
                 <button
                   onClick={() => { setSystemMode('solo'); setAnalysisMode(AnalysisMode.MONOLOGUE); }}
                   className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                     systemMode === 'solo'
                       ? 'bg-neutral-800 dark:bg-neutral-200 dark:text-black text-white shadow-lg'
                       : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                   }`}
                 >
                   <Brain className="w-3 h-3 mx-auto mb-1" />
                   Solo Analysis
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Region</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full text-[10px] bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-2 outline-none dark:text-neutral-300">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} className="w-full text-[10px] bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-2 outline-none dark:text-neutral-300">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
             </div>

             <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Target Demography</label>
                  <select value={demography} onChange={e => setDemography(e.target.value)} className="w-full text-[10px] bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-2 outline-none dark:text-neutral-300">
                    {DEMOGRAPHICS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Arbiter Persona</label>
                  <select value={persona} onChange={e => setPersona(e.target.value)} className="w-full text-[10px] bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-2 outline-none dark:text-neutral-300">
                    {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Logic Rigour</label>
                  <select value={logicStyle} onChange={e => setLogicStyle(e.target.value)} className="w-full text-[10px] bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-2 outline-none dark:text-neutral-300">
                    {LOGIC_STYLES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase"><span>Margin of Error</span><span className="text-neutral-600 dark:text-neutral-400">{marginOfError}%</span></div>
                  <input type="range" min="0" max="50" step="1" value={marginOfError} onChange={e => setMarginOfError(parseInt(e.target.value))} className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-500" />
                </div>
             </div>
             
             {/* WSDC Adjudication Matrix Editor */}
             <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-500/10">
               <div className="flex items-center justify-between">
                 <label className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase flex items-center gap-1.5">
                   <Scale className="w-3 h-3" /> WSDC Adjudication Matrix
                 </label>
                 {!editingWeights && (
                   <button
                     onClick={() => {
                       setTempWeights(wsdcWeights);
                       setEditingWeights(true);
                     }}
                     className="text-[7px] font-black uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                   >
                     EDIT WEIGHTS
                   </button>
                 )}
               </div>
               
               {editingWeights ? (
                 <div className="bg-neutral-50 dark:bg-neutral-500/10 rounded-lg p-3 border border-neutral-200 dark:border-neutral-500/20 space-y-3">
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-neutral-600 dark:text-neutral-400">Content (Logic, Evidence)</label>
                       <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-400">{tempWeights.content}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.content}
                       onChange={e => setTempWeights(prev => ({ ...prev, content: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-500"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-neutral-600 dark:text-neutral-400">Style (Rhetoric, Clarity)</label>
                       <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-400">{tempWeights.style}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.style}
                       onChange={e => setTempWeights(prev => ({ ...prev, style: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-500"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-neutral-600 dark:text-neutral-400">Strategy (Structure, Time)</label>
                       <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-400">{tempWeights.strategy}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.strategy}
                       onChange={e => setTempWeights(prev => ({ ...prev, strategy: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-500"
                     />
                   </div>
                   
                   <div className="pt-2 border-t border-neutral-200 dark:border-neutral-500/20">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 uppercase">Total:</span>
                       <span className={`text-[10px] font-black ${
                         tempWeights.content + tempWeights.style + tempWeights.strategy === 100
                           ? 'text-neutral-600 dark:text-neutral-400'
                           : 'text-red-600 dark:text-red-400'
                       }`}>
                         {tempWeights.content + tempWeights.style + tempWeights.strategy}%
                       </span>
                     </div>
                     {tempWeights.content + tempWeights.style + tempWeights.strategy !== 100 && (
                       <p className="text-[7px] text-red-600 dark:text-red-400 font-medium mb-2">⚠️ Weights must sum to 100%</p>
                     )}
                     <div className="flex gap-2">
                       <button
                         onClick={validateAndApplyWeights}
                         disabled={tempWeights.content + tempWeights.style + tempWeights.strategy !== 100}
                         className="flex-1 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Apply
                       </button>
                       <button
                         onClick={resetWeights}
                         className="px-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Reset
                       </button>
                       <button
                         onClick={() => {
                           setEditingWeights(false);
                           setTempWeights(wsdcWeights);
                         }}
                         className="px-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Cancel
                       </button>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex gap-2 items-center">
                   <div className="flex-1 bg-neutral-800 dark:bg-neutral-200 dark: text-black rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Content</div>
                     <div className="text-[11px] font-black">{wsdcWeights.content}%</div>
                   </div>
                   <div className="flex-1 bg-neutral-700 dark:bg-neutral-300 dark:text-black rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Style</div>
                     <div className="text-[11px] font-black">{wsdcWeights.style}%</div>
                   </div>
                   <div className="flex-1 bg-neutral-800 dark:bg-neutral-200 dark: text-black rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Strategy</div>
                     <div className="text-[11px] font-black">{wsdcWeights.strategy}%</div>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Neural RAG Binding - UPDATED with specific examples and file placeholders */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-500/10 space-y-4">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <ClipboardList className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                 <h3 className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Knowledge Ingestion</h3>
               </div>
               <button
                 onClick={() => setPopupContent('knowledgeIngestion')}
                 className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                 title="Expand to full window"
               >
                 <Maximize2 className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-500" />
               </button>
             </div>
             
             {/* Supervisor Prompt - Auto-Generated from Logic Calibrator */}
             <div className="space-y-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
               <label className="flex items-center gap-2 text-[9px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  <Brain className="w-3.5 h-3.5" /> Supervisor Intelligence Directive (Auto-Generated)
               </label>
               <div className="w-full bg-white dark:bg-black/40 text-[9px] font-mono leading-relaxed border border-neutral-300 dark:border-neutral-700 rounded-lg p-4 max-h-64 overflow-y-auto text-neutral-700 dark:text-neutral-300 space-y-3">
                 <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700 pb-2">
                   <Settings2 className="w-3.5 h-3.5" />
                   <span>ACTIVE CALIBRATION PARAMETERS</span>
                 </div>
                 <div className="space-y-2 text-[9px]">
                   <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded p-2 space-y-1">
                     <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">System Mode:</span> <span className="text-neutral-900 dark:text-neutral-100 font-medium">{systemMode === 'arena' ? 'DEBATE ANALYSIS (Arena)' : 'SOLO CONTENT ANALYSIS'}</span></p>
                     <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Participants:</span> <span className="text-neutral-900 dark:text-neutral-100 font-medium">{systemMode === 'arena' ? `${pA.name} vs ${pB.name}` : pA.name}</span></p>
                   </div>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Region:</span> <span className="text-neutral-900 dark:text-neutral-100">{country} ({year})</span></p>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Audience:</span> <span className="text-neutral-900 dark:text-neutral-100">{demography}</span></p>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Persona:</span> <span className="text-neutral-900 dark:text-neutral-100">{persona}</span></p>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Logic:</span> <span className="text-neutral-900 dark:text-neutral-100">{logicStyle}</span></p>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Mode:</span> <span className="text-neutral-900 dark:text-neutral-100">{stakeholderMode}</span></p>
                   <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Error Margin:</span> <span className="text-neutral-900 dark:text-neutral-100">±{marginOfError}%</span></p>
                   <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded p-2 mt-2 space-y-1">
                     <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">WSDC ADJUDICATION MATRIX:</p>
                     <p className="ml-2"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Content:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.content}%</span></p>
                     <p className="ml-2"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Style:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.style}%</span></p>
                     <p className="ml-2"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Strategy:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.strategy}%</span></p>
                     <p className="ml-2 text-neutral-700 dark:text-neutral-300 font-medium mt-1">Total: {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}%</p>
                   </div>
                 </div>
               </div>
               <div className="flex items-start gap-2 text-[9px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                 <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                 <span>This directive is automatically populated from Logic Calibrator settings. Adjust calibration controls to dynamically reconfigure RAG orchestration.</span>
               </div>
             </div>

             <div className="space-y-2">
               <label className="flex items-center gap-1.5 text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                  <LinkIcon className="w-2.5 h-2.5" /> Reference URLs
               </label>
               <textarea 
                  value={ragUrls} 
                  onChange={e => setRagUrls(e.target.value)} 
                  className="w-full bg-neutral-50 dark:bg-black/40 text-[10px] font-mono border border-neutral-200 dark:border-neutral-500/20 rounded-xl p-3 h-20 outline-none text-neutral-700 dark:text-neutral-400 focus:border-neutral-500 dark:focus:border-neutral-500/50 transition-all shadow-inner" 
                  placeholder={"https://ipcc.ch/report/...\nhttps://fbref.com/en/..."} 
               />
               <div className="flex items-center justify-between pt-2">
                 <label className="flex items-center gap-2 text-[9px] text-neutral-600 dark:text-neutral-400">
                   <input
                     type="checkbox"
                     checked={enableRAG}
                     onChange={(e) => setEnableRAG(e.target.checked)}
                     className="rounded border-neutral-300 dark:border-neutral-600"
                   />
                   <span className="font-medium">Enable Enhanced RAG</span>
                   <span className="text-[8px] text-neutral-500 dark:text-neutral-500">(Auto-search, fact-check, semantic search)</span>
                 </label>
                 {enableRAG && (
                   <span className="text-[8px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">
                     ACTIVE
                   </span>
                 )}
               </div>
             </div>

             <div className="space-y-2">
               <label className="flex items-center gap-1.5 text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                  <FileText className="w-2.5 h-2.5" /> Files / Transcripts
               </label>
               <div 
                  onClick={() => contextInputRef.current?.click()} 
                  className="p-4 border-2 border-dashed border-neutral-200 dark:border-neutral-500/10 rounded-2xl bg-neutral-50 dark:bg-black/20 hover:bg-neutral-100 dark:hover:bg-black/40 transition-all flex flex-col items-center justify-center cursor-pointer group"
               >
                  <FileUp className="w-5 h-5 text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-500 mb-2" />
                  <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-widest group-hover:text-neutral-600 dark:group-hover:text-neutral-400">
                    Drop .pdf / .txt / .vtt here
                  </span>
                  <input ref={contextInputRef} type="file" className="hidden" multiple onChange={handleContextUpload} />
               </div>
               {contextFiles.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                   {contextFiles.slice(0, 3).map((f, i) => (
                     <span key={i} className="text-[7px] font-bold bg-neutral-50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-100 dark:border-neutral-500/20 truncate max-w-[80px]">{f}</span>
                   ))}
                   {contextFiles.length > 3 && <span className="text-[7px] font-bold text-neutral-400">+{contextFiles.length - 3} more</span>}
                 </div>
               )}
             </div>
          </div>

        </aside>

        {/* Main Feed: Conditional rendering based on input mode */}
        {inputMode === 'live' ? (
          /* Phase 5: Live Debate Panel */
          <main className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto bg-neutral-100/50 dark:bg-neutral-950/50">
            <LiveDebatePanel
              onSessionComplete={handleLiveDebateComplete}
              onTranscriptReady={handleLiveTranscriptReady}
              initialParticipantA={{
                name: pA.name,
                affiliation: '',
                role: 'proposition'
              }}
              initialParticipantB={analysisMode === AnalysisMode.ARENA ? {
                name: pB.name,
                affiliation: '',
                role: 'opposition'
              } : undefined}
            />
          </main>
        ) : (
          /* Content Analysis Mode - Original UI */
          <main className="flex-1 flex flex-col min-w-0 p-6 space-y-6 overflow-y-auto bg-neutral-100/50 dark:bg-neutral-950/50">
          
          <div className="grid xxl:grid-cols-[1fr_350px] gap-6">
            <div className="space-y-6">
               {/* Analysis Input Zone */}
               <div className="bg-white dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-500/20 p-8 relative overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Input Stream</h4>
                         <button
                           onClick={() => setPopupContent('inputStream')}
                           className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                           title="Expand to full window"
                         >
                           <Maximize2 className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-500" />
                         </button>
                       </div>
                       <div className="aspect-video bg-neutral-50 dark:bg-black/40 rounded-lg border border-neutral-200 dark:border-neutral-500/20 flex flex-col items-center justify-center overflow-hidden relative group">
                         {processingFile ? (
                           <div className="flex flex-col items-center gap-3">
                             <Loader2 className="w-12 h-12 text-neutral-500 animate-spin" />
                             <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Processing File...</p>
                             <p className="text-[8px] font-medium text-neutral-400 dark:text-neutral-600 mt-1">Transcribing audio/video content</p>
                           </div>
                         ) : isRecording ? (
                           <div className="flex flex-col items-center gap-3">
                             <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                               <div className="w-6 h-6 bg-red-500 rounded-full" />
                             </div>
                             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Recording...</p>
                             <p className="text-[8px] font-medium text-neutral-400 dark:text-neutral-600 mt-1 max-w-[200px] text-center truncate">
                               {interimTranscript ? interimTranscript.slice(-50) + '...' : 'Listening...'}
                             </p>
                             <button
                               onClick={stopMicrophoneRecording}
                               className="mt-2 px-4 py-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full hover:bg-red-600 transition-colors"
                             >
                               Stop Recording
                             </button>
                           </div>
                         ) : video ? (
                           videoMime === 'video/youtube' ? (
                             <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                               <Play className="w-12 h-12 text-neutral-500" />
                               <div className="text-center">
                                 <p className="text-[10px] font-black text-neutral-600 dark:text-neutral-300 mb-1">YouTube Video Selected</p>
                                 <p className="text-[8px] font-medium text-neutral-400 dark:text-neutral-600 truncate max-w-xs">{video}</p>
                               </div>
                             </div>
                           ) : (
                             <video src={video} className="w-full h-full object-contain" controls />
                           )
                         ) : (
                           <>
                             <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                               <History className="w-5 h-5 text-neutral-500" />
                             </div>
                             <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">System Idle</p>
                             <p className="text-[8px] font-medium text-neutral-400 dark:text-neutral-600 mt-1 mb-4">Select input source below</p>
                             
                             {/* Quick Input Action Buttons */}
                             <div className="flex gap-2 mt-2">
                               <button
                                 onClick={() => fileInputRef.current?.click()}
                                 disabled={processingFile || isRecording}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50 text-[9px] font-bold text-neutral-600 dark:text-neutral-300"
                               >
                                 <Upload className="w-3 h-3" /> Upload
                               </button>
                               <button
                                 onClick={() => setShowVideoSearch(true)}
                                 disabled={processingFile || isRecording}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600 hover:border-red-400 transition-colors disabled:opacity-50 text-[9px] font-bold text-red-600 dark:text-red-400"
                               >
                                 <Youtube className="w-3 h-3" /> YouTube
                               </button>
                               <button
                                 onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
                                 disabled={processingFile}
                                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 text-[9px] font-bold ${
                                   isRecording 
                                     ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-600 animate-pulse' 
                                     : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                                 }`}
                               >
                                 {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                 {isRecording ? 'Stop' : 'Record'}
                               </button>
                             </div>
                           </>
                         )}
                         <input ref={fileInputRef} type="file" className="hidden" accept="video/*,audio/*,.srt,.vtt,.txt" onChange={handleVideoUpload} />
                       </div>
                       
                       {/* Input Metadata Display */}
                       {inputMetadata && (
                         <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 border border-green-100 dark:border-green-500/20 mt-3">
                           <div className="flex items-center justify-between">
                             <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
                               <Verified className="w-3 h-3" /> Input Processed
                             </span>
                             <span className="text-[8px] font-bold text-green-600 dark:text-green-400">
                               {inputMetadata.wordCount} words • {(inputMetadata.confidence * 100).toFixed(0)}% confidence
                             </span>
                           </div>
                           <p className="text-[7px] text-neutral-500 dark:text-neutral-400 mt-1">
                             Source: {inputMetadata.source} • Lang: {inputMetadata.language}
                             {inputMetadata.duration ? ` • ${Math.round(inputMetadata.duration)}s` : ''}
                           </p>
                         </div>
                       )}
                       
                       {/* Transcript Status */}
                       {videoMime === 'video/youtube' && (
                         <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-100 dark:border-neutral-500/20 mt-4">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                               <FileText className="w-3 h-3 text-neutral-500" />
                               Transcript Status
                             </span>
                             {transcript && (
                               <span className="text-[8px] font-bold text-neutral-600 dark:text-neutral-400">
                                 {Math.round(transcript.length / 1000)}K chars
                               </span>
                             )}
                           </div>
                           {loadingTranscript ? (
                             <div className="flex items-center gap-2 text-[8px] text-neutral-500 dark:text-neutral-400">
                               <Loader2 className="w-3 h-3 animate-spin" />
                               Fetching transcript...
                             </div>
                           ) : transcriptError ? (
                             <div className="flex items-center gap-2 text-[8px] text-red-500">
                               <AlertCircle className="w-3 h-3" />
                               {transcriptError}
                             </div>
                           ) : transcript ? (
                             <div className="space-y-2">
                               <div className="flex items-center gap-2 text-[8px] text-green-600 dark:text-green-400 font-bold">
                                 <Verified className="w-3 h-3" />
                                 Ready for Analysis
                               </div>
                               <div className="max-h-20 overflow-y-auto text-[7px] text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-black/20 rounded p-2 border border-neutral-200 dark:border-neutral-700">
                                 {transcript.substring(0, 300)}...
                               </div>
                             </div>
                           ) : (
                             <div className="text-[8px] text-neutral-400 dark:text-neutral-600">
                               No transcript loaded
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Gavel className="w-3.5 h-3.5 text-neutral-500" /> Arbiter Tuning</h4>
                         <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">Preset:</span>
                           <select 
                             value={arbiterPreset} 
                             onChange={(e) => {
                               setArbiterPreset(e.target.value);
                               if (e.target.value !== 'custom') {
                                 setPrompt(PRESET_PROMPTS[e.target.value as keyof typeof PRESET_PROMPTS]);
                               }
                             }}
                             className="text-[9px] font-bold bg-neutral-50 dark:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 rounded-lg px-2 py-1 outline-none text-neutral-600 dark:text-neutral-400 cursor-pointer"
                           >
                             {Object.entries(ARBITER_PRESETS).map(([key, label]) => (
                               <option key={key} value={key}>{label}</option>
                             ))}
                           </select>
                         </div>
                       </div>
                       <textarea 
                         value={prompt} 
                         onChange={(e) => {
                           setPrompt(e.target.value);
                           setArbiterPreset('custom');
                         }} 
                         className="flex-1 w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-500/20 rounded-lg p-4 text-[11px] font-medium leading-relaxed outline-none focus:ring-2 focus:ring-neutral-500/30 resize-none text-neutral-700 dark:text-neutral-300 min-h-[180px]" 
                         placeholder="Execute specific syllogistic query..."
                       />
                       <div className="flex items-start gap-2 text-[8px] text-neutral-600 dark:text-neutral-400 leading-tight">
                         <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                         <span className="font-medium">This query defines analysis focus and depth. Select preset or write custom instructions. More specific = better results.</span>
                       </div>
                       
                       {/* Input Status Indicator */}
                       {!hasValidInput && (
                         <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-600/30 rounded-lg text-[9px] text-amber-700 dark:text-amber-400">
                           <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                           <span className="font-medium">No input source loaded. Upload video, search YouTube, or add RAG URLs for accurate analysis.</span>
                         </div>
                       )}
                       
                       <button onClick={runAnalysis} disabled={loading} className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 group ${
                         hasValidInput 
                           ? 'bg-black hover:bg-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 text-white' 
                           : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white'
                       }`}>
                         {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />} 
                         {hasValidInput ? 'Execute Audit' : 'Run Demo Analysis'}
                       </button>
                    </div>
                  </div>
               </div>

               {/* Cognitive Output Area */}
               <div className="bg-white dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-500/20 flex flex-col overflow-hidden min-h-[600px] relative mt-8">
                  <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-500/10 bg-neutral-50 dark:bg-black/20 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-neutral-500" /><h3 className="text-[10px] font-black text-neutral-500 dark:text-neutral-500 uppercase tracking-widest">Logical Adjudication Matrix</h3></div>
                       {result && (
                         <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-500/20">
                           <button 
                             onClick={() => setVisualMode(true)}
                             className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${visualMode ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400 dark:text-neutral-500'}`}
                           >
                             <Eye className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => setVisualMode(false)}
                             className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${!visualMode ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400 dark:text-neutral-500'}`}
                           >
                             <FileText className="w-3 h-3" />
                           </button>
                         </div>
                       )}
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black bg-neutral-100 dark:bg-neutral-500/10 text-neutral-700 dark:text-neutral-500 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-500/20 uppercase tracking-widest">Truth Density: {reliability}%</span>
                        <div className="w-2 h-2 rounded-full bg-neutral-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     </div>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto">
                    {loading ? (
                       <div className="h-full flex flex-col items-center justify-center gap-8">
                          <div className="relative">
                             <Brain className="w-16 h-16 text-neutral-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                             <div className="absolute inset-0 border-2 border-neutral-500/30 rounded-full animate-ping" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 animate-pulse">Extracting Toulmin Nodes</p>
                       </div>
                    ) : result ? (
                       visualMode && extractedJSON ? (
                         <div className="space-y-6">
                           {/* Visual Mode: Cards and Charts */}
                           <div className="grid grid-cols-2 gap-4">
                             {/* Winner Card */}
                             <div className="col-span-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-500/30 p-8 text-center">
                               <div className="flex items-center justify-center gap-3 mb-4">
                                 <Verified className="w-7 h-7 text-neutral-600 dark:text-neutral-300" />
                                 <h3 className="text-xl font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Result: {extractedJSON.gamification?.winner || 'TIE'}</h3>
                               </div>
                               <div className="flex justify-center gap-8 text-sm font-bold">
                                 <div className="text-neutral-600 dark:text-neutral-300">{pA.name}: {extractedJSON.gamification?.points_a || arenaStats.pointsA} pts</div>
                                 {analysisMode === AnalysisMode.ARENA && <div className="text-neutral-700 dark:text-neutral-400">{pB.name}: {extractedJSON.gamification?.points_b || arenaStats.pointsB} pts</div>}
                               </div>
                             </div>
                             
                             {/* WSDC Scores Visual */}
                             {extractedJSON.scores && (
                               <div className="col-span-2 space-y-4">
                                 <h4 className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                   <Scale className="w-4 h-4" /> WSDC Score Breakdown
                                 </h4>
                                 {Object.entries(extractedJSON.scores).filter(([key]) => key !== 'total').map(([category, scores]: [string, any]) => (
                                   <div key={category} className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-black uppercase">
                                       <span className="text-neutral-600 dark:text-neutral-400">{category}</span>
                                       <div className="flex gap-4">
                                         <span className="text-neutral-600 dark:text-neutral-300">A: {scores.a}</span>
                                         {scores.b !== undefined && <span className="text-neutral-700 dark:text-neutral-400">B: {scores.b}</span>}
                                       </div>
                                     </div>
                                     <div className="relative h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                                       <div className="absolute left-0 top-0 h-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-end pr-2 transition-all duration-500" style={{width: `${(scores.a / (scores.a + (scores.b || 0))) * 100}%`}}>
                                         <span className="text-[10px] font-black text-white">{scores.a}</span>
                                       </div>
                                       {scores.b !== undefined && (
                                         <div className="absolute right-0 top-0 h-full bg-neutral-600 dark:bg-neutral-400 flex items-center justify-start pl-2 transition-all duration-500" style={{width: `${(scores.b / (scores.a + scores.b)) * 100}%`}}>
                                           <span className="text-[10px] font-black text-white">{scores.b}</span>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                             
                             {/* Key Insights */}
                             {extractedJSON.final_verdict && (
                               <>
                                 <div className="bg-neutral-50 dark:bg-neutral-500/10 rounded-lg border border-neutral-200 dark:border-neutral-500/20 p-5">
                                   <h4 className="text-[10px] font-black text-neutral-700 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                     <Zap className="w-3.5 h-3.5" /> Strongest Position
                                   </h4>
                                   <p className="text-[11px] font-medium text-neutral-900 dark:text-neutral-300 leading-relaxed">{extractedJSON.final_verdict.strongest_argument}</p>
                                 </div>
                                 <div className="bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20 p-5">
                                   <h4 className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                     <AlertCircle className="w-3.5 h-3.5" /> Weakest Position
                                   </h4>
                                   <p className="text-[11px] font-medium text-red-900 dark:text-red-300 leading-relaxed">{extractedJSON.final_verdict.weakest_argument}</p>
                                 </div>
                                 {extractedJSON.final_verdict.key_fallacies?.length > 0 && (
                                   <div className="col-span-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20 p-5">
                                     <h4 className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                       <Activity className="w-3.5 h-3.5" /> Logical Fallacies Identified
                                     </h4>
                                     <div className="space-y-1">
                                       {extractedJSON.final_verdict.key_fallacies.slice(0, 5).map((f: string, i: number) => (
                                         <p key={i} className="text-[10px] font-medium text-orange-900 dark:text-orange-300 leading-relaxed flex items-start gap-2">
                                           <span className="text-orange-500 shrink-0">•</span>
                                           <span>{f}</span>
                                         </p>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                               </>
                             )}
                             
                             {/* Summary */}
                             {extractedJSON.final_verdict?.summary && (
                               <div className="col-span-2 bg-neutral-50 dark:bg-neutral-500/10 rounded-lg border border-neutral-200 dark:border-neutral-500/20 p-5">
                                 <h4 className="text-[10px] font-black text-neutral-700 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                   <BarChart3 className="w-3.5 h-3.5" /> Summary
                                 </h4>
                                 <p className="text-[11px] font-medium text-neutral-900 dark:text-neutral-300 leading-relaxed">{extractedJSON.final_verdict.summary}</p>
                               </div>
                             )}
                             
                             {/* ═══════════════════════════════════════════════════════════════ */}
                             {/* SCORING ENGINE BREAKDOWN (Phase 2) */}
                             {/* ═══════════════════════════════════════════════════════════════ */}
                             {scoringResult && (
                               <>
                                 {/* Scoring Engine Header */}
                                 <div className="col-span-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-600 p-5">
                                   <div className="flex items-center justify-between mb-4">
                                     <h4 className="text-[10px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                                       <Scale className="w-3.5 h-3.5 text-neutral-500" /> Scoring Engine Analysis
                                     </h4>
                                     <div className="flex items-center gap-2">
                                       <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400">
                                         Margin: ±{marginOfError}% | Claims: {scoringResult.claims.length} | Fallacies: {scoringResult.fallacies.length}
                                       </span>
                                       <button
                                         onClick={() => setShowAuditLog(!showAuditLog)}
                                         className={`text-[8px] font-bold px-2 py-1 rounded transition-colors ${
                                           showAuditLog 
                                             ? 'bg-neutral-500 text-white' 
                                             : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                                         }`}
                                       >
                                         {showAuditLog ? 'Hide' : 'Show'} Audit Log
                                       </button>
                                     </div>
                                   </div>
                                   
                                   {/* Score Comparison */}
                                   <div className="grid grid-cols-2 gap-4 mb-4">
                                     {/* Participant A Score */}
                                     <div className="bg-white dark:bg-black/20 rounded-lg p-4 border border-neutral-200 dark:border-neutral-500/20">
                                       <div className="flex items-center justify-between mb-3">
                                         <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{scoringResult.participantA.name}</span>
                                         <span className={`text-lg font-black ${getScoreColorClass(scoringResult.participantA.totalScore)}`}>
                                           {formatScore(scoringResult.participantA.totalScore)}
                                         </span>
                                       </div>
                                       <div className="space-y-1 text-[9px]">
                                         <div className="flex justify-between">
                                           <span className="text-green-600">✓ Verified Facts</span>
                                           <span className="font-bold text-green-600">+{scoringResult.participantA.breakdown.positive.verifiedFacts.points}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span className="text-green-600">✓ Evidence</span>
                                           <span className="font-bold text-green-600">+{scoringResult.participantA.breakdown.positive.strongEvidence.points}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span className="text-red-500">✗ Fallacies ({scoringResult.participantA.breakdown.negative.fallacies.count})</span>
                                           <span className="font-bold text-red-500">-{scoringResult.participantA.breakdown.negative.fallacies.points}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span className="text-orange-500">✗ Unverified</span>
                                           <span className="font-bold text-orange-500">-{scoringResult.participantA.breakdown.negative.unverified.points}</span>
                                         </div>
                                         <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-600">
                                           <span className="text-neutral-600 dark:text-neutral-400">WSDC Bonus</span>
                                           <span className="font-bold text-neutral-600 dark:text-neutral-400">+{scoringResult.participantA.breakdown.wsdcBonus.toFixed(1)}</span>
                                         </div>
                                       </div>
                                       <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                                         <div className="flex justify-between text-[8px]">
                                           <span className="text-neutral-500">Truth Density</span>
                                           <span className="font-bold text-neutral-600">{scoringResult.participantA.truthDensity.toFixed(0)}%</span>
                                         </div>
                                         {scoringResult.participantA.marginOfErrorApplied > 0 && (
                                           <div className="flex justify-between text-[8px]">
                                             <span className="text-neutral-500">Penalties Waived</span>
                                             <span className="font-bold text-neutral-600">{scoringResult.participantA.marginOfErrorApplied}</span>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                     
                                     {/* Participant B Score (if arena mode) */}
                                     {scoringResult.participantB && (
                                       <div className="bg-white dark:bg-black/20 rounded-lg p-4 border border-neutral-200 dark:border-neutral-600/20">
                                         <div className="flex items-center justify-between mb-3">
                                           <span className="text-xs font-bold text-neutral-700 dark:text-neutral-400">{scoringResult.participantB.name}</span>
                                           <span className={`text-lg font-black ${getScoreColorClass(scoringResult.participantB.totalScore)}`}>
                                             {formatScore(scoringResult.participantB.totalScore)}
                                           </span>
                                         </div>
                                         <div className="space-y-1 text-[9px]">
                                           <div className="flex justify-between">
                                             <span className="text-green-600">✓ Verified Facts</span>
                                             <span className="font-bold text-green-600">+{scoringResult.participantB.breakdown.positive.verifiedFacts.points}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span className="text-green-600">✓ Evidence</span>
                                             <span className="font-bold text-green-600">+{scoringResult.participantB.breakdown.positive.strongEvidence.points}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span className="text-red-500">✗ Fallacies ({scoringResult.participantB.breakdown.negative.fallacies.count})</span>
                                             <span className="font-bold text-red-500">-{scoringResult.participantB.breakdown.negative.fallacies.points}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span className="text-orange-500">✗ Unverified</span>
                                             <span className="font-bold text-orange-500">-{scoringResult.participantB.breakdown.negative.unverified.points}</span>
                                           </div>
                                           <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-600">
                                             <span className="text-neutral-600 dark:text-neutral-400">WSDC Bonus</span>
                                             <span className="font-bold text-neutral-600 dark:text-neutral-400">+{scoringResult.participantB.breakdown.wsdcBonus.toFixed(1)}</span>
                                           </div>
                                         </div>
                                         <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                                           <div className="flex justify-between text-[8px]">
                                             <span className="text-neutral-500">Truth Density</span>
                                             <span className="font-bold text-neutral-600">{scoringResult.participantB.truthDensity.toFixed(0)}%</span>
                                           </div>
                                           {scoringResult.participantB.marginOfErrorApplied > 0 && (
                                             <div className="flex justify-between text-[8px]">
                                               <span className="text-neutral-500">Penalties Waived</span>
                                               <span className="font-bold text-neutral-600">{scoringResult.participantB.marginOfErrorApplied}</span>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                   
                                   {/* Audit Log (Collapsible) */}
                                   {showAuditLog && (
                                     <div className="bg-neutral-900 dark:bg-black rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[8px] text-green-400">
                                       {scoringResult.auditLog.map((entry, i) => (
                                         <div key={i} className={`${
                                           entry.category === 'decision' ? 'text-yellow-400' :
                                           entry.category === 'margin' ? 'text-neutral-400' :
                                           entry.category === 'fallacy' ? 'text-red-400' :
                                           entry.category === 'claim' ? 'text-green-400' :
                                           'text-neutral-400'
                                         }`}>
                                           [{entry.timestamp}] [{entry.category.toUpperCase()}] {entry.message}
                                         </div>
                                       ))}
                                     </div>
                                   )}
                                 </div>
                                 
                                 {/* Fallacy Details */}
                                 {scoringResult.fallacies.length > 0 && (
                                   <div className="col-span-2 bg-red-50 dark:bg-red-500/5 rounded-lg border border-red-200 dark:border-red-500/20 p-5">
                                     <h4 className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                       <Activity className="w-3.5 h-3.5" /> Detected Fallacies ({scoringResult.fallacies.length})
                                     </h4>
                                     <div className="space-y-2 max-h-48 overflow-y-auto">
                                       {scoringResult.fallacies.map((f) => (
                                         <div 
                                           key={f.id} 
                                           className={`p-3 rounded border ${getSeverityColorClass(f.severity)} ${f.withinMarginOfError ? 'opacity-50' : ''}`}
                                         >
                                           <div className="flex items-center justify-between mb-1">
                                             <span className="text-[10px] font-black uppercase">
                                               [{f.speaker}] {FALLACY_DISPLAY_NAMES[f.type] || f.type}
                                             </span>
                                             <div className="flex items-center gap-2">
                                               <span className="text-[8px] font-bold">Sev: {f.severity}/10</span>
                                               {f.withinMarginOfError ? (
                                                 <span className="text-[8px] font-bold text-green-600 bg-green-100 px-1.5 rounded">WAIVED</span>
                                               ) : (
                                                 <span className="text-[8px] font-bold text-red-600">-{f.penalty} pts</span>
                                               )}
                                             </div>
                                           </div>
                                           <p className="text-[9px] italic text-neutral-600 dark:text-neutral-400">"{f.quote}"</p>
                                           <p className="text-[8px] text-neutral-500 mt-1">{f.explanation}</p>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                                 
                                 {/* Claims Summary */}
                                 {scoringResult.claims.length > 0 && (
                                   <div className="col-span-2 bg-neutral-50 dark:bg-neutral-500/5 rounded-lg border border-neutral-200 dark:border-neutral-500/20 p-5">
                                     <h4 className="text-[10px] font-black text-neutral-700 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                       <Verified className="w-3.5 h-3.5" /> Verified Claims ({scoringResult.claims.filter(c => c.verificationStatus === 'verified').length}/{scoringResult.claims.length})
                                     </h4>
                                     <div className="grid grid-cols-4 gap-2 mb-3">
                                       <div className="text-center p-2 bg-green-100 dark:bg-green-500/10 rounded">
                                         <div className="text-lg font-black text-green-600">{scoringResult.claims.filter(c => c.verificationStatus === 'verified').length}</div>
                                         <div className="text-[8px] font-bold text-green-600">Verified</div>
                                       </div>
                                       <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded">
                                         <div className="text-lg font-black text-yellow-600">{scoringResult.claims.filter(c => c.verificationStatus === 'partially_true').length}</div>
                                         <div className="text-[8px] font-bold text-yellow-600">Partial</div>
                                       </div>
                                       <div className="text-center p-2 bg-orange-100 dark:bg-orange-500/10 rounded">
                                         <div className="text-lg font-black text-orange-600">{scoringResult.claims.filter(c => c.verificationStatus === 'unverifiable').length}</div>
                                         <div className="text-[8px] font-bold text-orange-600">Unverified</div>
                                       </div>
                                       <div className="text-center p-2 bg-red-100 dark:bg-red-500/10 rounded">
                                         <div className="text-lg font-black text-red-600">{scoringResult.claims.filter(c => c.verificationStatus === 'false').length}</div>
                                         <div className="text-[8px] font-bold text-red-600">False</div>
                                       </div>
                                     </div>
                                     <div className="space-y-1 max-h-32 overflow-y-auto">
                                       {scoringResult.claims.slice(0, 10).map((c) => (
                                         <div key={c.id} className="flex items-start gap-2 text-[9px]">
                                           <span className={`shrink-0 font-bold ${
                                             c.verificationStatus === 'verified' ? 'text-green-600' :
                                             c.verificationStatus === 'false' ? 'text-red-600' :
                                             'text-neutral-400'
                                           }`}>
                                             [{c.speaker}]
                                           </span>
                                           <span className="text-neutral-600 dark:text-neutral-400 truncate">{c.text}</span>
                                           <span className={`shrink-0 font-bold ${c.pointValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                             {c.pointValue >= 0 ? '+' : ''}{c.pointValue}
                                           </span>
                                         </div>
                                       ))}
                                       {scoringResult.claims.length > 10 && (
                                         <div className="text-[8px] text-neutral-400 italic">...and {scoringResult.claims.length - 10} more claims</div>
                                       )}
                                     </div>
                                     
                                     {/* Phase 3: Enhanced Fact Verification Button */}
                                     <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-500/20 flex items-center justify-between">
                                       <button
                                         onClick={runManualFactVerification}
                                         disabled={isVerifyingFacts || scoringResult.claims.length === 0}
                                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                           isVerifyingFacts 
                                             ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 cursor-wait'
                                             : 'bg-neutral-800 dark:bg-neutral-200 text-white hover:from-neutral-600 hover:bg-neutral-600 shadow-lg hover:shadow-neutral-500/25'
                                         }`}
                                       >
                                         {isVerifyingFacts ? (
                                           <>
                                             <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                             Verifying... {verificationProgress}%
                                           </>
                                         ) : (
                                           <>
                                             <ShieldCheck className="w-3.5 h-3.5" />
                                             Deep Verify All Claims
                                           </>
                                         )}
                                       </button>
                                       
                                       {factVerificationReport && (
                                         <button
                                           onClick={() => setShowFactPanel(!showFactPanel)}
                                           className={`text-[9px] font-bold px-3 py-1.5 rounded transition-colors ${
                                             showFactPanel 
                                               ? 'bg-neutral-500 text-white' 
                                               : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                                           }`}
                                         >
                                           {showFactPanel ? 'Hide' : 'Show'} Verification Report
                                         </button>
                                       )}
                                     </div>
                                   </div>
                                 )}
                                 
                                 {/* ═══════════════════════════════════════════════════════════════ */}
                                 {/* PHASE 3: ENHANCED FACT VERIFICATION PANEL */}
                                 {/* ═══════════════════════════════════════════════════════════════ */}
                                 {showFactPanel && (
                                   <div className="col-span-2">
                                     <FactVerificationPanel
                                       report={factVerificationReport}
                                       isLoading={isVerifyingFacts}
                                       progress={verificationProgress}
                                       currentClaim={currentVerificationClaim}
                                       onRetryVerification={runManualFactVerification}
                                     />
                                   </div>
                                 )}
                                 
                                 {/* ═══════════════════════════════════════════════════════════════ */}
                                 {/* PHASE 4: ADVANCED FEATURES PANEL */}
                                 {/* ═══════════════════════════════════════════════════════════════ */}
                                 {scoringResult && (
                                   <div className="col-span-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-500/20 p-5">
                                     <h4 className="text-[10px] font-black text-neutral-700 dark:text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                       <Zap className="w-3.5 h-3.5" /> Advanced Features
                                     </h4>
                                     
                                     <div className="grid grid-cols-4 gap-3">
                                       {/* Speaker Diarization Button */}
                                       <button
                                         onClick={runSpeakerDiarization}
                                         disabled={isDiarizing || !transcript}
                                         className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all ${
                                           isDiarizing 
                                             ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 cursor-wait'
                                             : !transcript
                                             ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                             : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 hover:border-neutral-400'
                                         }`}
                                         title="Identify and label speakers in the transcript"
                                       >
                                         {isDiarizing ? (
                                           <Loader2 className="w-5 h-5 animate-spin" />
                                         ) : (
                                           <Users className="w-5 h-5" />
                                         )}
                                         <span className="text-[9px] font-bold uppercase">
                                           {isDiarizing ? 'Analyzing...' : 'Speaker ID'}
                                         </span>
                                       </button>

                                       {/* Export PDF Button */}
                                       <button
                                         onClick={() => handleExport('pdf')}
                                         disabled={isExporting}
                                         className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 hover:border-neutral-400 transition-all"
                                         title="Export analysis as PDF report"
                                       >
                                         <FileText className="w-5 h-5" />
                                         <span className="text-[9px] font-bold uppercase">Export PDF</span>
                                       </button>

                                       {/* Export JSON Button */}
                                       <button
                                         onClick={() => handleExport('json')}
                                         disabled={isExporting}
                                         className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 hover:border-neutral-400 transition-all"
                                         title="Export analysis as JSON data"
                                       >
                                         <Download className="w-5 h-5" />
                                         <span className="text-[9px] font-bold uppercase">Export JSON</span>
                                       </button>

                                       {/* Export Markdown Button */}
                                       <button
                                         onClick={() => handleExport('markdown')}
                                         disabled={isExporting}
                                         className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600/10 border border-neutral-200 dark:border-neutral-500/20 hover:border-neutral-400 transition-all"
                                         title="Export analysis as Markdown"
                                       >
                                         <FileText className="w-5 h-5" />
                                         <span className="text-[9px] font-bold uppercase">Markdown</span>
                                       </button>
                                     </div>

                                     {/* Language Selector */}
                                     <div className="mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-500/10">
                                       <div className="flex items-center justify-between">
                                         <label className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 uppercase">
                                           Transcription Language
                                         </label>
                                         <select
                                           value={selectedLanguage}
                                           onChange={(e) => setSelectedLanguage(e.target.value)}
                                           className="text-[10px] px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-500/20 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                         >
                                           {SUPPORTED_LANGUAGES.slice(0, 10).map(lang => (
                                             <option key={lang.code} value={lang.code}>
                                               {lang.flag} {lang.name}
                                             </option>
                                           ))}
                                         </select>
                                       </div>
                                     </div>

                                     {/* Diarization Results Panel */}
                                     {showDiarizationPanel && diarizationResult && (
                                       <div className="mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-500/10">
                                         <div className="flex items-center justify-between mb-3">
                                           <h5 className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 uppercase flex items-center gap-2">
                                             <Users className="w-3 h-3" /> Speaker Analysis
                                           </h5>
                                           <button
                                             onClick={() => setShowDiarizationPanel(false)}
                                             className="text-[8px] text-neutral-400 hover:text-neutral-600"
                                           >
                                             <X className="w-3 h-3" />
                                           </button>
                                         </div>
                                         
                                         {/* Speaking Time Distribution */}
                                         <div className="flex items-center gap-2 mb-3">
                                           <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
                                             <div 
                                               className="h-full bg-neutral-500"
                                               style={{ width: `${diarizationResult.speakingTimeRatio.A}%` }}
                                               title={`Speaker A: ${diarizationResult.speakingTimeRatio.A.toFixed(1)}%`}
                                             />
                                             <div 
                                               className="h-full bg-neutral-600"
                                               style={{ width: `${diarizationResult.speakingTimeRatio.B}%` }}
                                               title={`Speaker B: ${diarizationResult.speakingTimeRatio.B.toFixed(1)}%`}
                                             />
                                           </div>
                                         </div>
                                         
                                         <div className="grid grid-cols-3 gap-2 text-center">
                                           <div className="bg-white dark:bg-neutral-800 rounded p-2">
                                             <div className="text-lg font-black text-neutral-600">{diarizationResult.speakingTimeRatio.A.toFixed(0)}%</div>
                                             <div className="text-[8px] font-bold text-neutral-500">Speaker A</div>
                                           </div>
                                           <div className="bg-white dark:bg-neutral-800 rounded p-2">
                                             <div className="text-lg font-black text-neutral-600">{diarizationResult.speakerTransitions}</div>
                                             <div className="text-[8px] font-bold text-neutral-500">Transitions</div>
                                           </div>
                                           <div className="bg-white dark:bg-neutral-800 rounded p-2">
                                             <div className="text-lg font-black text-neutral-700">{diarizationResult.speakingTimeRatio.B.toFixed(0)}%</div>
                                             <div className="text-[8px] font-bold text-neutral-500">Speaker B</div>
                                           </div>
                                         </div>
                                         
                                         {/* Timeline */}
                                         <div className="mt-3">
                                           <div className="text-[8px] font-bold text-neutral-500 mb-1">Timeline</div>
                                           <div 
                                             className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded relative cursor-pointer"
                                             onClick={(e) => {
                                               const rect = e.currentTarget.getBoundingClientRect();
                                               const x = e.clientX - rect.left;
                                               const percentage = x / rect.width;
                                               handleVideoSeek(percentage * diarizationResult.totalDuration);
                                             }}
                                           >
                                             {diarizationResult.segments.map((seg, idx) => {
                                               const left = (seg.startTime / diarizationResult.totalDuration) * 100;
                                               const width = ((seg.endTime - seg.startTime) / diarizationResult.totalDuration) * 100;
                                               return (
                                                 <div
                                                   key={idx}
                                                   className={`absolute top-0 h-full ${seg.speaker === 'A' ? 'bg-neutral-500' : 'bg-neutral-600'}`}
                                                   style={{ left: `${left}%`, width: `${width}%` }}
                                                   title={`${seg.speaker}: ${formatTimestamp(seg.startTime)} - ${formatTimestamp(seg.endTime)}`}
                                                 />
                                               );
                                             })}
                                             <div
                                               className="absolute top-0 w-0.5 h-full bg-white border border-neutral-800 shadow"
                                               style={{ left: `${(currentVideoTime / diarizationResult.totalDuration) * 100}%` }}
                                             />
                                           </div>
                                           <div className="flex justify-between text-[8px] text-neutral-400 mt-1">
                                             <span>0:00</span>
                                             <span>{formatTimestamp(currentVideoTime)}</span>
                                             <span>{formatTimestamp(diarizationResult.totalDuration)}</span>
                                           </div>
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </>
                             )}
                           </div>
                         </div>
                       ) : (
                         <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed selection:bg-neutral-500/30">
                           <div className="prose dark:prose-invert prose-slate prose-xs max-w-none">
                             {result.split(/POINTS_A|POINTS_B|TRUTH_POT|FOLLOWERS_A|FOLLOWERS_B|AWARD/)[0]}
                             <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-500/10">
                                {result.substring(result.indexOf('Verdict:'))}
                             </div>
                           </div>
                         </div>
                       )
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                          <Binary className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Awaiting Simulation Data</p>
                       </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Right: Chain of Thought Mind Palace, Temporal Scores, Active Fallacy Console & Score Rubrics */}
            <aside className="space-y-6">
               
               {/* Chain of Thought - Mind Palace Visualization */}
               {result && showCoT && (
                 <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-400/30 dark:border-neutral-300/30 overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3lhbiIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                   
                   <div className="relative px-5 py-3 border-b border-neutral-400/20 dark:border-neutral-300/30 bg-neutral-300/10 dark:bg-neutral-300/5 flex items-center justify-between backdrop-blur-sm">
                     <h4 className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                       <Brain className="w-3.5 h-3.5 animate-pulse" /> Mind Palace (Chain of Thought)
                     </h4>
                     <button 
                       onClick={() => setShowCoT(!showCoT)}
                       className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 uppercase hover:bg-neutral-300/20 px-2 py-1 rounded transition-colors"
                     >
                       {showCoT ? 'COLLAPSE' : 'EXPAND'}
                     </button>
                   </div>
                   
                   <div className="relative p-5 max-h-[300px] overflow-y-auto space-y-3">
                     {/* Extract CoT section if present */}
                     {result.includes('CHAIN OF THOUGHT') ? (
                       result.match(/CHAIN OF THOUGHT:([\s\S]*?)(?=\d\.|ARBITER VERDICT|$)/)?.[1]
                         .split('\n')
                         .filter(line => line.trim())
                         .map((line, i) => (
                           <div key={i} className="flex gap-3 animate-in slide-in-from-left-2" style={{animationDelay: `${i * 50}ms`}}>
                             <div className="w-1 h-full bg-neutral-500 dark:bg-neutral-400 rounded-full shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                             <div className="flex-1 space-y-1">
                               <p className="text-[9px] font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white/60 dark:bg-black/40 p-2.5 rounded-lg border border-neutral-200/50 dark:border-neutral-300/20 backdrop-blur-sm">
                                 {line.trim().replace(/^[-*•]\s*/, '')}
                               </p>
                             </div>
                           </div>
                         ))
                     ) : (
                       <p className="text-[10px] text-neutral-600/60 dark:text-neutral-400/60 italic text-center py-8">
                         Cognitive trace will appear here during analysis...
                       </p>
                     )}
                   </div>
                 </div>
               )}

               {/* Temporal Score Evolution - Chess-style Advantage Graph */}
               {extractedJSON?.temporal_scores && temporalScores.length > 0 && (
                 <div className="bg-white dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-500/20 overflow-hidden mt-6">
                   <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-500/10 bg-neutral-50 dark:bg-black/40 flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3 text-neutral-500" /> Temporal Score Evolution
                     </h4>
                     <span className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 uppercase">LIVE TRACKING</span>
                   </div>
                   <div className="p-5 space-y-4">
                     {/* Simple bar chart representation */}
                     <div className="space-y-2">
                       {temporalScores.map((ts, i) => (
                         <div key={i} className="space-y-1">
                           <div className="flex justify-between text-[8px] font-black text-neutral-400 dark:text-neutral-600 uppercase">
                             <span>{Math.floor(ts.time / 60)}:{String(ts.time % 60).padStart(2, '0')}</span>
                             <span>A: {ts.scoreA} | B: {ts.scoreB}</span>
                           </div>
                           <div className="relative h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                             <div 
                               className="absolute left-0 top-0 h-full bg-neutral-500 transition-all duration-500" 
                               style={{width: `${(ts.scoreA / (ts.scoreA + ts.scoreB)) * 100}%`}}
                             />
                             <div 
                               className="absolute right-0 top-0 h-full bg-neutral-600 transition-all duration-500" 
                               style={{width: `${(ts.scoreB / (ts.scoreA + ts.scoreB)) * 100}%`}}
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

            </aside>
          </div>

          {/* Bottom Row: Fallacy Log and WSDC Matrix in 50/50 Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Fallacy Log */}
            <div className="bg-white dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-500/20 overflow-hidden flex flex-col h-[400px]">
              <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-500/10 bg-neutral-50 dark:bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-[10px] font-black text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3 text-red-500" /> Fallacy Log</h4>
                  <span className="text-[8px] font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{fallacyLog.length} Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPopupContent('fallacyLog')}
                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    title="Expand to full window"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-500" />
                  </button>
                  {fallacyLog.length > 0 && (
                    <>
                      <button 
                        onClick={() => {
                          const data = JSON.stringify(fallacyLog, null, 2);
                          const blob = new Blob([data], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `fallacy-log-${new Date().toISOString().slice(0,10)}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-500/10 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 px-2 py-1 rounded transition-colors"
                        title="Export fallacy log as JSON"
                      >
                        EXPORT
                      </button>
                      <button 
                        onClick={() => setFallacyLog([])}
                        className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                        title="Clear fallacy log"
                      >
                        CLEAR
                      </button>
                    </>
                  )}
                  {result && result.includes('Fallacy Log') && <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">LIVE</span>}
                </div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                {fallacyLog.length > 0 ? fallacyLog.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3 animate-in slide-in-from-right-2 duration-300 bg-red-50 dark:bg-red-500/5 rounded-lg p-3 border border-red-100 dark:border-red-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                          {entry.type || 'Syllogistic Violation'}
                        </p>
                        <div className="flex items-center gap-2">
                          {entry.videoTimestamp > 0 && (
                            <span className="text-[7px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                              @{Math.floor(entry.videoTimestamp / 60)}:{String(Math.floor(entry.videoTimestamp % 60)).padStart(2, '0')}
                            </span>
                          )}
                          {entry.severity && (
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${
                              entry.severity >= 8 ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                              entry.severity >= 5 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' :
                              'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600'
                            }`}>
                              SEV:{entry.severity}/10
                            </span>
                          )}
                          <span className="text-[7px] font-medium text-neutral-400 dark:text-neutral-600">
                            {entry.timestamp?.toLocaleTimeString?.() || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {entry.quote && (
                        <p className="text-[9px] font-medium text-neutral-500 dark:text-neutral-500 italic border-l-2 border-red-300 dark:border-red-500/30 pl-2">
                          "{entry.quote}"
                        </p>
                      )}
                      <p className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 leading-tight">{entry.explanation || entry.fallacy}</p>
                      <div className="flex items-center gap-3 text-[8px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${
                          entry.speakerId === 'A' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' : 'bg-purple-100 dark:bg-purple-500/10 text-purple-600'
                        }`}>{entry.speaker}</span>
                        {entry.impact !== '0' && <span className={`${entry.impact.startsWith('-') ? 'text-red-500' : 'text-neutral-500'}`}>{entry.impact} pts</span>}
                      </div>
                    </div>
                  </div>
                )) : <p className="text-[10px] text-neutral-400 dark:text-neutral-600 italic font-medium text-center py-20 opacity-50">Zero violations registered. Fallacies will be logged here with timestamps and metadata.</p>}
              </div>
            </div>

            {/* WSDC Adjudication Matrix */}
            <div className="bg-white dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-500/10 p-6 space-y-6 relative overflow-hidden h-[400px] flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-500/5 rounded-full -mr-12 -mt-12" />
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Scale className="w-3 h-3 text-neutral-500" /> WSDC Adjudication Matrix
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPopupContent('wsdcMatrix')}
                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    title="Expand to full window"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => setEditingWeights(!editingWeights)}
                    className="text-[7px] font-black text-neutral-600 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-500/10 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 px-2 py-1 rounded transition-colors"
                  >
                    {editingWeights ? 'LOCK' : 'EDIT'} {wsdcWeights.content}/{wsdcWeights.style}/{wsdcWeights.strategy}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {/* If JSON extracted, show actual scores */}
                {extractedJSON?.final_verdict?.scores ? (
                  <div className="space-y-5">
                    {[
                      { label: 'Content (Logic & Evidence)', key: 'content', max: 40, color: 'indigo', darkColor: 'cyan' },
                      { label: 'Style (Rhetoric & Delivery)', key: 'style', max: 40, color: 'pink', darkColor: 'magenta' },
                      { label: 'Strategy (Structure & Refutation)', key: 'strategy', max: 20, color: 'emerald', darkColor: 'emerald' }
                    ].map(rubric => (
                      <div key={rubric.key} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter">{rubric.label}</span>
                          <div className="flex gap-2 text-[10px] font-black">
                            <span className="text-neutral-600 dark:text-neutral-300">
                              A: {extractedJSON.final_verdict.scores[rubric.key].a}/{rubric.max}
                            </span>
                            {analysisMode === AnalysisMode.ARENA && (
                              <span className="text-neutral-700 dark:text-neutral-400">
                                B: {extractedJSON.final_verdict.scores[rubric.key].b}/{rubric.max}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neutral-500 dark:bg-neutral-300 transition-all duration-1000" 
                              style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].a / rubric.max) * 100}%`}}
                            />
                          </div>
                          {analysisMode === AnalysisMode.ARENA && (
                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-neutral-600 dark:bg-neutral-400 transition-all duration-1000" 
                                style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].b / rubric.max) * 100}%`}}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-500/10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase">Total Score</span>
                        <div className="flex gap-3 text-sm font-black">
                          <span className="text-neutral-600 dark:text-neutral-300">{extractedJSON.final_verdict.scores.total.a}</span>
                          {analysisMode === AnalysisMode.ARENA && (
                            <>
                              <span className="text-neutral-400">/</span>
                              <span className="text-neutral-700 dark:text-neutral-400">{extractedJSON.final_verdict.scores.total.b}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Editable weight calibration display */
                  <div className="space-y-6">
                    {[
                      { key: 'content', label: 'Content (Logic & Evidence)', desc: 'Toulmin validity, fallacy count, consistency' }, 
                      { key: 'style', label: 'Style (Rhetoric & Delivery)', desc: 'Persuasion, clarity, tone analysis' }, 
                      { key: 'strategy', label: 'Strategy (Structure & Refutation)', desc: 'Case structure, refutation effectiveness' }
                    ].map(m => (
                      <div key={m.label} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-tighter block">{m.label}</span>
                            <span className="text-[8px] text-neutral-400 dark:text-neutral-600 block leading-tight">{m.desc}</span>
                          </div>
                          {editingWeights ? (
                            <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              value={wsdcWeights[m.key as keyof typeof wsdcWeights]} 
                              onChange={e => {
                                const newVal = parseInt(e.target.value) || 0;
                                setWsdcWeights(prev => ({...prev, [m.key]: newVal}));
                              }}
                              className="w-14 text-xs font-black text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 rounded px-2 py-1 text-center outline-none focus:ring-2 focus:ring-neutral-500/30"
                            />
                          ) : (
                            <span className="text-xs font-black text-neutral-600 dark:text-neutral-300">{wsdcWeights[m.key as keyof typeof wsdcWeights]}%</span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-neutral-800 dark:bg-neutral-200 transition-all duration-1000 shadow-sm" 
                            style={{ width: `${wsdcWeights[m.key as keyof typeof wsdcWeights]}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                    {editingWeights && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-500/10">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-black text-neutral-400 dark:text-neutral-600 uppercase">Total:</span>
                          <span className={`font-black ${wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy === 100 ? 'text-neutral-600 dark:text-neutral-500' : 'text-red-600 dark:text-red-500'}`}>
                            {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}% {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy !== 100 && '⚠️ Must = 100'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <div className="p-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-widest animate-in shake mt-6"><AlertCircle className="w-6 h-6 shrink-0" /> Engine Fault: {error}</div>}
        </main>
        )}
      </div>
      
      <style>{`
        .prose-xs { font-size: 0.75rem; line-height: 1.7; }
        .prose-xs h1, .prose-xs h2, .prose-xs h3 { text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 0.5em; }
        .dark .prose-xs { color: #94a3b8; }
        .dark .prose-xs h1, .dark .prose-xs h2, .dark .prose-xs h3 { color: #f1f5f9; }
        .dark .prose-xs strong { color: #f1f5f9; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>

      {/* Video Search Modal */}
      {showVideoSearch && (
        <VideoSearchModal
          isOpen={showVideoSearch}
          onClose={() => setShowVideoSearch(false)}
          onSelectVideo={handleVideoSelect}
          participantLabel="Participant A"
        />
      )}

      {/* Channel Video Selector Modal */}
      {showChannelVideoSelector && (
        <ChannelVideoSelector
          isOpen={showChannelVideoSelector}
          onClose={() => setShowChannelVideoSelector(false)}
          channelHandle={selectedChannelHandle}
          channelName={selectedChannelName}
          onSelectVideo={handleChannelVideoSelect}
        />
      )}

      {/* Expandable Content Popup Modal */}
      {popupContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-700">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800">
              <h2 className="text-sm font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-3">
                {popupContent === 'logicCalibration' && <><Globe className="w-5 h-5 text-neutral-500" /> Logic Calibration</>}
                {popupContent === 'knowledgeIngestion' && <><ClipboardList className="w-5 h-5 text-neutral-600" /> Knowledge Ingestion</>}
                {popupContent === 'fallacyLog' && <><Activity className="w-5 h-5 text-red-500" /> Fallacy Log</>}
                {popupContent === 'wsdcMatrix' && <><Scale className="w-5 h-5 text-neutral-500" /> WSDC Adjudication Matrix</>}
                {popupContent === 'inputStream' && <><Monitor className="w-5 h-5 text-neutral-500" /> Input Stream</>}
              </h2>
              <button
                onClick={() => setPopupContent(null)}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {popupContent === 'logicCalibration' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* System Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">System Mode</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setSystemMode('arena'); setAnalysisMode(AnalysisMode.ARENA); }}
                        className={`flex-1 px-6 py-4 rounded-lg text-sm font-black uppercase transition-all ${
                          systemMode === 'arena'
                            ? 'bg-neutral-800 dark:bg-neutral-200 dark:text-black text-white shadow-lg'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <Users className="w-5 h-5 mx-auto mb-2" />
                        Arena (Debate)
                      </button>
                      <button
                        onClick={() => { setSystemMode('solo'); setAnalysisMode(AnalysisMode.MONOLOGUE); }}
                        className={`flex-1 px-6 py-4 rounded-lg text-sm font-black uppercase transition-all ${
                          systemMode === 'solo'
                            ? 'bg-neutral-800 dark:bg-neutral-200 dark:text-black text-white shadow-lg'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <Brain className="w-5 h-5 mx-auto mb-2" />
                        Solo Analysis
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Region</label>
                      <select value={country} onChange={e => setCountry(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Year</label>
                      <select value={year} onChange={e => setYear(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Target Demography</label>
                      <select value={demography} onChange={e => setDemography(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {DEMOGRAPHICS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Arbiter Persona</label>
                      <select value={persona} onChange={e => setPersona(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Logic Rigour</label>
                      <select value={logicStyle} onChange={e => setLogicStyle(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {LOGIC_STYLES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">Communication Mode</label>
                      <select value={stakeholderMode} onChange={e => setStakeholderMode(e.target.value)} className="w-full text-sm bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 outline-none dark:text-neutral-300">
                        {STAKEHOLDER_MODES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase flex items-center justify-between">
                        <span>Margin of Error</span>
                        <span className="text-neutral-600 dark:text-neutral-400">±{marginOfError}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        step="1"
                        value={marginOfError}
                        onChange={e => setMarginOfError(parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {popupContent === 'knowledgeIngestion' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Supervisor Intelligence Directive */}
                  <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
                    <label className="flex items-center gap-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      <Brain className="w-5 h-5" /> Supervisor Intelligence Directive (Auto-Generated)
                    </label>
                    <div className="w-full bg-white dark:bg-black/40 text-sm font-mono leading-relaxed border border-neutral-300 dark:border-neutral-700 rounded-lg p-6 max-h-96 overflow-y-auto text-neutral-700 dark:text-neutral-300 space-y-4">
                      <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700 pb-3">
                        <Settings2 className="w-5 h-5" />
                        <span>ACTIVE CALIBRATION PARAMETERS</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded p-3 space-y-2">
                          <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">System Mode:</span> <span className="text-neutral-900 dark:text-neutral-100 font-medium">{systemMode === 'arena' ? 'DEBATE ANALYSIS (Arena)' : 'SOLO CONTENT ANALYSIS'}</span></p>
                          <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Participants:</span> <span className="text-neutral-900 dark:text-neutral-100 font-medium">{systemMode === 'arena' ? `${pA.name} vs ${pB.name}` : pA.name}</span></p>
                        </div>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Region:</span> <span className="text-neutral-900 dark:text-neutral-100">{country} ({year})</span></p>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Audience:</span> <span className="text-neutral-900 dark:text-neutral-100">{demography}</span></p>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Persona:</span> <span className="text-neutral-900 dark:text-neutral-100">{persona}</span></p>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Logic:</span> <span className="text-neutral-900 dark:text-neutral-100">{logicStyle}</span></p>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Mode:</span> <span className="text-neutral-900 dark:text-neutral-100">{stakeholderMode}</span></p>
                        <p><span className="text-neutral-600 dark:text-neutral-400 font-semibold">Error Margin:</span> <span className="text-neutral-900 dark:text-neutral-100">±{marginOfError}%</span></p>
                        <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded p-3 mt-3 space-y-2">
                          <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">WSDC ADJUDICATION MATRIX:</p>
                          <p className="ml-3"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Content:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.content}%</span></p>
                          <p className="ml-3"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Style:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.style}%</span></p>
                          <p className="ml-3"><span className="text-neutral-600 dark:text-neutral-400 font-medium">Strategy:</span> <span className="text-neutral-900 dark:text-neutral-100">{wsdcWeights.strategy}%</span></p>
                          <p className="ml-3 text-neutral-700 dark:text-neutral-300 font-medium mt-2">Total: {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>This directive is automatically populated from Logic Calibrator settings. Adjust calibration controls to dynamically reconfigure RAG orchestration.</span>
                    </div>
                  </div>

                  {/* Reference URLs */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">
                      <LinkIcon className="w-4 h-4" /> Reference URLs
                    </label>
                    <textarea 
                      value={ragUrls} 
                      onChange={e => setRagUrls(e.target.value)} 
                      className="w-full bg-neutral-50 dark:bg-black/40 text-sm font-mono border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 h-32 outline-none text-neutral-700 dark:text-neutral-400 focus:border-neutral-500 dark:focus:border-neutral-500/50 transition-all" 
                      placeholder={"https://ipcc.ch/report/...\nhttps://fbref.com/en/..."} 
                    />
                  </div>

                  {/* Files / Transcripts */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">
                      <FileText className="w-4 h-4" /> Files / Transcripts
                    </label>
                    <div 
                      onClick={() => contextInputRef.current?.click()} 
                      className="p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-black/20 hover:bg-neutral-100 dark:hover:bg-black/40 transition-all flex flex-col items-center justify-center cursor-pointer"
                    >
                      <FileUp className="w-12 h-12 text-neutral-400 mb-3" />
                      <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Click to upload context files</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">.txt, .pdf, .docx supported</p>
                    </div>
                    {contextFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {contextFiles.map((f, i) => (
                          <span key={i} className="text-xs font-bold bg-neutral-50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400 px-3 py-1.5 rounded border border-neutral-100 dark:border-neutral-500/20">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {popupContent === 'fallacyLog' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Total Fallacies: {fallacyLog.length}</span>
                    {fallacyLog.length > 0 && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const data = JSON.stringify(fallacyLog, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `fallacy-log-${new Date().toISOString().slice(0,10)}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-500/10 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 px-4 py-2 rounded transition-colors"
                        >
                          EXPORT JSON
                        </button>
                        <button 
                          onClick={() => setFallacyLog([])}
                          className="text-sm font-bold text-red-600 dark:text-red-400 uppercase bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2 rounded transition-colors"
                        >
                          CLEAR ALL
                        </button>
                      </div>
                    )}
                  </div>
                  {fallacyLog.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {fallacyLog.slice().reverse().map((entry, i) => (
                        <div key={i} className="bg-red-50 dark:bg-red-500/5 rounded-lg p-4 border border-red-100 dark:border-red-500/10">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-red-500 uppercase">Syllogistic Violation</p>
                                <span className="text-xs text-neutral-400 dark:text-neutral-600">{entry.timestamp.toLocaleTimeString()}</span>
                              </div>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{entry.fallacy}</p>
                              <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="text-neutral-600 dark:text-neutral-300">{entry.speaker}</span>
                                {entry.impact !== '0' && <span className={`${entry.impact.startsWith('-') ? 'text-red-500' : 'text-neutral-500'}`}>{entry.impact} pts</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Activity className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                      <p className="text-sm text-neutral-400 dark:text-neutral-600 italic">Zero violations registered. Fallacies will be logged here with timestamps and metadata.</p>
                    </div>
                  )}
                </div>
              )}

              {popupContent === 'wsdcMatrix' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Weight Configuration</h3>
                    <button 
                      onClick={() => setEditingWeights(!editingWeights)}
                      className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-500/10 hover:bg-neutral-100 dark:hover:bg-neutral-500/20 px-4 py-2 rounded transition-colors"
                    >
                      {editingWeights ? 'LOCK' : 'EDIT'} {wsdcWeights.content}/{wsdcWeights.style}/{wsdcWeights.strategy}
                    </button>
                  </div>

                  {extractedJSON?.final_verdict?.scores ? (
                    <div className="space-y-6">
                      {[
                        { label: 'Content (Logic & Evidence)', key: 'content', max: 40 },
                        { label: 'Style (Rhetoric & Delivery)', key: 'style', max: 40 },
                        { label: 'Strategy (Structure & Refutation)', key: 'strategy', max: 20 }
                      ].map(rubric => (
                        <div key={rubric.key} className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase">{rubric.label}</span>
                            <div className="flex gap-4 text-base font-bold">
                              <span className="text-neutral-600 dark:text-neutral-300">
                                A: {extractedJSON.final_verdict.scores[rubric.key].a}/{rubric.max}
                              </span>
                              {analysisMode === AnalysisMode.ARENA && (
                                <span className="text-neutral-700 dark:text-neutral-400">
                                  B: {extractedJSON.final_verdict.scores[rubric.key].b}/{rubric.max}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-neutral-500 dark:bg-neutral-300 transition-all duration-1000" 
                                style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].a / rubric.max) * 100}%`}}
                              />
                            </div>
                            {analysisMode === AnalysisMode.ARENA && (
                              <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-neutral-600 dark:bg-neutral-400 transition-all duration-1000" 
                                  style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].b / rubric.max) * 100}%`}}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-neutral-600 dark:text-neutral-400 uppercase">Total Score</span>
                          <div className="flex gap-4 text-xl font-bold">
                            <span className="text-neutral-600 dark:text-neutral-300">{extractedJSON.final_verdict.scores.total.a}</span>
                            {analysisMode === AnalysisMode.ARENA && (
                              <>
                                <span className="text-neutral-400">/</span>
                                <span className="text-neutral-700 dark:text-neutral-400">{extractedJSON.final_verdict.scores.total.b}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[
                        { key: 'content', label: 'Content (Logic & Evidence)', desc: 'Toulmin validity, fallacy count, consistency' }, 
                        { key: 'style', label: 'Style (Rhetoric & Delivery)', desc: 'Persuasion, clarity, tone analysis' }, 
                        { key: 'strategy', label: 'Strategy (Structure & Refutation)', desc: 'Case structure, refutation effectiveness' }
                      ].map(m => (
                        <div key={m.label} className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase block">{m.label}</span>
                              <span className="text-xs text-neutral-400 dark:text-neutral-600 block">{m.desc}</span>
                            </div>
                            {editingWeights ? (
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={wsdcWeights[m.key as keyof typeof wsdcWeights]} 
                                onChange={e => {
                                  const newVal = parseInt(e.target.value) || 0;
                                  setWsdcWeights(prev => ({...prev, [m.key]: newVal}));
                                }}
                                className="w-20 text-base font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-500/10 border border-neutral-200 dark:border-neutral-500/20 rounded px-3 py-2 text-center outline-none focus:ring-2 focus:ring-neutral-500/30"
                              />
                            ) : (
                              <span className="text-base font-bold text-neutral-600 dark:text-neutral-300">{wsdcWeights[m.key as keyof typeof wsdcWeights]}%</span>
                            )}
                          </div>
                          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neutral-800 dark:bg-neutral-200 transition-all duration-1000" 
                              style={{ width: `${wsdcWeights[m.key as keyof typeof wsdcWeights]}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                      {editingWeights && (
                        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-neutral-600 dark:text-neutral-400 uppercase">Total:</span>
                            <span className={`text-lg font-bold ${wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy === 100 ? 'text-neutral-600 dark:text-neutral-500' : 'text-red-600 dark:text-red-500'}`}>
                              {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}% {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy !== 100 && '⚠️ Must = 100'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {popupContent === 'inputStream' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  {/* Input Source Buttons */}
                  <div className="grid grid-cols-4 gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingFile || isRecording}
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-400 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-6 h-6 text-neutral-500" />
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Upload File</span>
                      <span className="text-[10px] text-neutral-400">Video, Audio, SRT, VTT</span>
                    </button>
                    <button
                      onClick={() => setShowVideoSearch(true)}
                      disabled={processingFile || isRecording}
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-400 transition-colors disabled:opacity-50"
                    >
                      <Youtube className="w-6 h-6 text-red-500" />
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">YouTube Search</span>
                      <span className="text-[10px] text-neutral-400">Find videos by keyword</span>
                    </button>
                    <button
                      onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
                      disabled={processingFile}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                        isRecording 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500 animate-pulse' 
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="w-6 h-6 text-red-500" />
                      ) : (
                        <Mic className="w-6 h-6 text-neutral-500" />
                      )}
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                        {isRecording ? 'Stop Recording' : 'Microphone'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {isRecording ? 'Click to stop' : 'Live transcription'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setVideo(null);
                        setTranscript('');
                        setInputMetadata(null);
                        setTranscriptError('');
                      }}
                      disabled={processingFile || isRecording || (!video && !transcript)}
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-6 h-6 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Clear Input</span>
                      <span className="text-[10px] text-neutral-400">Reset all data</span>
                    </button>
                  </div>
                  
                  {/* Preview Area */}
                  <div className="aspect-video bg-neutral-50 dark:bg-black/40 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden">
                    {processingFile ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-neutral-500 animate-spin" />
                        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase">Processing file...</p>
                        <p className="text-xs text-neutral-400">Transcribing audio/video content with AI</p>
                      </div>
                    ) : isRecording ? (
                      <div className="flex flex-col items-center gap-4 w-full px-8">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                          <div className="w-10 h-10 bg-red-500 rounded-full" />
                        </div>
                        <p className="text-sm font-bold text-red-500 uppercase">Recording in progress...</p>
                        <div className="w-full max-h-32 overflow-y-auto text-sm text-neutral-600 dark:text-neutral-400 bg-white dark:bg-black/20 rounded p-4 border border-neutral-200 dark:border-neutral-700">
                          {interimTranscript || transcript || 'Listening...'}
                        </div>
                      </div>
                    ) : video ? (
                      videoMime === 'video/youtube' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                          <Play className="w-20 h-20 text-neutral-500" />
                          <div className="text-center">
                            <p className="text-base font-bold text-neutral-600 dark:text-neutral-300 mb-2">YouTube Video Selected</p>
                            <p className="text-sm text-neutral-400 dark:text-neutral-600 break-all max-w-2xl">{video}</p>
                          </div>
                        </div>
                      ) : (
                        <video src={video} className="w-full h-full object-contain" controls />
                      )
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="w-10 h-10 text-neutral-500" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-2">System Idle</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-600">Select an input source above</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-2">
                          Supported: MP4, WebM, MP3, WAV, SRT, VTT, TXT, YouTube URLs
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Metadata Display */}
                  {inputMetadata && (
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase flex items-center gap-2">
                          <Verified className="w-4 h-4" /> Input Processed Successfully
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {inputMetadata.wordCount} words • {(inputMetadata.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                        <div><span className="font-semibold">Source:</span> {inputMetadata.source}</div>
                        <div><span className="font-semibold">Language:</span> {inputMetadata.language}</div>
                        {inputMetadata.duration && <div><span className="font-semibold">Duration:</span> {Math.round(inputMetadata.duration)}s</div>}
                        {inputMetadata.speakerCount && <div><span className="font-semibold">Speakers:</span> {inputMetadata.speakerCount}</div>}
                      </div>
                    </div>
                  )}

                  {/* Transcript Status */}
                  {(transcript || loadingTranscript || transcriptError) && (
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-500" />
                          Transcript Status
                        </span>
                        {transcript && (
                          <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                            {transcript.split(/\s+/).length} words • {Math.round(transcript.length / 1000)}K chars
                          </span>
                        )}
                      </div>
                      {loadingTranscript ? (
                        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Fetching transcript...
                        </div>
                      ) : transcriptError ? (
                        <div className="flex items-center gap-3 text-sm text-red-500">
                          <AlertCircle className="w-5 h-5" />
                          {transcriptError}
                        </div>
                      ) : transcript ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-green-600 dark:text-green-400 font-bold">
                            <Verified className="w-5 h-5" />
                            Ready for Analysis
                          </div>
                          <div className="max-h-64 overflow-y-auto text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-black/20 rounded p-4 border border-neutral-200 dark:border-neutral-700">
                            {transcript}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
