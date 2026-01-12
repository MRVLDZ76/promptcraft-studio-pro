import React from 'react';
import { analyzeVideoContent } from '../services/geminiService';
import { fetchYouTubeProfile, fetchInstagramProfile, detectPlatform, extractUsername, CreatorProfile } from '../services/socialMediaService';
import { AnalysisMode, Participant } from '../types';
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
  Trash2
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
  
  // WSDC Weights State (Editable Adjudication Matrix)
  const [wsdcWeights, setWsdcWeights] = React.useState({ content: 40, style: 40, strategy: 20 });
  const [tempWeights, setTempWeights] = React.useState({ content: 40, style: 40, strategy: 20 });
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [editingWeights, setEditingWeights] = React.useState(false);
  
  // RAG State
  const [ragUrls, setRagUrls] = React.useState('');
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
  
  // Arbiter Tuning Presets
  const [arbiterPreset, setArbiterPreset] = React.useState('custom');
  
  // Fallacy Log Storage
  const [fallacyLog, setFallacyLog] = React.useState<Array<{timestamp: Date, fallacy: string, speaker: string, impact: string}>>([]);
  
  // Visual Display Mode
  const [visualMode, setVisualMode] = React.useState(true);

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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => setVideo(reader.result as string);
      reader.readAsDataURL(file);
    }
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

      if (platform === 'youtube' || socialUrl.includes('youtube') || socialUrl.startsWith('@')) {
        // Get API key from env (defined in vite.config.ts)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('API key not found. Please set GEMINI_API_KEY in .env.local');
        }
        profile = await fetchYouTubeProfile(username, apiKey);
      } else if (platform === 'instagram') {
        profile = await fetchInstagramProfile(username);
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
      }
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const parseStats = (text: string) => {
    const pA = text.match(/POINTS_A:\s*(\d+)/i)?.[1] || '0';
    const pB = text.match(/POINTS_B:\s*(\d+)/i)?.[1] || '0';
    const pot = text.match(/TRUTH_POT:\s*(\$\d+)/i)?.[1] || '$0';
    const fA = text.match(/FOLLOWERS_A:\s*(\+\d+)/i)?.[1] || '+0';
    const fB = text.match(/FOLLOWERS_B:\s*(\+\d+)/i)?.[1] || '+0';
    const aw = text.match(/AWARD:\s*(.+)/i)?.[1] || 'Awaiting Logic';
    setArenaStats({ pointsA: parseInt(pA), pointsB: parseInt(pB), truthPot: pot, followersA: fA, followersB: fB, award: aw });
    
    // Extract and store fallacies with metadata
    if (text.includes('Fallacy Log')) {
      const fallacySection = text.match(/Fallacy Log:([\s\S]+?)(Reliability Score|Query|$)/)?.[1];
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
    
    // Extract JSON for visualization if present
    const jsonMatch = text.match(/JSON_OUTPUT_START\s*([\s\S]*?)\s*JSON_OUTPUT_END/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        setExtractedJSON(parsed);
        if (parsed.temporal_scores) {
          setTemporalScores(parsed.temporal_scores.map((ts: any) => ({
            time: ts.timestamp,
            scoreA: ts.participant_a_score,
            scoreB: ts.participant_b_score || 0
          })));
        }
      } catch (e) {
        console.error('Failed to parse JSON output:', e);
      }
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

  const runAnalysis = async () => {
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
        systemInstruction: enhancedSystemInstruction,
        supervisorPrompt,
        calibration: { country, year, demography, persona, logicStyle, stakeholderMode, marginOfError }
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

  const reliability = result.match(/Reliability Rating:\s*(\d+)%/i)?.[1] || '0';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 1. The Arbiter Scoreboard */}
      <header className="shrink-0 bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-indigo-500/20 px-6 py-4 backdrop-blur-xl z-30 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-[1600px] mx-auto">
          
          {/* Proponent A Card */}
          <div className="flex items-center gap-4 w-full md:w-1/3 group">
            <div className="relative shrink-0">
              <img src={pA.thumbnail} className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20 dark:ring-cyan-500/50 shadow-md dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all group-hover:scale-105" alt="pA" />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 dark:bg-cyan-600 text-white text-[8px] font-black px-1.5 rounded-sm shadow-lg border border-white/20">LVL {pA.level}</div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-1.5 min-w-0">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-400 truncate">{pA.name}</span>
                   <Verified className="w-3 h-3 text-indigo-500 dark:text-cyan-400 shrink-0" />
                 </div>
                 <span className="text-xs font-black text-indigo-600 dark:text-cyan-500">{arenaStats.pointsA} PTS</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 dark:bg-cyan-500 transition-all duration-1000 shadow-md" style={{ width: `${arenaStats.pointsA}%` }} />
               </div>
               <div className="flex justify-between items-center mt-1 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  <span className="flex items-center gap-1"><Youtube className="w-2.5 h-2.5 text-red-500" /> {pA.socialUrl}</span>
                  <span className="text-indigo-500/80 dark:text-cyan-500/80">{arenaStats.followersA} FOLLOWERS</span>
               </div>
            </div>
          </div>

          {/* Logic Pot & Mode Select */}
          <div className="flex flex-col items-center gap-1 w-full md:w-1/4">
            <div className="flex items-center gap-3">
               <div className="text-center">
                  <span className="text-[8px] font-black text-slate-400 dark:text-indigo-400 uppercase tracking-[0.3em] mb-1 block">Truth Pot</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-500 flex items-center justify-center gap-1">
                    <Coins className="w-4 h-4" /> {arenaStats.truthPot}
                  </span>
               </div>
               <div className="w-px h-8 bg-slate-200 dark:bg-indigo-500/20 mx-2" />
               <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-400 dark:text-indigo-400 uppercase tracking-widest mb-1 block">System Mode</span>
                  <div className="flex bg-slate-50 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-indigo-500/20">
                    <button onClick={() => setAnalysisMode(AnalysisMode.ARENA)} className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${analysisMode === AnalysisMode.ARENA ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>1v1 Arena</button>
                    <button onClick={() => setAnalysisMode(AnalysisMode.MONOLOGUE)} className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${analysisMode === AnalysisMode.MONOLOGUE ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Solo Audit</button>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/30 mt-1">
               <Zap className="w-2 h-2 text-indigo-500 dark:text-indigo-400 animate-pulse" />
               <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{arenaStats.award}</span>
            </div>
          </div>

          {/* Participant B Card */}
          <div className="flex items-center gap-4 w-full md:w-1/3 flex-row-reverse text-right group">
            <div className="relative shrink-0">
              {analysisMode === AnalysisMode.ARENA ? (
                <img src={pB.thumbnail} className="w-14 h-14 rounded-full object-cover ring-2 ring-pink-500/20 dark:ring-magenta-500/50 shadow-md transition-all group-hover:scale-105" alt="pB" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-500/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
              )}
              <div className={`absolute -bottom-1 -left-1 text-white text-[8px] font-black px-1.5 rounded-sm shadow-lg border border-white/20 ${analysisMode === AnalysisMode.ARENA ? 'bg-pink-600 dark:bg-fuchsia-600' : 'bg-emerald-600'}`}>
                {analysisMode === AnalysisMode.ARENA ? `LVL ${pB.level}` : 'DATA'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1 flex-row-reverse">
                 <span className={`text-[10px] font-black uppercase tracking-widest truncate ml-2 ${analysisMode === AnalysisMode.ARENA ? 'text-pink-500 dark:text-fuchsia-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {analysisMode === AnalysisMode.ARENA ? pB.name : 'FACTUAL MATRIX'}
                 </span>
                 <span className={`text-xs font-black ${analysisMode === AnalysisMode.ARENA ? 'text-pink-600 dark:text-fuchsia-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                  {arenaStats.pointsB} PTS
                 </span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex flex-row-reverse">
                  <div className={`h-full ${analysisMode === AnalysisMode.ARENA ? 'bg-pink-500 dark:bg-fuchsia-500' : 'bg-emerald-500'} transition-all duration-1000 shadow-md`} style={{ width: `${arenaStats.pointsB}%` }} />
               </div>
               <div className="flex justify-between items-center mt-1 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter flex-row-reverse">
                  <span className="flex items-center gap-1">
                    {analysisMode === AnalysisMode.ARENA ? (
                      <><Instagram className="w-2.5 h-2.5 text-pink-500" /> {pB.socialUrl}</>
                    ) : (
                      <><Binary className="w-2.5 h-2.5 text-emerald-500" /> 2025 Deep Calibration</>
                    )}
                  </span>
                  <span className={analysisMode === AnalysisMode.ARENA ? 'text-pink-500 dark:text-fuchsia-400' : 'text-emerald-500'}>
                    {analysisMode === AnalysisMode.ARENA ? `${arenaStats.followersB} FOLLOWERS` : 'KNOWLEDGE RAG'}
                  </span>
               </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Calibration Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar: Deep Logic Calibration */}
        <aside className="w-full lg:w-80 shrink-0 border-r border-slate-200 dark:border-indigo-500/10 bg-white dark:bg-slate-900/50 overflow-y-auto p-5 space-y-6 no-scrollbar">
          
          {/* Creator Profile Editor - Expandable with API Integration */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /><h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Creator Profiles</h3></div>
             
             {/* Subject Alpha - Expandable */}
             <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-indigo-500/10 overflow-hidden">
               <div className="p-3 space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-indigo-600 dark:text-cyan-500 uppercase tracking-widest">Subject Alpha</span>
                     <Youtube className="w-3 h-3 text-red-600" />
                   </div>
                   <div className="flex items-center gap-1">
                     <button 
                       onClick={() => fetchCreatorProfile(pA.socialUrl, true)}
                       disabled={loadingProfileA}
                       className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded transition-colors disabled:opacity-50"
                       title="Fetch YouTube profile data"
                     >
                       {loadingProfileA ? (
                         <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                       ) : (
                         <RefreshCw className="w-3 h-3 text-indigo-500" />
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
                       className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded transition-colors"
                     >
                       {expandedProfileA ? (
                         <ChevronUp className="w-3 h-3 text-indigo-500" />
                       ) : (
                         <ChevronDown className="w-3 h-3 text-indigo-500" />
                       )}
                     </button>
                   </div>
                 </div>
                 
                 {profileDataA?.thumbnail && (
                   <img src={profileDataA.thumbnail} alt={pA.name} className="w-full h-20 object-cover rounded-lg" />
                 )}
                 
                 <input value={pA.name} onChange={e => setPA({...pA, name: e.target.value})} placeholder="Creator name" className="w-full text-xs font-bold bg-transparent border-b border-slate-200 dark:border-indigo-500/20 outline-none pb-1 focus:border-indigo-500" />
                 <div className="flex gap-2">
                   <input value={pA.socialUrl} onChange={e => setPA({...pA, socialUrl: e.target.value})} placeholder="@username or URL" className="flex-1 text-[10px] bg-transparent outline-none text-slate-400 dark:text-slate-500 font-mono border-b border-slate-200 dark:border-indigo-500/20 pb-1" />
                   {profileDataA && (
                     <a href={`https://youtube.com/${profileDataA.username}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded transition-colors">
                       <ExternalLink className="w-3 h-3 text-indigo-500" />
                     </a>
                   )}
                 </div>
                 
                 <div className="flex gap-2">
                   <div className="flex-1 bg-white dark:bg-black/40 rounded p-1.5 border border-slate-100 dark:border-indigo-500/10">
                     <label className="text-[8px] block font-black text-slate-400 dark:text-slate-600 uppercase">Followers</label>
                     <input value={pA.followers} onChange={e => setPA({...pA, followers: e.target.value})} className="w-full text-[10px] font-bold bg-transparent outline-none text-indigo-600 dark:text-cyan-500" />
                   </div>
                   <div className="w-16 bg-white dark:bg-black/40 rounded p-1.5 border border-slate-100 dark:border-indigo-500/10">
                     <label className="text-[8px] block font-black text-slate-400 dark:text-slate-600 uppercase">Level</label>
                     <input type="number" value={pA.level} onChange={e => setPA({...pA, level: parseInt(e.target.value)})} className="w-full text-[10px] font-bold bg-transparent outline-none text-indigo-600 dark:text-cyan-500 text-center" />
                   </div>
                 </div>
               </div>
               
               {/* Expanded Details */}
               {expandedProfileA && profileDataA && (
                 <div className="border-t border-slate-200 dark:border-indigo-500/10 p-3 space-y-2 bg-white dark:bg-black/20">
                   <div className="flex items-center gap-2 mb-2">
                     <Verified className="w-3 h-3 text-indigo-500" />
                     <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Profile Details</span>
                   </div>
                   
                   {profileDataA.description && (
                     <div className="text-[9px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                       {profileDataA.description}
                     </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-2">
                     {profileDataA.totalVideos !== undefined && (
                       <div className="bg-slate-50 dark:bg-slate-800/40 rounded p-2">
                         <div className="flex items-center gap-1 mb-0.5">
                           <Play className="w-2.5 h-2.5 text-indigo-500" />
                           <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Videos</span>
                         </div>
                         <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-500">{profileDataA.totalVideos.toLocaleString()}</span>
                       </div>
                     )}
                     {profileDataA.totalViews && (
                       <div className="bg-slate-50 dark:bg-slate-800/40 rounded p-2">
                         <div className="flex items-center gap-1 mb-0.5">
                           <Eye className="w-2.5 h-2.5 text-indigo-500" />
                           <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Views</span>
                         </div>
                         <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-500">{profileDataA.totalViews}</span>
                       </div>
                     )}
                   </div>
                   
                   {profileDataA.engagement && (
                     <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 rounded p-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Engagement</span>
                         <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-500">{profileDataA.engagement}</span>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>

             {/* Subject Beta - Expandable (Arena mode only) */}
             {analysisMode === AnalysisMode.ARENA && (
               <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-indigo-500/10 overflow-hidden">
                 <div className="p-3 space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-pink-600 dark:text-fuchsia-500 uppercase tracking-widest">Subject Beta</span>
                       <Instagram className="w-3 h-3 text-pink-600" />
                     </div>
                     <div className="flex items-center gap-1">
                       <button 
                         onClick={() => fetchCreatorProfile(pB.socialUrl, false)}
                         disabled={loadingProfileB}
                         className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-500/20 rounded transition-colors disabled:opacity-50"
                         title="Fetch Instagram/YouTube profile data"
                       >
                         {loadingProfileB ? (
                           <Loader2 className="w-3 h-3 text-pink-500 animate-spin" />
                         ) : (
                           <RefreshCw className="w-3 h-3 text-pink-500" />
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
                         className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-500/20 rounded transition-colors"
                       >
                         {expandedProfileB ? (
                           <ChevronUp className="w-3 h-3 text-pink-500" />
                         ) : (
                           <ChevronDown className="w-3 h-3 text-pink-500" />
                         )}
                       </button>
                     </div>
                   </div>
                   
                   {profileDataB?.thumbnail && (
                     <img src={profileDataB.thumbnail} alt={pB.name} className="w-full h-20 object-cover rounded-lg" />
                   )}
                   
                   <input value={pB.name} onChange={e => setPB({...pB, name: e.target.value})} placeholder="Creator name" className="w-full text-xs font-bold bg-transparent border-b border-slate-200 dark:border-indigo-500/20 outline-none pb-1 focus:border-pink-500" />
                   <div className="flex gap-2">
                     <input value={pB.socialUrl} onChange={e => setPB({...pB, socialUrl: e.target.value})} placeholder="@username or URL" className="flex-1 text-[10px] bg-transparent outline-none text-slate-400 dark:text-slate-500 font-mono border-b border-slate-200 dark:border-indigo-500/20 pb-1" />
                     {profileDataB && profileDataB.platform === 'youtube' && (
                       <a href={`https://youtube.com/${profileDataB.username}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-500/20 rounded transition-colors">
                         <ExternalLink className="w-3 h-3 text-pink-500" />
                       </a>
                     )}
                   </div>
                   
                   <div className="flex gap-2">
                     <div className="flex-1 bg-white dark:bg-black/40 rounded p-1.5 border border-slate-100 dark:border-indigo-500/10">
                       <label className="text-[8px] block font-black text-slate-400 dark:text-slate-600 uppercase">Followers</label>
                       <input value={pB.followers} onChange={e => setPB({...pB, followers: e.target.value})} className="w-full text-[10px] font-bold bg-transparent outline-none text-pink-600 dark:text-fuchsia-500" />
                     </div>
                     <div className="w-16 bg-white dark:bg-black/40 rounded p-1.5 border border-slate-100 dark:border-indigo-500/10">
                       <label className="text-[8px] block font-black text-slate-400 dark:text-slate-600 uppercase">Level</label>
                       <input type="number" value={pB.level} onChange={e => setPB({...pB, level: parseInt(e.target.value)})} className="w-full text-[10px] font-bold bg-transparent outline-none text-pink-600 dark:text-fuchsia-500 text-center" />
                     </div>
                   </div>
                 </div>
                 
                 {/* Expanded Details */}
                 {expandedProfileB && profileDataB && (
                   <div className="border-t border-slate-200 dark:border-indigo-500/10 p-3 space-y-2 bg-white dark:bg-black/20">
                     <div className="flex items-center gap-2 mb-2">
                       <Verified className="w-3 h-3 text-pink-500" />
                       <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Profile Details</span>
                     </div>
                     
                     {profileDataB.description && (
                       <div className="text-[9px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                         {profileDataB.description}
                       </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-2">
                       {profileDataB.totalVideos !== undefined && (
                         <div className="bg-slate-50 dark:bg-slate-800/40 rounded p-2">
                           <div className="flex items-center gap-1 mb-0.5">
                             <Play className="w-2.5 h-2.5 text-pink-500" />
                             <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Videos</span>
                           </div>
                           <span className="text-[10px] font-bold text-pink-600 dark:text-fuchsia-500">{profileDataB.totalVideos.toLocaleString()}</span>
                         </div>
                       )}
                       {profileDataB.totalViews && (
                         <div className="bg-slate-50 dark:bg-slate-800/40 rounded p-2">
                           <div className="flex items-center gap-1 mb-0.5">
                             <Eye className="w-2.5 h-2.5 text-pink-500" />
                             <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Views</span>
                           </div>
                           <span className="text-[10px] font-bold text-pink-600 dark:text-fuchsia-500">{profileDataB.totalViews}</span>
                         </div>
                       )}
                     </div>
                     
                     {profileDataB.engagement && (
                       <div className="bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-500/10 dark:to-fuchsia-500/10 rounded p-2">
                         <div className="flex items-center justify-between">
                           <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase">Engagement</span>
                           <span className="text-[10px] font-bold text-pink-600 dark:text-fuchsia-500">{profileDataB.engagement}</span>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* Logic Calibration Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-indigo-500/10 space-y-4">
             <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /><h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logic Calibration</h3></div>
             
             {/* System Mode Selector */}
             <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">System Mode</label>
               <div className="flex gap-2">
                 <button
                   onClick={() => setSystemMode('arena')}
                   className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                     systemMode === 'arena'
                       ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
                       : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                   }`}
                 >
                   <Users className="w-3 h-3 mx-auto mb-1" />
                   Arena (Debate)
                 </button>
                 <button
                   onClick={() => setSystemMode('solo')}
                   className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                     systemMode === 'solo'
                       ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
                       : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                   }`}
                 >
                   <Brain className="w-3 h-3 mx-auto mb-1" />
                   Solo Analysis
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Region</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full text-[10px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg p-2 outline-none dark:text-slate-300">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} className="w-full text-[10px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg p-2 outline-none dark:text-slate-300">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
             </div>

             <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Target Demography</label>
                  <select value={demography} onChange={e => setDemography(e.target.value)} className="w-full text-[10px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg p-2 outline-none dark:text-slate-300">
                    {DEMOGRAPHICS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Arbiter Persona</label>
                  <select value={persona} onChange={e => setPersona(e.target.value)} className="w-full text-[10px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg p-2 outline-none dark:text-slate-300">
                    {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Logic Rigour</label>
                  <select value={logicStyle} onChange={e => setLogicStyle(e.target.value)} className="w-full text-[10px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg p-2 outline-none dark:text-slate-300">
                    {LOGIC_STYLES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase"><span>Margin of Error</span><span className="text-indigo-600 dark:text-indigo-400">{marginOfError}%</span></div>
                  <input type="range" min="0" max="50" step="1" value={marginOfError} onChange={e => setMarginOfError(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
             </div>
             
             {/* WSDC Adjudication Matrix Editor */}
             <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-indigo-500/10">
               <div className="flex items-center justify-between">
                 <label className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase flex items-center gap-1.5">
                   <Scale className="w-3 h-3" /> WSDC Adjudication Matrix
                 </label>
                 {!editingWeights && (
                   <button
                     onClick={() => {
                       setTempWeights(wsdcWeights);
                       setEditingWeights(true);
                     }}
                     className="text-[7px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                   >
                     EDIT WEIGHTS
                   </button>
                 )}
               </div>
               
               {editingWeights ? (
                 <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 border border-indigo-200 dark:border-indigo-500/20 space-y-3">
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-slate-600 dark:text-slate-400">Content (Logic, Evidence)</label>
                       <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{tempWeights.content}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.content}
                       onChange={e => setTempWeights(prev => ({ ...prev, content: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-slate-600 dark:text-slate-400">Style (Rhetoric, Clarity)</label>
                       <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{tempWeights.style}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.style}
                       onChange={e => setTempWeights(prev => ({ ...prev, style: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-[8px] font-bold text-slate-600 dark:text-slate-400">Strategy (Structure, Time)</label>
                       <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{tempWeights.strategy}%</span>
                     </div>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       step="5"
                       value={tempWeights.strategy}
                       onChange={e => setTempWeights(prev => ({ ...prev, strategy: parseInt(e.target.value) }))}
                       className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                   </div>
                   
                   <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase">Total:</span>
                       <span className={`text-[10px] font-black ${
                         tempWeights.content + tempWeights.style + tempWeights.strategy === 100
                           ? 'text-emerald-600 dark:text-emerald-400'
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
                         className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Apply
                       </button>
                       <button
                         onClick={resetWeights}
                         className="px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Reset
                       </button>
                       <button
                         onClick={() => {
                           setEditingWeights(false);
                           setTempWeights(wsdcWeights);
                         }}
                         className="px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase py-2 rounded-lg transition-all"
                       >
                         Cancel
                       </button>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex gap-2 items-center">
                   <div className="flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Content</div>
                     <div className="text-[11px] font-black">{wsdcWeights.content}%</div>
                   </div>
                   <div className="flex-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Style</div>
                     <div className="text-[11px] font-black">{wsdcWeights.style}%</div>
                   </div>
                   <div className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg px-3 py-2 text-white">
                     <div className="text-[7px] font-bold uppercase opacity-80">Strategy</div>
                     <div className="text-[11px] font-black">{wsdcWeights.strategy}%</div>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Neural RAG Binding - UPDATED with specific examples and file placeholders */}
          <div className="pt-4 border-t border-slate-200 dark:border-indigo-500/10 space-y-4">
             <div className="flex items-center gap-2 mb-2"><ClipboardList className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /><h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Knowledge Ingestion</h3></div>
             
             {/* Supervisor Prompt - Auto-Generated from Logic Calibrator */}
             <div className="space-y-2 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 rounded-xl p-3 border border-indigo-200 dark:border-indigo-500/20">
               <label className="flex items-center gap-1.5 text-[8px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <Brain className="w-3 h-3 animate-pulse" /> Supervisor Intelligence Directive (Auto-Generated)
               </label>
               <div className="w-full bg-white dark:bg-black/40 text-[9px] font-mono leading-relaxed border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-3 max-h-64 overflow-y-auto text-slate-700 dark:text-slate-300 space-y-2 shadow-sm no-scrollbar">
                 <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black border-b border-cyan-200 dark:border-cyan-500/20 pb-2">
                   <Settings2 className="w-3 h-3" />
                   <span>ACTIVE CALIBRATION PARAMETERS</span>
                 </div>
                 <div className="space-y-1.5 text-[8px] font-medium">
                   <div className="bg-amber-50 dark:bg-amber-500/10 rounded px-2 py-1.5 border border-amber-200 dark:border-amber-500/20">
                     <p><span className="text-amber-700 dark:text-amber-400 font-black">🎯 System Mode:</span> <span className="text-amber-900 dark:text-amber-300 font-bold">{systemMode === 'arena' ? 'DEBATE ANALYSIS (Arena)' : 'SOLO CONTENT ANALYSIS'}</span></p>
                     <p className="mt-1"><span className="text-amber-700 dark:text-amber-400 font-black">👤 Participants:</span> <span className="text-amber-900 dark:text-amber-300 font-bold">{systemMode === 'arena' ? `${pA.name} vs ${pB.name}` : pA.name}</span></p>
                   </div>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">🌍 Region:</span> {country} ({year})</p>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">👥 Audience:</span> {demography}</p>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">⚖️ Persona:</span> {persona}</p>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">🧠 Logic:</span> {logicStyle}</p>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">🎯 Mode:</span> {stakeholderMode}</p>
                   <p><span className="text-indigo-600 dark:text-indigo-400 font-black">📊 Error:</span> ±{marginOfError}%</p>
                   <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded px-2 py-1.5 border border-indigo-200 dark:border-indigo-500/20 mt-1">
                     <p className="font-black text-indigo-700 dark:text-indigo-300 mb-1">🎖️ WSDC ADJUDICATION MATRIX:</p>
                     <p className="ml-3"><span className="text-indigo-600 dark:text-indigo-400 font-black">• Content:</span> {wsdcWeights.content}%</p>
                     <p className="ml-3"><span className="text-indigo-600 dark:text-indigo-400 font-black">• Style:</span> {wsdcWeights.style}%</p>
                     <p className="ml-3"><span className="text-indigo-600 dark:text-indigo-400 font-black">• Strategy:</span> {wsdcWeights.strategy}%</p>
                     <p className="ml-3 text-emerald-600 dark:text-emerald-400 font-black">✓ Total: {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}%</p>
                   </div>
                 </div>
               </div>
               <div className="flex items-start gap-2 text-[8px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                 <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                 <span className="font-medium">This directive is <strong>automatically populated</strong> from Logic Calibrator settings above. Adjust calibration controls to dynamically reconfigure RAG orchestration.</span>
               </div>
             </div>

             <div className="space-y-2">
               <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                  <LinkIcon className="w-2.5 h-2.5" /> Reference URLs
               </label>
               <textarea 
                  value={ragUrls} 
                  onChange={e => setRagUrls(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-black/40 text-[10px] font-mono border border-slate-200 dark:border-indigo-500/20 rounded-xl p-3 h-20 outline-none text-slate-700 dark:text-slate-400 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all shadow-inner" 
                  placeholder={"https://ipcc.ch/report/...\nhttps://fbref.com/en/..."} 
               />
             </div>

             <div className="space-y-2">
               <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                  <FileText className="w-2.5 h-2.5" /> Files / Transcripts
               </label>
               <div 
                  onClick={() => contextInputRef.current?.click()} 
                  className="p-4 border-2 border-dashed border-slate-200 dark:border-indigo-500/10 rounded-2xl bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 transition-all flex flex-col items-center justify-center cursor-pointer group"
               >
                  <FileUp className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 mb-2" />
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest group-hover:text-slate-600 dark:group-hover:text-slate-400">
                    Drop .pdf / .txt / .vtt here
                  </span>
                  <input ref={contextInputRef} type="file" className="hidden" multiple onChange={handleContextUpload} />
               </div>
               {contextFiles.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                   {contextFiles.slice(0, 3).map((f, i) => (
                     <span key={i} className="text-[7px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20 truncate max-w-[80px]">{f}</span>
                   ))}
                   {contextFiles.length > 3 && <span className="text-[7px] font-bold text-slate-400">+{contextFiles.length - 3} more</span>}
                 </div>
               )}
             </div>
          </div>

        </aside>

        {/* Main Feed: The Crystal Box Analysis */}
        <main className="flex-1 flex flex-col min-w-0 p-6 space-y-6 overflow-y-auto no-scrollbar bg-slate-100/50 dark:bg-slate-950/50">
          
          <div className="grid lg:grid-cols-[1fr_350px] gap-6">
            <div className="space-y-6">
               {/* Analysis Input Zone */}
               <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-indigo-500/10 p-6 shadow-xl dark:shadow-2xl relative overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Input Stream</h4>
                       <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-indigo-500/20 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all overflow-hidden relative shadow-inner group">
                         {video ? <video src={video} className="w-full h-full object-contain" controls /> : (
                           <><div className="w-12 h-12 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-2 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform"><History className="w-5 h-5 text-indigo-500" /></div><p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Neural Simulation Idle</p></>
                         )}
                         <input ref={fileInputRef} type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Gavel className="w-3.5 h-3.5 text-indigo-500" /> Arbiter Tuning</h4>
                         <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">Preset:</span>
                           <select 
                             value={arbiterPreset} 
                             onChange={(e) => {
                               setArbiterPreset(e.target.value);
                               if (e.target.value !== 'custom') {
                                 setPrompt(PRESET_PROMPTS[e.target.value as keyof typeof PRESET_PROMPTS]);
                               }
                             }}
                             className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg px-2 py-1 outline-none text-indigo-600 dark:text-indigo-400 cursor-pointer"
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
                         className="flex-1 w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-2xl p-4 text-[11px] font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none text-slate-700 dark:text-slate-300 shadow-inner min-h-[160px]" 
                         placeholder="Execute specific syllogistic query..."
                       />
                       <div className="flex items-start gap-2 text-[8px] text-indigo-600 dark:text-indigo-400 leading-tight">
                         <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                         <span className="font-medium">This query defines analysis focus and depth. Select preset or write custom instructions. More specific = better results.</span>
                       </div>
                       <button onClick={runAnalysis} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 group">
                         {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />} Execute Audit
                       </button>
                    </div>
                  </div>
               </div>

               {/* Cognitive Output Area */}
               <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-indigo-500/10 flex flex-col overflow-hidden min-h-[500px] shadow-xl dark:shadow-2xl relative">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-indigo-500/10 bg-slate-50 dark:bg-black/20 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /><h3 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Logical Adjudication Matrix</h3></div>
                       {result && (
                         <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-indigo-500/20">
                           <button 
                             onClick={() => setVisualMode(true)}
                             className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${visualMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                           >
                             <Eye className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => setVisualMode(false)}
                             className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all ${!visualMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                           >
                             <FileText className="w-3 h-3" />
                           </button>
                         </div>
                       )}
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest">Truth Density: {reliability}%</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     </div>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                    {loading ? (
                       <div className="h-full flex flex-col items-center justify-center gap-8">
                          <div className="relative">
                             <Brain className="w-16 h-16 text-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                             <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-ping" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 animate-pulse">Extracting Toulmin Nodes</p>
                       </div>
                    ) : result ? (
                       visualMode && extractedJSON ? (
                         <div className="space-y-6">
                           {/* Visual Mode: Cards and Charts */}
                           <div className="grid grid-cols-2 gap-4">
                             {/* Winner Card */}
                             <div className="col-span-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/5 rounded-2xl border-2 border-amber-300 dark:border-amber-500/30 p-6 text-center">
                               <div className="flex items-center justify-center gap-3 mb-3">
                                 <Verified className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                 <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Winner: {extractedJSON.gamification?.winner || 'TIE'}</h3>
                               </div>
                               <div className="flex justify-center gap-8 text-sm font-bold">
                                 <div className="text-indigo-600 dark:text-cyan-500">{pA.name}: {extractedJSON.gamification?.points_a || arenaStats.pointsA} pts</div>
                                 {analysisMode === AnalysisMode.ARENA && <div className="text-pink-600 dark:text-fuchsia-500">{pB.name}: {extractedJSON.gamification?.points_b || arenaStats.pointsB} pts</div>}
                               </div>
                             </div>
                             
                             {/* WSDC Scores Visual */}
                             {extractedJSON.scores && (
                               <div className="col-span-2 space-y-4">
                                 <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                   <Scale className="w-4 h-4" /> WSDC Score Breakdown
                                 </h4>
                                 {Object.entries(extractedJSON.scores).filter(([key]) => key !== 'total').map(([category, scores]: [string, any]) => (
                                   <div key={category} className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-black uppercase">
                                       <span className="text-slate-600 dark:text-slate-400">{category}</span>
                                       <div className="flex gap-4">
                                         <span className="text-indigo-600 dark:text-cyan-500">A: {scores.a}</span>
                                         {scores.b !== undefined && <span className="text-pink-600 dark:text-fuchsia-500">B: {scores.b}</span>}
                                       </div>
                                     </div>
                                     <div className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                       <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-end pr-2 transition-all duration-500" style={{width: `${(scores.a / (scores.a + (scores.b || 0))) * 100}%`}}>
                                         <span className="text-[10px] font-black text-white">{scores.a}</span>
                                       </div>
                                       {scores.b !== undefined && (
                                         <div className="absolute right-0 top-0 h-full bg-gradient-to-l from-pink-500 to-fuchsia-500 flex items-center justify-start pl-2 transition-all duration-500" style={{width: `${(scores.b / (scores.a + scores.b)) * 100}%`}}>
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
                                 <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4">
                                   <h4 className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                     <Zap className="w-3 h-3" /> Strongest Argument
                                   </h4>
                                   <p className="text-[10px] font-medium text-emerald-900 dark:text-emerald-300 leading-relaxed">{extractedJSON.final_verdict.strongest_argument}</p>
                                 </div>
                                 <div className="bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 p-4">
                                   <h4 className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                     <AlertCircle className="w-3 h-3" /> Weakest Argument
                                   </h4>
                                   <p className="text-[10px] font-medium text-red-900 dark:text-red-300 leading-relaxed">{extractedJSON.final_verdict.weakest_argument}</p>
                                 </div>
                                 {extractedJSON.final_verdict.key_fallacies?.length > 0 && (
                                   <div className="col-span-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20 p-4">
                                     <h4 className="text-[9px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                       <Activity className="w-3 h-3" /> Critical Fallacies Detected
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
                               <div className="col-span-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20 p-4">
                                 <h4 className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                   <BarChart3 className="w-3 h-3" /> Executive Summary
                                 </h4>
                                 <p className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300 leading-relaxed">{extractedJSON.final_verdict.summary}</p>
                               </div>
                             )}
                           </div>
                         </div>
                       ) : (
                         <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed selection:bg-indigo-500/30">
                           <div className="prose dark:prose-invert prose-slate prose-xs max-w-none">
                             {result.split(/POINTS_A|POINTS_B|TRUTH_POT|FOLLOWERS_A|FOLLOWERS_B|AWARD/)[0]}
                             <div className="mt-8 pt-8 border-t border-slate-100 dark:border-indigo-500/10">
                                {result.substring(result.indexOf('Verdict:'))}
                             </div>
                           </div>
                         </div>
                       )
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                          <Binary className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Awaiting Simulation Data</p>
                       </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Right: Chain of Thought Mind Palace, Temporal Scores, Active Fallacy Console & Score Rubrics */}
            <aside className="space-y-6">
               
               {/* Chain of Thought - Mind Palace Visualization */}
               {result && showCoT && (
                 <div className="bg-gradient-to-br from-cyan-500/5 via-indigo-500/5 to-purple-500/5 dark:from-cyan-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 rounded-3xl border-2 border-cyan-400/30 dark:border-cyan-500/30 overflow-hidden shadow-2xl relative">
                   <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3lhbiIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                   
                   <div className="relative px-5 py-3 border-b border-cyan-400/20 dark:border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/5 flex items-center justify-between backdrop-blur-sm">
                     <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                       <Brain className="w-3.5 h-3.5 animate-pulse" /> Mind Palace (Chain of Thought)
                     </h4>
                     <button 
                       onClick={() => setShowCoT(!showCoT)}
                       className="text-[8px] font-black text-cyan-600 dark:text-cyan-400 uppercase hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
                     >
                       {showCoT ? 'COLLAPSE' : 'EXPAND'}
                     </button>
                   </div>
                   
                   <div className="relative p-5 max-h-[300px] overflow-y-auto space-y-3 no-scrollbar">
                     {/* Extract CoT section if present */}
                     {result.includes('CHAIN OF THOUGHT') ? (
                       result.match(/CHAIN OF THOUGHT:([\s\S]*?)(?=\d\.|ARBITER VERDICT|$)/)?.[1]
                         .split('\n')
                         .filter(line => line.trim())
                         .map((line, i) => (
                           <div key={i} className="flex gap-3 animate-in slide-in-from-left-2" style={{animationDelay: `${i * 50}ms`}}>
                             <div className="w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                             <div className="flex-1 space-y-1">
                               <p className="text-[9px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed bg-white/60 dark:bg-black/40 p-2.5 rounded-lg border border-cyan-200/50 dark:border-cyan-500/20 backdrop-blur-sm">
                                 {line.trim().replace(/^[-*•]\s*/, '')}
                               </p>
                             </div>
                           </div>
                         ))
                     ) : (
                       <p className="text-[10px] text-cyan-600/60 dark:text-cyan-400/60 italic text-center py-8">
                         Cognitive trace will appear here during analysis...
                       </p>
                     )}
                   </div>
                 </div>
               )}

               {/* Temporal Score Evolution - Chess-style Advantage Graph */}
               {extractedJSON?.temporal_scores && temporalScores.length > 0 && (
                 <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-indigo-500/10 overflow-hidden shadow-lg dark:shadow-2xl">
                   <div className="px-5 py-3 border-b border-slate-100 dark:border-indigo-500/10 bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3 text-indigo-500" /> Temporal Score Evolution
                     </h4>
                     <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase">LIVE TRACKING</span>
                   </div>
                   <div className="p-5 space-y-4">
                     {/* Simple bar chart representation */}
                     <div className="space-y-2">
                       {temporalScores.map((ts, i) => (
                         <div key={i} className="space-y-1">
                           <div className="flex justify-between text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">
                             <span>{Math.floor(ts.time / 60)}:{String(ts.time % 60).padStart(2, '0')}</span>
                             <span>A: {ts.scoreA} | B: {ts.scoreB}</span>
                           </div>
                           <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div 
                               className="absolute left-0 top-0 h-full bg-indigo-500 transition-all duration-500" 
                               style={{width: `${(ts.scoreA / (ts.scoreA + ts.scoreB)) * 100}%`}}
                             />
                             <div 
                               className="absolute right-0 top-0 h-full bg-pink-500 transition-all duration-500" 
                               style={{width: `${(ts.scoreB / (ts.scoreA + ts.scoreB)) * 100}%`}}
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

               <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-indigo-500/10 overflow-hidden flex flex-col h-[350px] shadow-lg dark:shadow-2xl">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-indigo-500/10 bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3 text-red-500" /> Fallacy Log</h4>
                       <span className="text-[8px] font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{fallacyLog.length} Total</span>
                     </div>
                     <div className="flex items-center gap-2">
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
                             className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
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
                  <div className="flex-1 p-5 overflow-y-auto space-y-3 no-scrollbar">
                     {fallacyLog.length > 0 ? fallacyLog.slice().reverse().map((entry, i) => (
                        <div key={i} className="flex gap-3 animate-in slide-in-from-right-2 duration-300 bg-red-50 dark:bg-red-500/5 rounded-lg p-3 border border-red-100 dark:border-red-500/10">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                           <div className="flex-1 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Syllogistic Violation</p>
                                <span className="text-[7px] font-medium text-slate-400 dark:text-slate-600">{entry.timestamp.toLocaleTimeString()}</span>
                              </div>
                              <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">{entry.fallacy}</p>
                              <div className="flex items-center gap-3 text-[8px] font-bold">
                                <span className="text-indigo-600 dark:text-cyan-500">{entry.speaker}</span>
                                {entry.impact !== '0' && <span className={`${entry.impact.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{entry.impact} pts</span>}
                              </div>
                           </div>
                        </div>
                     )) : <p className="text-[10px] text-slate-400 dark:text-slate-600 italic font-medium text-center py-20 opacity-50">Zero violations registered. Fallacies will be logged here with timestamps and metadata.</p>}
                  </div>
               </div>

               {/* WSDC Rubric (Editable) - Enhanced Display */}
               <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-indigo-500/10 p-6 space-y-6 shadow-lg dark:shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Scale className="w-3 h-3 text-indigo-500" /> WSDC Adjudication Matrix
                    </h4>
                    <button 
                      onClick={() => setEditingWeights(!editingWeights)}
                      className="text-[7px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
                    >
                      {editingWeights ? 'LOCK' : 'EDIT'} {wsdcWeights.content}/{wsdcWeights.style}/{wsdcWeights.strategy}
                    </button>
                  </div>
                  
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
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{rubric.label}</span>
                            <div className="flex gap-2 text-[10px] font-black">
                              <span className="text-indigo-600 dark:text-cyan-500">
                                A: {extractedJSON.final_verdict.scores[rubric.key].a}/{rubric.max}
                              </span>
                              {analysisMode === AnalysisMode.ARENA && (
                                <span className="text-pink-600 dark:text-fuchsia-500">
                                  B: {extractedJSON.final_verdict.scores[rubric.key].b}/{rubric.max}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 dark:bg-cyan-500 transition-all duration-1000" 
                                style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].a / rubric.max) * 100}%`}}
                              />
                            </div>
                            {analysisMode === AnalysisMode.ARENA && (
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-pink-500 dark:bg-fuchsia-500 transition-all duration-1000" 
                                  style={{width: `${(extractedJSON.final_verdict.scores[rubric.key].b / rubric.max) * 100}%`}}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-slate-200 dark:border-indigo-500/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Total Score</span>
                          <div className="flex gap-3 text-sm font-black">
                            <span className="text-indigo-600 dark:text-cyan-500">{extractedJSON.final_verdict.scores.total.a}</span>
                            {analysisMode === AnalysisMode.ARENA && (
                              <>
                                <span className="text-slate-400">/</span>
                                <span className="text-pink-600 dark:text-fuchsia-500">{extractedJSON.final_verdict.scores.total.b}</span>
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
                                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter block">{m.label}</span>
                                  <span className="text-[8px] text-slate-400 dark:text-slate-600 block leading-tight">{m.desc}</span>
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
                                    className="w-14 text-xs font-black text-indigo-600 dark:text-cyan-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded px-2 py-1 text-center outline-none focus:ring-2 focus:ring-indigo-500/30"
                                  />
                                ) : (
                                  <span className="text-xs font-black text-indigo-600 dark:text-cyan-500">{wsdcWeights[m.key as keyof typeof wsdcWeights]}%</span>
                                )}
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-1000 shadow-sm" 
                                  style={{ width: `${wsdcWeights[m.key as keyof typeof wsdcWeights]}%` }} 
                                />
                             </div>
                          </div>
                       ))}
                       {editingWeights && (
                         <div className="pt-3 border-t border-slate-200 dark:border-indigo-500/10">
                           <div className="flex items-center justify-between text-[9px]">
                             <span className="font-black text-slate-400 dark:text-slate-600 uppercase">Total:</span>
                             <span className={`font-black ${wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy === 100 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                               {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy}% {wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy !== 100 && '⚠️ Must = 100'}
                             </span>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </aside>
          </div>

          {error && <div className="p-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-widest animate-in shake"><AlertCircle className="w-6 h-6 shrink-0" /> Engine Fault: {error}</div>}
        </main>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
    </div>
  );
};
