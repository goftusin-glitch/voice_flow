import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Upload, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileSelect,
  selectedFile,
  onRemoveFile,
  disabled = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp'],
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon className="w-6 h-6 text-blue-600" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Upload Image for Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload screenshots, documents, forms, or photos
          </Typography>
        </Box>
      </Box>

      {!selectedFile ? (
        <Paper
          {...getRootProps()}
          elevation={0}
          sx={{
            p: 6,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 3,
            bgcolor: isDragActive ? 'primary.50' : 'grey.50',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center',
            '&:hover': {
              borderColor: disabled ? 'grey.300' : 'primary.main',
              bgcolor: disabled ? 'grey.50' : 'primary.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: 2,
            }}
          >
            <Upload className="w-10 h-10 text-blue-600" />
          </Box>

          <Typography variant="h6" gutterBottom fontWeight="600">
            {isDragActive ? 'Drop image here' : 'Drag & drop image here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={disabled}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Browse Files
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Supported formats: JPG, PNG, GIF, WebP, BMP
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Maximum file size: 10MB
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'success.main',
            bgcolor: 'success.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 className="w-7 h-7 text-white" />
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={formatFileSize(selectedFile.size)}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={selectedFile.type || 'Image'}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>

            <IconButton
              onClick={onRemoveFile}
              disabled={disabled}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.dark',
                },
              }}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </Box>

          {/* Image Preview */}
          <Box
            sx={{
              mt: 3,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxHeight: 300,
            }}
          >
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};
