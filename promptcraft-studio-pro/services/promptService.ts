// Prompt Studio Service
import apiClient from './apiClient';

export interface PromptProject {
  id?: string;
  title: string;
  mode: 'image' | 'video' | 'sequence' | 'audio';
  prompt_state?: any;
  prompt_history?: string[];
  tags?: string[];
  created_at?: string;
}

export interface SequenceSegment {
  id?: string;
  project: string;
  sequence_number: number;
  prompt_text: string;
  generated_output_url?: string;
}

class PromptService {
  async getProjects(): Promise<PromptProject[]> {
    const response = await apiClient.get<PromptProject[]>('/prompts/projects/');
    return response.data;
  }

  async getProject(id: string): Promise<PromptProject> {
    const response = await apiClient.get<PromptProject>(`/prompts/projects/${id}/`);
    return response.data;
  }

  async createProject(data: Partial<PromptProject>): Promise<PromptProject> {
    const response = await apiClient.post<PromptProject>('/prompts/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<PromptProject>): Promise<PromptProject> {
    const response = await apiClient.patch<PromptProject>(`/prompts/projects/${id}/`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/prompts/projects/${id}/`);
  }

  async getSegments(projectId: string): Promise<SequenceSegment[]> {
    const response = await apiClient.get<SequenceSegment[]>('/prompts/segments/', {
      params: { project: projectId },
    });
    return response.data;
  }

  async createSegment(data: Partial<SequenceSegment>): Promise<SequenceSegment> {
    const response = await apiClient.post<SequenceSegment>('/prompts/segments/', data);
    return response.data;
  }
}

export const promptService = new PromptService();
export default promptService;
