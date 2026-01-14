import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { reportsService } from '../services/reportsService';
import { teamsService, UserTeam } from '../services/teamsService';
import { Report } from '../types/report';
import { ReportsTable } from '../components/reports/ReportsTable';
import { Search, ChevronDown, Users, FileText, CheckCircle2, Filter } from 'lucide-react';
import { useToast } from '../components/common/CustomToast';
import { ReportViewModal } from '../components/reports/ReportViewModal';
import { ShareModal } from '../components/reports/ShareModal';

export const MyReports: React.FC = () => {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('finalized');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<UserTeam | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadReports();
    }
  }, [page, search, statusFilter, selectedTeam]);

  const loadTeams = async () => {
    try {
      const userTeams = await teamsService.getAllMyTeams();
      setTeams(userTeams);

      // Set the first team (user's own team) as default
      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load teams');
    }
  };

  const loadReports = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      const response = await reportsService.getReports(
        page,
        20,
        search || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        selectedTeam.team_id
      );
      setReports(response.reports);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (team: UserTeam) => {
    setSelectedTeam(team);
    setPage(1);
    setShowTeamDropdown(false);
    toast.success(`Switched to ${team.team_name}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: 'all' | 'draft' | 'finalized') => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleViewReport = async (reportId: number) => {
    try {
      const fullReport = await reportsService.getReportById(reportId);
      setSelectedReport(fullReport);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load report');
    }
  };

  const handleDownloadPDF = async (reportId: number) => {
    try {
      toast.info('Generating PDF...');
      await reportsService.downloadPDF(reportId);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleDownloadExcel = async (reportId: number) => {
    try {
      toast.info('Generating Excel file...');
      await reportsService.downloadExcel(reportId);
      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download Excel file');
    }
  };

  const handleShareEmail = (report: Report) => {
    setSelectedReport(report);
    setShowShareModal(true);
  };

  const handleShareWhatsApp = async (reportId: number) => {
    try {
      const response = await reportsService.getWhatsAppShareLink(reportId);
      window.open(response.whatsapp_url, '_blank');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create WhatsApp link');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportsService.deleteReport(reportId);
      toast.success('Report deleted successfully');
      await loadReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
              <p className="text-gray-600 mt-1">View and manage your finalized reports</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Finalized</p>
                <p className="text-2xl font-bold text-green-600">
                  {reports.filter((r) => r.status === 'finalized').length}
                </p>
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

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Team Selector */}
            {teams.length > 1 && (
              <div className="relative lg:w-64">
                <button
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedTeam?.team_name || 'Select Team'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showTeamDropdown && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    {teams.map((team) => (
                      <button
                        key={team.team_id}
                        onClick={() => handleTeamSelect(team)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          selectedTeam?.team_id === team.team_id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900">{team.team_name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({team.role === 'owner' ? 'Owner' : 'Member'})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search reports..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusFilterChange('finalized')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'finalized'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Finalized
              </button>
              <button
                onClick={() => handleStatusFilterChange('draft')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Drafts
              </button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <ReportsTable
          reports={reports}
          onView={handleViewReport}
          onDownloadPDF={handleDownloadPDF}
          onDownloadExcel={handleDownloadExcel}
          onShareEmail={handleShareEmail}
          onShareWhatsApp={handleShareWhatsApp}
          onDelete={handleDeleteReport}
          loading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {reports.length} of {total} reports
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Show first, last, current, and adjacent pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - page) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showViewModal && selectedReport && (
          <ReportViewModal
            report={selectedReport}
            onClose={() => {
              setShowViewModal(false);
              setSelectedReport(null);
            }}
            onDownloadPDF={() => handleDownloadPDF(selectedReport.id)}
            onShare={() => {
              setShowViewModal(false);
              setShowShareModal(true);
            }}
          />
        )}

        {showShareModal && selectedReport && (
          <ShareModal
            report={selectedReport}
            onClose={() => {
              setShowShareModal(false);
              setSelectedReport(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};
