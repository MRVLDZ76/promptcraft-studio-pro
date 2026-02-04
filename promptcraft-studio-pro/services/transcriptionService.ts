// Transcription Service
import apiClient from './apiClient';

export interface Transcription {
  id?: string;
  source_type: 'upload' | 'youtube' | 'url';
  source_url?: string;
  file_path?: string;
  transcript_text?: string;
  diarization_data?: any;
  summary?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  processing_time?: number;
  created_at?: string;
}

class TranscriptionService {
  async getTranscriptions(): Promise<Transcription[]> {
    const response = await apiClient.get<Transcription[]>('/transcriptions/transcriptions/');
    return response.data;
  }

  async getTranscription(id: string): Promise<Transcription> {
    const response = await apiClient.get<Transcription>(`/transcriptions/transcriptions/${id}/`);
    return response.data;
  }

  async createTranscription(data: Partial<Transcription>): Promise<Transcription> {
    const response = await apiClient.post<Transcription>('/transcriptions/transcriptions/', data);
    return response.data;
  }

  async uploadFile(file: File): Promise<Transcription> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', 'upload');

    const response = await apiClient.post<Transcription>('/transcriptions/transcriptions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const transcriptionService = new TranscriptionService();
export default transcriptionService;
