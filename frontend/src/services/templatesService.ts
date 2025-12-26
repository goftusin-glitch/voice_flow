import { apiClient } from './api';
import {
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplatesListResponse,
  TemplateResponse,
  CreateTemplateResponse,
} from '../types/template';

class TemplatesService {
  async getAllTemplates(): Promise<Template[]> {
    const response = await apiClient.get<TemplatesListResponse>('/templates');
    return response.data.data.templates;
  }

  async getTemplateById(templateId: number): Promise<Template> {
    const response = await apiClient.get<TemplateResponse>(`/templates/${templateId}`);
    return response.data.data.template;
  }

  async createTemplate(data: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    const response = await apiClient.post<CreateTemplateResponse>('/templates', data);
    return response.data;
  }

  async updateTemplate(
    templateId: number,
    data: UpdateTemplateRequest
  ): Promise<{ success: boolean; data: { template_id: number; updated_at: string } }> {
    const response = await apiClient.put<{
      success: boolean;
      data: { template_id: number; updated_at: string };
    }>(`/templates/${templateId}`, data);
    return response.data;
  }

  async deleteTemplate(templateId: number): Promise<void> {
    await apiClient.delete(`/templates/${templateId}`);
  }
}

export const templatesService = new TemplatesService();
