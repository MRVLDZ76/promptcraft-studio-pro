export enum Mode {
  IMAGE = 'image',
  VIDEO = 'video',
  SEQUENCE = 'sequence',
  EDIT = 'edit',
  AUDIO = 'audio',
  TRANSCRIPTION = 'transcription',
  ANALYSIS = 'analysis',
  NARRATIVE = 'narrative',
  PUBLISHING = 'publishing',
  WORKSPACE = 'workspace',
  SUBSCRIPTION = 'subscription'
}

export enum AnalysisMode {
  ARENA = 'arena',
  MONOLOGUE = 'monologue'
}

export interface Participant {
  name: string;
  vector: string;
  socialUrl: string;
  followers: string;
  level: number;
  thumbnail: string;
}

export enum FallacyType {
  AD_HOMINEM = 'Ad Hominem',
  STRAWMAN = 'Strawman',
  SLIPPERY_SLOPE = 'Slippery Slope',
  FALSE_DILEMMA = 'False Dilemma',
  APPEAL_TO_AUTHORITY = 'Appeal to Authority',
  HASTY_GENERALIZATION = 'Hasty Generalization',
  POST_HOC = 'Post Hoc Ergo Propter Hoc',
  RED_HERRING = 'Red Herring',
  CIRCULAR_REASONING = 'Circular Reasoning',
  APPEAL_TO_EMOTION = 'Appeal to Emotion',
  BANDWAGON = 'Bandwagon Fallacy',
  NO_TRUE_SCOTSMAN = 'No True Scotsman'
}

export enum ToulminComponent {
  CLAIM = 'Claim',
  GROUNDS = 'Grounds/Data',
  WARRANT = 'Warrant',
  BACKING = 'Backing',
  QUALIFIER = 'Modal Qualifier',
  REBUTTAL = 'Rebuttal'
}

export interface ArgumentNode {
  id: string;
  timestamp_in: number;
  timestamp_out: number;
  speaker_id: string;
  claim_text_short: string;
  claim_text_full: string;
  toulmin_component: ToulminComponent;
  logic_status: 'VALID' | 'FALLACY' | 'WEAK_EVIDENCE' | 'CONTRADICTION';
  fallacy_type?: FallacyType;
  score_impact: number;
  confidence: number;
}

export interface DebateGraphJSON {
  debate_title: string;
  total_duration: number;
  participants: Participant[];
  argument_nodes: ArgumentNode[];
  temporal_scores: TemporalScore[];
  final_verdict: FinalVerdict;
}

export interface TemporalScore {
  timestamp: number;
  participant_a_score: number;
  participant_b_score?: number;
  momentum: 'GAINING' | 'LOSING' | 'STABLE';
}

export interface FinalVerdict {
  winner?: string;
  scores: {
    content: { a: number; b?: number };
    style: { a: number; b?: number };
    strategy: { a: number; b?: number };
    total: { a: number; b?: number };
  };
  key_fallacies: string[];
  strongest_argument: string;
  weakest_argument: string;
}

export interface VisualIngredient {
  id: string;
  label: string;
  value: string;
  desc: string;
}

export interface PromptState {
  subject: string;
  negative: string;
  aspect: string;
  model: string;
  imageSize: '1K' | '2K' | '4K';
  visualStyle: string;
  style: {
    cam: string;
    light: string[];
    film: string;
  };
  scene: {
    setting: string;
    action: string;
    composition: string;
    mood: string;
    color: string;
  };
  detailLevel: 'compact' | 'detailed' | 'ultra';
  customIngredients: string[];
  video: {
    move: string;
    dur: string;
    resolution: '720p' | '1080p';
  };
}

export interface Character {
  id: string;
  name: string;
  text: string;
}

export interface SequenceSegment {
  id: number;
  seconds: number;
  action: string;
  prompt: string;
  cameraMovement: string;
  visualStyle: string;
}

export interface QAIssue {
  severity: 'warn' | 'info';
  title: string;
  detail: string;
  fixId: string | null;
}
