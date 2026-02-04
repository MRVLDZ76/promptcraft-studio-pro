// ChronStudio Service - Video Story Production
import apiClient from './apiClient';

export interface ChronStudioProject {
  id?: string;
  title: string;
  category: 'BIBLICAL' | 'HISTORICAL' | 'CUSTOM';
  story_summary?: string;
  style_choices?: any;
  character_ids?: string[];
  workflow_step: 'concept' | 'characters' | 'scenes' | 'generation' | 'complete';
  created_at?: string;
}

export interface ChronStudioCharacter {
  id?: string;
  project: string;
  name: string;
  description: string;
  image_prompt: string;
  generated_image_url?: string;
  tags?: string[];
}

export interface ChronStudioScene {
  id?: string;
  project: string;
  scene_number: number;
  description: string;
  veo_prompt: string;
  video_status: 'pending' | 'generating' | 'completed' | 'failed';
  video_url?: string;
  duration_seconds?: number;
}

class ChronStudioService {
  // Projects
  async getProjects(): Promise<ChronStudioProject[]> {
    const response = await apiClient.get<ChronStudioProject[]>('/chronstudio/projects/');
    return response.data;
  }

  async getProject(id: string): Promise<ChronStudioProject> {
    const response = await apiClient.get<ChronStudioProject>(`/chronstudio/projects/${id}/`);
    return response.data;
  }

  async createProject(data: Partial<ChronStudioProject>): Promise<ChronStudioProject> {
    const response = await apiClient.post<ChronStudioProject>('/chronstudio/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<ChronStudioProject>): Promise<ChronStudioProject> {
    const response = await apiClient.patch<ChronStudioProject>(`/chronstudio/projects/${id}/`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/chronstudio/projects/${id}/`);
  }

  // Characters
  async getCharacters(projectId?: string): Promise<ChronStudioCharacter[]> {
    const response = await apiClient.get<ChronStudioCharacter[]>('/chronstudio/characters/', {
      params: projectId ? { project: projectId } : undefined,
    });
    return response.data;
  }

  async createCharacter(data: Partial<ChronStudioCharacter>): Promise<ChronStudioCharacter> {
    const response = await apiClient.post<ChronStudioCharacter>('/chronstudio/characters/', data);
    return response.data;
  }

  // Scenes
  async getScenes(projectId: string): Promise<ChronStudioScene[]> {
    const response = await apiClient.get<ChronStudioScene[]>('/chronstudio/scenes/', {
      params: { project: projectId },
    });
    return response.data;
  }

  async createScene(data: Partial<ChronStudioScene>): Promise<ChronStudioScene> {
    const response = await apiClient.post<ChronStudioScene>('/chronstudio/scenes/', data);
    return response.data;
  }
}

export const chronStudioService = new ChronStudioService();
export default chronStudioService;
