export type FieldType = 'text' | 'number' | 'long_text' | 'dropdown' | 'multi_select';

export interface TemplateField {
  id?: number;
  template_id?: number;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_options?: string[];
  is_required: boolean;
  display_order: number;
  created_at?: string;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_by_name?: string;
  team_id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  field_count: number;
  fields?: TemplateField[];
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  fields: TemplateField[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  fields?: TemplateField[];
}

export interface TemplatesListResponse {
  success: boolean;
  data: {
    templates: Template[];
  };
}

export interface TemplateResponse {
  success: boolean;
  data: {
    template: Template;
  };
}

export interface CreateTemplateResponse {
  success: boolean;
  data: {
    template_id: number;
    created_at: string;
  };
}
