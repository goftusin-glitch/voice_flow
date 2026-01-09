import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import { FileText, AlertCircle } from 'lucide-react';

interface TextInputProps {
  onTextChange: (text: string) => void;
  value: string;
  disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  onTextChange,
  value,
  disabled = false,
}) => {
  const [charCount, setCharCount] = useState(value.length);
  const minChars = 50;
  const maxChars = 50000;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    onTextChange(newValue);
  };

  const isValid = charCount >= minChars && charCount <= maxChars;
  const getCharCountColor = () => {
    if (charCount < minChars) return 'error';
    if (charCount > maxChars * 0.9) return 'warning';
    return 'success';
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
          <FileText className="w-6 h-6 text-blue-600" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Enter Text for Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Paste or type the text you want to analyze
          </Typography>
        </Box>
      </Box>

      {charCount < minChars && charCount > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'warning.light',
            border: '1px solid',
            borderColor: 'warning.main',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <Typography variant="body2" color="warning.dark">
              Please enter at least {minChars} characters for meaningful analysis
            </Typography>
          </Box>
        </Paper>
      )}

      <TextField
        fullWidth
        multiline
        rows={12}
        value={value}
        onChange={handleChange}
        placeholder={`Enter text to analyze (minimum ${minChars} characters)...\n\nExample:\nCustomer called regarding billing issue with account AB12345. Customer reported unexpected charges on their last statement. After reviewing the account, found duplicate charge of $49.99. Applied credit to account and confirmed resolution. Customer expressed satisfaction with quick resolution.`}
        disabled={disabled}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
          },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${charCount.toLocaleString()} characters`}
            color={getCharCountColor()}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {isValid && (
            <Chip
              label="Valid length"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Max: {maxChars.toLocaleString()} characters
        </Typography>
      </Box>
    </Box>
  );
};
