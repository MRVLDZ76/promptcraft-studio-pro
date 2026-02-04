export enum ProjectCategory {
  BIBLICAL = 'BIBLICAL',
  HISTORICAL = 'HISTORICAL',
  CUSTOM = 'CUSTOM'
}

export enum StoryStyle {
  CINEMATIC_DRAMA = 'CINEMATIC_DRAMA',
  DOCUMENTARY = 'DOCUMENTARY',
  ANIMATED_STYLIZED = 'ANIMATED_STYLIZED',
  RETRO_FUTURISM = 'RETRO_FUTURISM',
  GRITTY_REALISM = 'GRITTY_REALISM',
  FAIRYTALE = 'FAIRYTALE',
  LOW_POLY_3D = 'LOW_POLY_3D',
  VINTAGE_KODACHROME = 'VINTAGE_KODACHROME',
  SURREAL_DREAMSCAPE = 'SURREAL_DREAMSCAPE',
  PENCIL_SKETCH = 'PENCIL_SKETCH',
  NEO_NOIR = 'NEO_NOIR'
}

export enum ProductionMode {
  INTEGRATED = 'INTEGRATED',
  EXTERNAL = 'EXTERNAL'
}

export interface NarrativeCharacter {
  id: string;
  name: string;
  role: string;
  visualDescription: string;
  voiceDescription: string;
  referenceImageUrl?: string;
}

export interface Scene {
  id: string;
  number: number;
  durationSeconds: number;
  narrativeText: string;
  visualPrompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  characterIds: string[];
  copied?: boolean;
}

export interface NarrativeProject {
  category: ProjectCategory;
  mode: ProductionMode;
  title: string;
  segment: string;
  content: string;
  contextNote: string;
  summary: string;
  setting: {
    year: string;
    region: string;
    landscape: string;
  };
  style: StoryStyle;
  characters: NarrativeCharacter[];
  storyboard: Scene[];
}

export enum NarrativeStep {
  TEMPLATE = 0,
  INPUT = 1,
  CHARACTERS = 2,
  STORYBOARD = 3,
  PRODUCTION = 4
}
