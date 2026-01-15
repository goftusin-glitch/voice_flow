import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelect,
  selectedFile,
  onRemoveFile,
  disabled = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': [], // Accept all audio formats
    },
    multiple: false,
    disabled,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <File className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={onRemoveFile}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Upload className="w-8 h-8 text-gray-600" />
        </div>
        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-blue-600">Drop the audio file here</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              Drag and drop your audio file here
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <p className="text-xs text-gray-400">
              Supported formats: All audio formats (MP3, WAV, OGG, M4A, FLAC, AAC, WMA, etc.)
            </p>
            <p className="text-xs text-gray-400">Maximum file size: 500MB</p>
          </div>
        )}
      </div>
    </div>
  );
};
