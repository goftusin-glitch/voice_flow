import React, { useState } from 'react';
import { FileText, Edit3, Trash2, CheckCircle2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DraftReport {
  id: number;
  title: string;
  template_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  summary?: string;
}

interface DraftsTableProps {
  drafts: DraftReport[];
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
  onFinalize: (draftId: number) => void;
  onBatchDelete?: (draftIds: number[]) => void;
  onBatchFinalize?: (draftIds: number[]) => void;
  loading?: boolean;
}

export const DraftsTable: React.FC<DraftsTableProps> = ({
  drafts,
  onEdit,
  onDelete,
  onFinalize,
  onBatchDelete,
  onBatchFinalize,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [selectedDrafts, setSelectedDrafts] = useState<number[]>([]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const toggleSelectDraft = (draftId: number) => {
    setSelectedDrafts((prev) =>
      prev.includes(draftId) ? prev.filter((id) => id !== draftId) : [...prev, draftId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map((d) => d.id));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No draft reports</h3>
            <p className="text-gray-600">
              Create a report template first, then start recording
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Batch Operations Bar */}
      {selectedDrafts.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-900">
              {selectedDrafts.length} {selectedDrafts.length === 1 ? 'draft' : 'drafts'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onBatchFinalize && (
              <button
                onClick={() => {
                  onBatchFinalize(selectedDrafts);
                  setSelectedDrafts([]);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize Selected
              </button>
            )}
            {onBatchDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedDrafts.length} draft(s)?`)) {
                    onBatchDelete(selectedDrafts);
                    setSelectedDrafts([]);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedDrafts.length === drafts.length && drafts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drafts.map((draft) => (
              <tr
                key={draft.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedDrafts.includes(draft.id) ? 'bg-purple-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.includes(draft.id)}
                    onChange={() => toggleSelectDraft(draft.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {draft.title}
                      </div>
                      {draft.summary && (
                        <div className="text-xs text-gray-500 truncate mt-1 max-w-md">
                          {draft.summary}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {draft.template_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{draft.created_by_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(draft.created_at)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{formatDate(draft.updated_at)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(draft.id)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="Edit draft"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onFinalize(draft.id)}
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                      title="Finalize report"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(draft.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
