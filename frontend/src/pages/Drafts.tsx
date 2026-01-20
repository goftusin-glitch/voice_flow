import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { reportsService } from '../services/reportsService';
import { Report } from '../types/report';
import { Search, FileText, Filter, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/common/CustomToast';
import { ReportViewModal } from '../components/reports/ReportViewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DraftEditModal } from '../components/drafts/DraftEditModal';
import { useNavigate } from 'react-router-dom';
import { DraftsTable } from '../components/dashboard/DraftsTable';

export const Drafts: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<number | null>(null);
  const [draftToFinalize, setDraftToFinalize] = useState<number | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [page, search]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getDrafts(page, 20);
      setDrafts(response.drafts || response.reports || []);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleView = async (draft: Report) => {
    try {
      const fullReport = await reportsService.getReportById(draft.id);
      setSelectedReport(fullReport);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load draft');
    }
  };

  const handleEdit = async (draft: Report) => {
    try {
      const fullReport = await reportsService.getReportById(draft.id);
      setSelectedReport(fullReport);
      setShowEditModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load draft');
    }
  };

  const handleDeleteClick = (draftId: number) => {
    setDraftToDelete(draftId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!draftToDelete) return;

    try {
      await reportsService.deleteReport(draftToDelete);
      toast.success('Draft deleted successfully');
      setShowDeleteDialog(false);
      setDraftToDelete(null);
      loadDrafts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete draft');
    }
  };

  const handleFinalizeClick = (draftId: number) => {
    setDraftToFinalize(draftId);
    setShowFinalizeDialog(true);
  };

  const handleFinalizeConfirm = async () => {
    if (!draftToFinalize) return;

    try {
      await reportsService.finalizeDraft(draftToFinalize);
      toast.success('Draft finalized successfully! It now appears in My Reports.');
      setShowFinalizeDialog(false);
      setDraftToFinalize(null);
      loadDrafts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize draft');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Convert drafts to format expected by DraftsTable
  const tableDrafts = drafts.map((draft) => ({
    id: draft.id,
    title: draft.title,
    template_name: draft.template_name || draft.template?.name || 'Unknown',
    created_by_name:
      draft.created_by_name ||
      (typeof draft.created_by === 'string'
        ? draft.created_by
        : draft.created_by?.name) ||
      'Unknown',
    created_at: draft.created_at,
    updated_at: draft.updated_at,
    summary: draft.summary,
    field_values: draft.field_values?.map((fv) => ({
      field_id: fv.field_id,
      field_label: fv.field_label,
      field_type: fv.field_type,
      field_name: fv.field_name || '',
      value: fv.value as string | null,
    })),
  }));

  const handleBatchDelete = async (draftIds: number[]) => {
    try {
      await reportsService.batchDeleteReports(draftIds);
      toast.success(`${draftIds.length} draft(s) deleted successfully`);
      loadDrafts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete drafts');
    }
  };

  const handleBatchFinalize = async (draftIds: number[]) => {
    try {
      for (const id of draftIds) {
        await reportsService.finalizeDraft(id);
      }
      toast.success(`${draftIds.length} draft(s) finalized successfully`);
      loadDrafts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize drafts');
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Drafts</h1>
              <p className="text-gray-600 mt-1">Manage your saved draft reports</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ready to Finalize</p>
                <p className="text-2xl font-bold text-green-600">{drafts.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">
                  {page} / {totalPages}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search drafts..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Drafts Table */}
        <DraftsTable
          drafts={tableDrafts}
          onEdit={(draftId) => {
            const draft = drafts.find((d) => d.id === draftId);
            if (draft) handleEdit(draft);
          }}
          onDelete={handleDeleteClick}
          onFinalize={handleFinalizeClick}
          onBatchDelete={handleBatchDelete}
          onBatchFinalize={handleBatchFinalize}
          loading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {drafts.length} of {total} drafts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - page) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (Math.abs(pageNum - page) === 2) {
                    return (
                      <span key={pageNum} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedReport && showViewModal && (
        <ReportViewModal
          report={selectedReport}
          onClose={() => {
            setShowViewModal(false);
            setSelectedReport(null);
          }}
          onUpdate={loadDrafts}
        />
      )}

      {/* Edit Modal */}
      {selectedReport && showEditModal && (
        <DraftEditModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReport(null);
          }}
          draft={selectedReport}
          onUpdate={loadDrafts}
          onFinalize={loadDrafts}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDraftToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Finalize Confirmation Dialog */}
      <ConfirmDialog
        open={showFinalizeDialog}
        onClose={() => {
          setShowFinalizeDialog(false);
          setDraftToFinalize(null);
        }}
        onConfirm={handleFinalizeConfirm}
        title="Finalize Draft"
        message="Are you sure you want to finalize this draft? Once finalized, it will appear in My Reports and can no longer be edited as a draft."
        confirmText="Finalize"
        cancelText="Cancel"
        type="success"
      />
    </Layout>
  );
};
