export interface Analysis {
  id: number;
  user_id: number;
  team_id: number;
  template_id: number;
  audio_file_path: string;
  audio_duration: number;
  transcription?: string;
  created_at: string;
}

export interface AnalysisFieldValue {
  field_id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  generated_value: any;
}

export interface AnalysisResult {
  analysis_id: number;
  transcription: string;
  summary: string;
  field_values: AnalysisFieldValue[];
}

export interface UploadAudioResponse {
  success: boolean;
  data: {
    analysis_id: number;
    file_path: string;
    duration: number;
    duration_formatted: string;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  data: AnalysisResult;
}

export interface FinalizeRequest {
  analysis_id: number;
  title: string;
  summary?: string;
  field_values?: Array<{
    field_id: number;
    value: any;
  }>;
  custom_fields?: Array<{
    custom_field_name: string;
    value: string | number;
  }>;
}

export interface FinalizeResponse {
  success: boolean;
  data: {
    report_id: number;
    created_at: string;
  };
}
