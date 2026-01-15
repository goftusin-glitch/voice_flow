import React, { useState } from 'react';
import { Sparkles, FileText, Save, CheckCircle2, X } from 'lucide-react';
import { FieldValue } from '../../services/unifiedDashboardService';

interface InlineDraftEditorProps {
  draftId: number;
  title: string;
  summary: string;
  templateName: string;
  fieldValues: FieldValue[];
  onSaveDraft: (draftId: number, fieldValues: FieldValue[], summary: string) => Promise<void>;
  onFinalize: (draftId: number, fieldValues: FieldValue[], summary: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InlineDraftEditor: React.FC<InlineDraftEditorProps> = ({
  draftId,
  title,
  summary: initialSummary,
  templateName,
  fieldValues: initialFieldValues,
  onSaveDraft,
  onFinalize,
  onCancel,
  loading = false,
}) => {
  const [fieldValues, setFieldValues] = useState<FieldValue[]>(initialFieldValues);
  const [summary, setSummary] = useState(initialSummary);
  const [savingDraft, setSavingDraft] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const handleFieldChange = (fieldId: number, value: string | number) => {
    setFieldValues((prev) =>
      prev.map((field) =>
        field.field_id === fieldId ? { ...field, value } : field
      )
    );
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await onSaveDraft(draftId, fieldValues, summary);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await onFinalize(draftId, fieldValues, summary);
    } finally {
      setFinalizing(false);
    }
  };

  const renderField = (field: FieldValue) => {
    const baseInputClass =
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500';

    switch (field.field_type) {
      case 'long_text':
        return (
          <textarea
            value={field.value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={`${baseInputClass} min-h-[100px] resize-y`}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={field.value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseInputClass}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      case 'dropdown':
        return (
          <select
            value={field.value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={`${baseInputClass} appearance-none cursor-pointer`}
          >
            <option value="">Select {field.field_label.toLowerCase()}</option>
            {field.field_options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        const selectedValues = typeof field.value === 'string'
          ? field.value.split(',').filter(Boolean)
          : [];
        return (
          <div className="flex flex-wrap gap-2">
            {field.field_options?.map((option) => (
              <label
                key={option}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                  selectedValues.includes(option)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    handleFieldChange(field.field_id, newValues.join(','));
                  }}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        );

      default: // text
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
            className={baseInputClass}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Extracted Fields</h3>
              <p className="text-sm text-gray-600">{templateName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {fieldValues
            .sort((a, b) => a.display_order - b.display_order)
            .map((field) => (
              <div
                key={field.field_id}
                className={field.field_type === 'long_text' ? 'md:col-span-2' : ''}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
        </div>

        {/* Summary Section */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-green-600" />
            <label className="text-sm font-medium text-green-800">Summary</label>
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[80px] resize-y"
            placeholder="AI-generated summary of the report..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft || finalizing || loading}
            className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleFinalize}
            disabled={savingDraft || finalizing || loading}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {finalizing ? 'Finalizing...' : 'Finalise'}
          </button>
        </div>
      </div>
    </div>
  );
};
