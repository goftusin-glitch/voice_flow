import { apiClient } from './api';
import {
  UploadAudioResponse,
  AnalyzeResponse,
  FinalizeRequest,
  FinalizeResponse,
} from '../types/analysis';

class AnalysisService {
  async uploadAudio(audioFile: File, templateId: number): Promise<UploadAudioResponse> {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('template_id', templateId.toString());

    const response = await apiClient.post<UploadAudioResponse>(
      '/analysis/upload-audio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async createTextAnalysis(text: string, templateId: number): Promise<{ success: boolean; data: { analysis_id: number; input_type: string } }> {
    const response = await apiClient.post<{ success: boolean; data: { analysis_id: number; input_type: string } }>(
      '/analysis/create-text',
      {
        text,
        template_id: templateId,
      }
    );

    return response.data;
  }

  async uploadImage(imageFile: File, templateId: number): Promise<{ success: boolean; data: { analysis_id: number; image_path: string; input_type: string } }> {
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('template_id', templateId.toString());

    const response = await apiClient.post<{ success: boolean; data: { analysis_id: number; image_path: string; input_type: string } }>(
      '/analysis/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async analyzeCall(analysisId: number): Promise<AnalyzeResponse> {
    const response = await apiClient.post<AnalyzeResponse>('/analysis/analyze', {
      analysis_id: analysisId,
    });

    return response.data;
  }

  async finalizeAnalysis(data: FinalizeRequest): Promise<FinalizeResponse> {
    const response = await apiClient.post<FinalizeResponse>('/analysis/finalize', data);

    return response.data;
  }

  async getAnalysisHistory(): Promise<any> {
    const response = await apiClient.get('/analysis/history');
    return response.data;
  }
}

export const analysisService = new AnalysisService();
