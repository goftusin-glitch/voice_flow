import React, { useState, useEffect } from 'react';
import { AnalysisResult, AnalysisFieldValue } from '../../types/analysis';
import { FileText, Edit2, Check } from 'lucide-react';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onFieldValueChange: (fieldId: number, value: any) => void;
  editable?: boolean;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onFieldValueChange,
  editable = true,
}) => {
  const [editedValues, setEditedValues] = useState<Record<number, any>>({});

  useEffect(() => {
    // Initialize edited values with generated values
    const initialValues: Record<number, any> = {};
    result.field_values.forEach((field) => {
      initialValues[field.field_id] = field.generated_value;
    });
    setEditedValues(initialValues);
  }, [result]);

  const handleValueChange = (fieldId: number, value: any) => {
    setEditedValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    onFieldValueChange(fieldId, value);
  };

  const renderField = (field: AnalysisFieldValue) => {
    const value = editedValues[field.field_id] ?? field.generated_value;

    switch (field.field_type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.field_type === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleValueChange(field.field_id, e.target.value)}
            disabled={!editable}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );

      case 'long_text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleValueChange(field.field_id, e.target.value)}
            disabled={!editable}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );

      case 'dropdown':
      case 'multi_select':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(field.field_id, e.target.value)}
            disabled={!editable}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter value"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(field.field_id, e.target.value)}
            disabled={!editable}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {result.summary && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Summary</h3>
              <p className="text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transcription Section */}
      {result.transcription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Transcription</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.transcription}
            </p>
          </div>
        </div>
      )}

      {/* Field Values Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Extracted Information</h3>
          {editable && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Edit2 className="w-4 h-4" />
              <span>Editable</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result.field_values.map((field) => (
            <div key={field.field_id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.field_label}
                <span className="text-gray-400 text-xs ml-2">({field.field_type})</span>
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {result.field_values.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No fields to display</p>
          </div>
        )}
      </div>

      {/* Edit Notice */}
      {editable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Review and Edit:</strong> The AI has extracted information from the call.
                Please review and edit the values above before finalizing the report.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
