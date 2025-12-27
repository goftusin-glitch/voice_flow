import { apiClient } from './api';
import {
  Report,
  ReportsListResponse,
  UpdateReportRequest,
  ShareEmailRequest,
  ShareWhatsAppResponse,
  GeneratePDFResponse,
} from '../types/report';

class ReportsService {
  async getReports(
    page = 1,
    limit = 20,
    search?: string,
    status?: 'draft' | 'finalized',
    teamId?: number
  ): Promise<ReportsListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (teamId) params.append('team_id', teamId.toString());

    const response = await apiClient.get<{ success: boolean; data: ReportsListResponse }>(
      `/reports?${params.toString()}`
    );
    return response.data.data;
  }

  async getReportById(reportId: number): Promise<Report> {
    const response = await apiClient.get<{ success: boolean; data: { report: Report } }>(
      `/reports/${reportId}`
    );
    return response.data.data.report;
  }

  async updateReport(reportId: number, data: UpdateReportRequest): Promise<void> {
    await apiClient.put(`/reports/${reportId}`, data);
  }

  async deleteReport(reportId: number): Promise<void> {
    await apiClient.delete(`/reports/${reportId}`);
  }

  async generatePDF(reportId: number): Promise<GeneratePDFResponse> {
    const response = await apiClient.post<{ success: boolean; data: GeneratePDFResponse }>(
      `/reports/${reportId}/generate-pdf`
    );
    return response.data.data;
  }

  async downloadPDF(reportId: number): Promise<void> {
    try {
      const response = await apiClient.get(`/reports/${reportId}/download-pdf`, {
        responseType: 'blob',
      });

      // Check if response is actually a PDF
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('application/pdf')) {
        // If it's JSON, it's likely an error response
        const text = await (response.data as Blob).text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      // Get filename from Content-Disposition header if available
      let filename = `report_${reportId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  async shareViaEmail(reportId: number, data: ShareEmailRequest): Promise<void> {
    await apiClient.post(`/reports/${reportId}/share-email`, data);
  }

  async getWhatsAppShareLink(reportId: number): Promise<ShareWhatsAppResponse> {
    const response = await apiClient.post<{ success: boolean; data: ShareWhatsAppResponse }>(
      `/reports/${reportId}/share-whatsapp`
    );
    return response.data.data;
  }
}

export const reportsService = new ReportsService();
