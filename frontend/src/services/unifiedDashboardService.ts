import { apiClient } from './api';

export interface CreateReportFromTextRequest {
  template_id: number;
  text: string;
}

export interface CreateReportFromFileRequest {
  template_id: number;
  input_type: 'voice' | 'image';
  file: File;
}

export interface CreateReportResponse {
  draft_id: number;
  title: string;
  created_at: string;
}

class UnifiedDashboardService {
  /**
   * Create a draft report from text input
   */
  async createReportFromText(data: CreateReportFromTextRequest): Promise<CreateReportResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: CreateReportResponse;
    }>('/reports/create-from-input', data);

    return response.data.data;
  }

  /**
   * Create a draft report from audio file
   */
  async createReportFromAudio(templateId: number, audioFile: File): Promise<CreateReportResponse> {
    const formData = new FormData();
    formData.append('template_id', templateId.toString());
    formData.append('input_type', 'voice');
    formData.append('file', audioFile);

    const response = await apiClient.post<{
      success: boolean;
      data: CreateReportResponse;
    }>('/reports/create-from-input', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Create a draft report from image file
   */
  async createReportFromImage(templateId: number, imageFile: File): Promise<CreateReportResponse> {
    const formData = new FormData();
    formData.append('template_id', templateId.toString());
    formData.append('input_type', 'image');
    formData.append('file', imageFile);

    const response = await apiClient.post<{
      success: boolean;
      data: CreateReportResponse;
    }>('/reports/create-from-input', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Get all draft reports
   */
  async getDrafts(page = 1, limit = 20): Promise<any> {
    const response = await apiClient.get('/reports/drafts', {
      params: { page, limit },
    });

    return response.data.data;
  }
}

export const unifiedDashboardService = new UnifiedDashboardService();
