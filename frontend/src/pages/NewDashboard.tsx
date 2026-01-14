import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { MultiInputComponent } from '../components/dashboard/MultiInputComponent';
import { DraftsTable } from '../components/dashboard/DraftsTable';
import { AlertCircle, Plus, Search, ChevronDown } from 'lucide-react';
import { useToast } from '../components/common/CustomToast';
import { useAuth } from '../context/AuthContext';
import { templatesService } from '../services/templatesService';
import { unifiedDashboardService } from '../services/unifiedDashboardService';
import { reportsService } from '../services/reportsService';
import { dashboardService } from '../services/dashboardService';

interface Template {
  id: number;
  name: string;
  description?: string;
  field_count: number;
}

interface DraftReport {
  id: number;
  title: string;
  template_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  summary?: string;
}

export const NewDashboard: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [drafts, setDrafts] = useState<DraftReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    total: 0,
    drafts: 0,
    finalized: 0,
  });

  useEffect(() => {
    loadTemplates();
    loadDrafts();
    loadMetrics();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesService.getTemplates();
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const loadDrafts = async () => {
    try {
      setDraftsLoading(true);
      const data = await unifiedDashboardService.getDrafts();
      setDrafts(data.reports || []);
    } catch (error: any) {
      console.error('Failed to load drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setDraftsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await dashboardService.getMetrics();
      setMetrics({
        total: (data.drafts_count || 0) + (data.reports_count || 0),
        drafts: data.drafts_count || 0,
        finalized: data.reports_count || 0,
      });
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleCreateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a report template first');
      return;
    }

    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      setLoading(true);
      const result = await unifiedDashboardService.createReportFromText({
        template_id: selectedTemplate,
        text: textInput,
      });

      toast.success('Report created successfully!');
      setTextInput('');

      // Reload drafts and metrics
      await Promise.all([loadDrafts(), loadMetrics()]);

      // Navigate to edit the draft
      navigate(`/drafts?edit=${result.draft_id}`);
    } catch (error: any) {
      console.error('Failed to create report:', error);
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob, audioFile: File) => {
    if (!selectedTemplate) {
      toast.error('Please select a report template first');
      return;
    }

    try {
      setLoading(true);
      toast.info('Processing audio...');

      const result = await unifiedDashboardService.createReportFromAudio(
        selectedTemplate,
        audioFile
      );

      toast.success('Report created from audio!');

      // Reload drafts and metrics
      await Promise.all([loadDrafts(), loadMetrics()]);

      // Navigate to edit the draft
      navigate(`/drafts?edit=${result.draft_id}`);
    } catch (error: any) {
      console.error('Failed to create report from audio:', error);
      toast.error(error.response?.data?.message || 'Failed to process audio');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = async (imageFile: File) => {
    if (!selectedTemplate) {
      toast.error('Please select a report template first');
      return;
    }

    try {
      setLoading(true);
      toast.info('Processing image...');

      const result = await unifiedDashboardService.createReportFromImage(
        selectedTemplate,
        imageFile
      );

      toast.success('Report created from image!');

      // Reload drafts and metrics
      await Promise.all([loadDrafts(), loadMetrics()]);

      // Navigate to edit the draft
      navigate(`/drafts?edit=${result.draft_id}`);
    } catch (error: any) {
      console.error('Failed to create report from image:', error);
      toast.error(error.response?.data?.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (draftId: number) => {
    navigate(`/drafts?edit=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await reportsService.deleteReport(draftId);
      toast.success('Draft deleted successfully');
      await Promise.all([loadDrafts(), loadMetrics()]);
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const handleFinalizeDraft = async (draftId: number) => {
    try {
      await reportsService.finalizeDraft(draftId);
      toast.success('Report finalized successfully!');
      await Promise.all([loadDrafts(), loadMetrics()]);
      navigate('/reports');
    } catch (error: any) {
      console.error('Failed to finalize draft:', error);
      toast.error('Failed to finalize report');
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    const matchesSearch =
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.template_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      draft.template_name.toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Hi, {user?.first_name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Create reports with voice, text, or image</p>
        </div>

        {/* Warning Alert */}
        {!selectedTemplate && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">Please select a report template first</p>
          </div>
        )}

        {/* Template Selector */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 relative">
            <select
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="">
                Select Report Template ({templates.length})
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
        </div>

        {/* Input Component */}
        <div className="mb-6">
          <MultiInputComponent
            onTextInput={setTextInput}
            onAudioRecorded={handleAudioRecorded}
            onImageSelected={handleImageSelected}
            disabled={loading}
          />
        </div>

        {/* Create Report Button */}
        {textInput.trim() && (
          <div className="mb-6">
            <button
              onClick={handleCreateReport}
              disabled={loading || !selectedTemplate}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Creating Report...' : 'Create Report'}
            </button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm font-medium opacity-90 mb-1">Total</div>
            <div className="text-4xl font-bold">{metrics.total}</div>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-1">Drafts</div>
            <div className="text-4xl font-bold text-yellow-600">{metrics.drafts}</div>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-1">Final</div>
            <div className="text-4xl font-bold text-green-600">{metrics.finalized}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drafts..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="relative sm:w-64">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="all">All Report Types</option>
              {templates.map((template) => (
                <option key={template.id} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Drafts Table */}
        <DraftsTable
          drafts={filteredDrafts}
          onEdit={handleEditDraft}
          onDelete={handleDeleteDraft}
          onFinalize={handleFinalizeDraft}
          loading={draftsLoading}
        />
      </div>
    </Layout>
  );
};
