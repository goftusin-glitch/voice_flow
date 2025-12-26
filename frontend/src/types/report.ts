export interface ReportFieldValue {
  field_id: number;
  field_label: string;
  field_type: 'text' | 'number' | 'long_text' | 'dropdown' | 'multi_select';
  value: string | number;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
}

export interface ReportCreator {
  id: number;
  name: string;
  email: string;
}

export interface Report {
  id: number;
  analysis_id: number;
  user_id: number;
  team_id: number;
  template_id: number;
  title: string;
  summary?: string;
  status: 'draft' | 'finalized';
  created_at: string;
  updated_at: string;
  finalized_at?: string;
  template_name?: string;
  created_by?: string | ReportCreator;
  template?: ReportTemplate;
  field_values?: ReportFieldValue[];
  transcription?: string;
  audio_duration?: number;
}

export interface ReportsListResponse {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
}

export interface UpdateReportRequest {
  title?: string;
  field_values?: Array<{
    field_id: number;
    value: string | number;
  }>;
}

export interface ShareEmailRequest {
  recipients: string[];
  message?: string;
}

export interface ShareWhatsAppResponse {
  whatsapp_url: string;
  message: string;
  pdf_filename: string;
}

export interface GeneratePDFResponse {
  pdf_url: string;
  filename: string;
}
