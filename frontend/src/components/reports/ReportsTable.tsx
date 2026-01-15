import React, { useState, useMemo } from 'react';
import { FileText, Eye, Download, Mail, MessageCircle, Trash2, Clock, User, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { Report, ReportFieldValue } from '../../types/report';

interface ReportsTableProps {
  reports: Report[];
  onView: (reportId: number) => void;
  onDownloadPDF: (reportId: number) => void;
  onDownloadExcel?: (reportId: number) => void;
  onShareEmail: (report: Report) => void;
  onShareWhatsApp: (reportId: number) => void;
  onDelete: (reportId: number) => void;
  onBatchDelete?: (reportIds: number[]) => void;
  loading?: boolean;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reports,
  onView,
  onDownloadPDF,
  onDownloadExcel,
  onShareEmail,
  onShareWhatsApp,
  onDelete,
  onBatchDelete,
  loading = false,
}) => {
  const [selectedReports, setSelectedReports] = useState<number[]>([]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const toggleSelectReport = (reportId: number) => {
    setSelectedReports((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
  };

  // Get unique field labels from all reports to create dynamic columns
  const fieldColumns = useMemo(() => {
    const fieldMap = new Map<string, string>();
    reports.forEach((report) => {
      if (report.field_values) {
        report.field_values.forEach((fv) => {
          if (!fieldMap.has(fv.field_label)) {
            fieldMap.set(fv.field_label, fv.field_label);
          }
        });
      }
    });
    return Array.from(fieldMap.keys()).slice(0, 5); // Limit to 5 columns
  }, [reports]);

  // Helper to get field value for a report
  const getFieldValue = (report: Report, fieldLabel: string): string => {
    if (!report.field_values) return '-';
    const field = report.field_values.find((fv) => fv.field_label === fieldLabel);
    if (!field || field.value === null || field.value === undefined || field.value === '') return '-';
    const value = String(field.value);
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
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

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Create your first report from the dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Batch Operations Bar */}
      {selectedReports.length > 0 && onBatchDelete && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-900">
              {selectedReports.length} {selectedReports.length === 1 ? 'report' : 'reports'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedReports.length} report(s)?`)) {
                  onBatchDelete(selectedReports);
                  setSelectedReports([]);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report Period
              </th>
              {/* Dynamic field columns */}
              {fieldColumns.map((fieldLabel) => (
                <th
                  key={fieldLabel}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {fieldLabel}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr
                key={report.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedReports.includes(report.id) ? 'bg-purple-50' : ''
                }`}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => toggleSelectReport(report.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                {/* Report Period (date) */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {formatDate(report.created_at).split(' ')[0]}
                  </span>
                </td>
                {/* Dynamic field value columns */}
                {fieldColumns.map((fieldLabel) => (
                  <td key={fieldLabel} className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {getFieldValue(report, fieldLabel)}
                    </span>
                  </td>
                ))}
                {/* Summary */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 line-clamp-2">
                    {report.summary
                      ? report.summary.length > 80
                        ? report.summary.substring(0, 80) + '...'
                        : report.summary
                      : '-'}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(report.id)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="View report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(report.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete report"
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
