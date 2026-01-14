import { apiClient } from './api';
import {
  Report,
  ReportsListResponse,
  UpdateReportRequest,
  ShareEmailRequest,
  ShareWhatsAppResponse,
  GeneratePDFResponse,
} from '../types/report';
import * as XLSX from 'xlsx';

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

  async getDrafts(page = 1, limit = 20): Promise<ReportsListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get<{ success: boolean; data: ReportsListResponse }>(
      `/reports/drafts?${params.toString()}`
    );
    return response.data.data;
  }

  async saveDraft(data: {
    analysis_id: number;
    title: string;
    summary?: string;
    field_values?: Array<{ field_id: number; value: any }>;
    custom_fields?: Array<{ custom_field_name: string; value: string | number }>;
  }): Promise<{ draft_id: number; created_at: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { draft_id: number; created_at: string };
    }>('/reports/draft', data);
    return response.data.data;
  }

  async finalizeDraft(reportId: number): Promise<{ report_id: number; status: string; finalized_at: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { report_id: number; status: string; finalized_at: string };
    }>(`/reports/${reportId}/finalize`);
    return response.data.data;
  }

  async downloadExcel(reportId: number): Promise<void> {
    try {
      // Fetch the full report data
      const report = await this.getReportById(reportId);

      // Create worksheet data
      const worksheetData: any[][] = [];

      // Add report header information
      worksheetData.push(['Report Title', report.title]);
      worksheetData.push(['Template', report.template?.name || 'N/A']);
      worksheetData.push(['Created By', typeof report.created_by === 'string' ? report.created_by : report.created_by?.name || 'N/A']);
      worksheetData.push(['Created At', new Date(report.created_at).toLocaleString()]);
      worksheetData.push(['Status', report.status.charAt(0).toUpperCase() + report.status.slice(1)]);
      worksheetData.push([]); // Empty row

      // Add summary if available
      if (report.summary) {
        worksheetData.push(['Summary']);
        worksheetData.push([report.summary]);
        worksheetData.push([]); // Empty row
      }

      // Add field values section
      worksheetData.push(['Field', 'Value']);
      if (report.field_values && report.field_values.length > 0) {
        report.field_values.forEach((field) => {
          worksheetData.push([
            field.field_label || 'N/A',
            field.value || 'N/A'
          ]);
        });
      }

      worksheetData.push([]); // Empty row

      // Add transcription if available
      if (report.transcription) {
        worksheetData.push(['Transcription']);
        worksheetData.push([report.transcription]);
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Field column
        { wch: 80 }  // Value column
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Generate filename
      const sanitizedTitle = report.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `${sanitizedTitle}_${reportId}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
    } catch (error: any) {
      console.error('Excel download error:', error);
      throw error;
    }
  }

  async batchDeleteReports(reportIds: number[]): Promise<void> {
    try {
      await apiClient.post('/reports/batch-delete', {
        report_ids: reportIds,
      });
    } catch (error: any) {
      console.error('Batch delete error:', error);
      throw error;
    }
  }

  async batchFinalizeReports(reportIds: number[]): Promise<void> {
    try {
      await apiClient.post('/reports/batch-finalize', {
        report_ids: reportIds,
      });
    } catch (error: any) {
      console.error('Batch finalize error:', error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
