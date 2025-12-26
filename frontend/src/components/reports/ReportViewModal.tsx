import React, { useState } from 'react';
import { X, Edit2, Save } from 'lucide-react';
import { Report, UpdateReportRequest } from '../../types/report';
import { reportsService } from '../../services/reportsService';
import { useToast } from '../common/CustomToast';

interface ReportViewModalProps {
  report: Report;
  onClose: () => void;
  onUpdate: () => void;
}

export const ReportViewModal: React.FC<ReportViewModalProps> = ({
  report,
  onClose,
  onUpdate,
}) => {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(report.title);
  const [editedFieldValues, setEditedFieldValues] = useState<Record<number, string | number>>(
    report.field_values?.reduce((acc, fv) => {
      acc[fv.field_id] = fv.value;
      return acc;
    }, {} as Record<number, string | number>) || {}
  );
  const [saving, setSaving] = useState(false);

  const handleFieldValueChange = (fieldId: number, value: string | number) => {
    setEditedFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData: UpdateReportRequest = {
        title: editedTitle,
        field_values: Object.entries(editedFieldValues).map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value,
        })),
      };

      await reportsService.updateReport(report.id, updateData);
      toast.success('Report updated successfully');
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Report"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Report ID:</span>
                <span className="ml-2 text-gray-600">{report.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'finalized'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Created By:</span>
                <span className="ml-2 text-gray-600">
                  {typeof report.created_by === 'string'
                    ? report.created_by
                    : report.created_by?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Created At:</span>
                <span className="ml-2 text-gray-600">{formatDate(report.created_at)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Template:</span>
                <span className="ml-2 text-gray-600">{report.template?.name || 'Unknown'}</span>
              </div>
              {report.audio_duration && (
                <div>
                  <span className="font-semibold text-gray-700">Audio Duration:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDuration(report.audio_duration)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Field Values */}
          {report.field_values && report.field_values.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
              <div className="space-y-4">
                {report.field_values.map((fv) => (
                  <div key={fv.field_id} className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {fv.field_label}
                    </label>
                    {isEditing ? (
                      fv.field_type === 'long_text' ? (
                        <textarea
                          value={editedFieldValues[fv.field_id] || ''}
                          onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : fv.field_type === 'number' ? (
                        <input
                          type="number"
                          value={editedFieldValues[fv.field_id] || ''}
                          onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={editedFieldValues[fv.field_id] || ''}
                          onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )
                    ) : (
                      <p className="text-gray-900">{fv.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcription */}
          {report.transcription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Transcription</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {report.transcription}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
