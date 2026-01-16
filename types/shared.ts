// Common types used across modes
export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  mimeType: string;
  metadata: Record<string, any>;
}

export interface UnifiedCharacter {
  id: string;
  name: string;
  category: 'prompt' | 'narrative' | 'debate';
  
  // From basic character system
  promptText?: string;
  
  // From narrative character system
  role?: string;
  visualDescription?: string;
  voiceDescription?: string;
  referenceImageUrl?: string;
  
  // Enhanced metadata
  tags?: string[];
  metadata?: {
    createdAt: number;
    lastUsed: number;
    usageCount: number;
  };
}

export interface ExportOptions {
  format: 'json' | 'pdf' | 'csv' | 'zip' | 'video';
  quality?: 'low' | 'medium' | 'high';
  includeMetadata: boolean;
}
