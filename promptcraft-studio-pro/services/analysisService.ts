// Analysis Service - Debate & Argument Analysis
import apiClient from './apiClient';

export interface CreatorProfile {
  id?: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter';
  username: string;
  handle: string;
  display_name: string;
  thumbnail?: string;
  description?: string;
  followers_count?: number;
  verified?: boolean;
}

export interface Debate {
  id?: string;
  title: string;
  mode: 'arena' | 'monologue';
  video_url?: string;
  transcript_text?: string;
  participant_a_name?: string;
  participant_b_name?: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  final_verdict?: string;
  tags?: string[];
  created_at?: string;
}

export interface ArgumentNode {
  id?: string;
  debate: string;
  participant: string;
  claim: string;
  toulmin_component: 'claim' | 'data' | 'warrant' | 'backing' | 'qualifier' | 'rebuttal';
  logic_status: 'valid' | 'fallacy' | 'weak';
  fallacy_type?: string;
  score_impact: number;
}

export interface Analysis {
  id?: string;
  participant_a_name: string;
  participant_b_name?: string;
  mode: 'arena' | 'solo';
  youtube_url?: string;
  transcript?: string;
  result_data?: any;
  result_text?: string;
  status: string;
}

class AnalysisService {
  // Creator Profiles
  async getCreatorProfiles(): Promise<CreatorProfile[]> {
    const response = await apiClient.get<CreatorProfile[]>('/analyses/creator-profiles/');
    return response.data;
  }

  async createCreatorProfile(data: CreatorProfile): Promise<CreatorProfile> {
    const response = await apiClient.post<CreatorProfile>('/analyses/creator-profiles/', data);
    return response.data;
  }

  // Debates
  async getDebates(): Promise<Debate[]> {
    const response = await apiClient.get<Debate[]>('/analyses/debates/');
    return response.data;
  }

  async getDebate(id: string): Promise<Debate> {
    const response = await apiClient.get<Debate>(`/analyses/debates/${id}/`);
    return response.data;
  }

  async createDebate(data: Partial<Debate>): Promise<Debate> {
    const response = await apiClient.post<Debate>('/analyses/debates/', data);
    return response.data;
  }

  async updateDebate(id: string, data: Partial<Debate>): Promise<Debate> {
    const response = await apiClient.patch<Debate>(`/analyses/debates/${id}/`, data);
    return response.data;
  }

  async deleteDebate(id: string): Promise<void> {
    await apiClient.delete(`/analyses/debates/${id}/`);
  }

  // Argument Nodes
  async getArgumentNodes(debateId: string): Promise<ArgumentNode[]> {
    const response = await apiClient.get<ArgumentNode[]>('/analyses/argument-nodes/', {
      params: { debate: debateId },
    });
    return response.data;
  }

  async createArgumentNode(data: Partial<ArgumentNode>): Promise<ArgumentNode> {
    const response = await apiClient.post<ArgumentNode>('/analyses/argument-nodes/', data);
    return response.data;
  }

  // Legacy Analyses
  async getAnalyses(): Promise<Analysis[]> {
    const response = await apiClient.get<Analysis[]>('/analyses/legacy-analyses/');
    return response.data;
  }

  async createAnalysis(data: Partial<Analysis>): Promise<Analysis> {
    const response = await apiClient.post<Analysis>('/analyses/legacy-analyses/', data);
    return response.data;
  }
}

export const analysisService = new AnalysisService();
export default analysisService;
