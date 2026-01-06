import React, { useState } from 'react';
import { X, Mail, Plus, Trash2, FileText, FileSpreadsheet, MessageCircle, ArrowLeft } from 'lucide-react';
import { Report } from '../../types/report';
import { reportsService } from '../../services/reportsService';
import { useToast } from '../common/CustomToast';

interface ShareModalProps {
  report: Report;
  onClose: () => void;
}

type ShareStep = 'format' | 'platform' | 'email-details';
type FileFormat = 'pdf' | 'excel';
type SharePlatform = 'email' | 'whatsapp';

export const ShareModal: React.FC<ShareModalProps> = ({ report, onClose }) => {
  const toast = useToast();
  const [step, setStep] = useState<ShareStep>('format');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('pdf');
  const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform>('email');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFormatSelect = (format: FileFormat) => {
    setSelectedFormat(format);
    setStep('platform');
  };

  const handlePlatformSelect = (platform: SharePlatform) => {
    setSelectedPlatform(platform);

    if (platform === 'whatsapp') {
      handleWhatsAppShare();
    } else {
      setStep('email-details');
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      if (selectedFormat === 'pdf') {
        const response = await reportsService.getWhatsAppShareLink(report.id);
        window.open(response.whatsapp_url, '_blank');
        toast.success('WhatsApp share link opened');
      } else {
        // For Excel, download the file first then show instructions
        toast.info('Downloading Excel file for WhatsApp sharing...');
        await reportsService.downloadExcel(report.id);
        toast.success('Excel file downloaded. Please attach it manually to WhatsApp.');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create WhatsApp share link');
    }
  };

  const handleSendEmail = async () => {
    // Validate recipients
    const validRecipients = recipients.filter((email) => email.trim() !== '');

    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    // Validate email formats
    const invalidEmails = validRecipients.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    try {
      setSending(true);

      if (selectedFormat === 'pdf') {
        await reportsService.shareViaEmail(report.id, {
          recipients: validRecipients,
          message: message.trim() || undefined,
        });
        toast.success('Report shared successfully via email as PDF');
      } else {
        // For Excel format, we need to handle differently
        // Since backend might not have Excel email endpoint, download and inform user
        await reportsService.downloadExcel(report.id);
        toast.info('Excel file downloaded. Please attach it manually to your email.');
      }

      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share report');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (step === 'platform') {
      setStep('format');
    } else if (step === 'email-details') {
      setStep('platform');
    }
  };

  const getTitle = () => {
    if (step === 'format') return 'Select Format';
    if (step === 'platform') return 'Select Platform';
    return 'Share Report via Email';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== 'format' && (
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Report Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
            <p className="text-sm text-gray-600">
              Created:{' '}
              {new Date(report.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Step 1: Format Selection */}
          {step === 'format' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Choose the format you want to share the report in:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFormatSelect('pdf')}
                  className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">PDF</h3>
                      <p className="text-xs text-gray-500 mt-1">Portable Document Format</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleFormatSelect('excel')}
                  className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">Excel</h3>
                      <p className="text-xs text-gray-500 mt-1">Microsoft Excel Format</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Platform Selection */}
          {step === 'platform' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Selected format: <span className="font-semibold">{selectedFormat.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Choose how you want to share the report:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePlatformSelect('email')}
                  className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-xs text-gray-500 mt-1">Send via email</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePlatformSelect('whatsapp')}
                  className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <MessageCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                      <p className="text-xs text-gray-500 mt-1">Share via WhatsApp</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Email Details */}
          {step === 'email-details' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Sharing as: <span className="font-semibold">{selectedFormat.toUpperCase()}</span>
              </p>

              {/* Recipients */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) => handleRecipientChange(index, e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {recipients.length > 1 && (
                        <button
                          onClick={() => handleRemoveRecipient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddRecipient}
                  className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add another recipient
                </button>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to include in the email..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The report will be attached as a {selectedFormat.toUpperCase()} along with your message.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'email-details' && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Mail className="w-5 h-5" />
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
