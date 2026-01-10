import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { TemplateSelector } from '../components/analysis/TemplateSelector';
import { AudioUploader } from '../components/analysis/AudioUploader';
import { AudioRecorder } from '../components/analysis/AudioRecorder';
import { TextInput } from '../components/analysis/TextInput';
import { ImageUploader } from '../components/analysis/ImageUploader';
import { AnalysisResults } from '../components/analysis/AnalysisResults';
import { Template } from '../types/template';
import { AnalysisResult } from '../types/analysis';
import { analysisService } from '../services/analysisService';
import { reportsService } from '../services/reportsService';
import { Upload, Mic, Sparkles, Save, FileText, CheckCircle2, ArrowRight, BookmarkPlus, Type, Image as ImageIcon } from 'lucide-react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Container,
  Fade,
  Grow,
  Zoom,
  LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useToast } from '../components/common/CustomToast';

type Step = 'select-template' | 'select-input' | 'analyzing' | 'results';
type InputMethod = 'file' | 'record' | 'text' | 'image';

export const AnalyzeCall: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('select-template');

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Input method selection
  const [inputMethod, setInputMethod] = useState<InputMethod>('file');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);

  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editedFieldValues, setEditedFieldValues] = useState<Record<number, any>>({});
  const [reportTitle, setReportTitle] = useState('');

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleContinueToInput = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }
    setCurrentStep('select-input');
  };

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
  };

  const handleRecordingComplete = (blob: Blob) => {
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setAudioFile(file);
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
  };

  const handleTextChange = (text: string) => {
    setTextInput(text);
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    // Validate input based on method
    if (inputMethod === 'text') {
      if (!textInput.trim() || textInput.length < 50) {
        toast.error('Please enter at least 50 characters of text');
        return;
      }
    } else if (inputMethod === 'image') {
      if (!imageFile) {
        toast.error('Please select an image file');
        return;
      }
    } else {
      // Audio methods
      if (!audioFile) {
        toast.error('Please select or record an audio file');
        return;
      }
    }

    try {
      setUploading(true);
      let uploadedAnalysisId: number;

      if (inputMethod === 'text') {
        // Text input: Create text analysis directly
        const textResponse = await analysisService.createTextAnalysis(textInput, selectedTemplate.id);
        uploadedAnalysisId = textResponse.data.analysis_id;
        toast.success('Text submitted successfully!');
      } else if (inputMethod === 'image') {
        // Image input: Upload image file
        const imageResponse = await analysisService.uploadImage(imageFile!, selectedTemplate.id);
        uploadedAnalysisId = imageResponse.data.analysis_id;
        toast.success('Image uploaded successfully!');
      } else {
        // Audio input: Upload audio file
        const uploadResponse = await analysisService.uploadAudio(audioFile!, selectedTemplate.id);
        uploadedAnalysisId = uploadResponse.data.analysis_id;
        toast.success('Audio uploaded successfully!');
      }

      setAnalysisId(uploadedAnalysisId);
      setUploading(false);

      // Step 2: Analyze
      setCurrentStep('analyzing');
      setAnalyzing(true);

      const analyzeResponse = await analysisService.analyzeCall(uploadedAnalysisId);
      setAnalysisResult(analyzeResponse.data);

      // Initialize edited values
      const initialValues: Record<number, any> = {};
      analyzeResponse.data.field_values.forEach((field) => {
        initialValues[field.field_id] = field.generated_value;
      });
      setEditedFieldValues(initialValues);

      // Set default report title
      setReportTitle(`Analysis - ${new Date().toLocaleDateString()}`);

      setAnalyzing(false);
      setCurrentStep('results');

      toast.success('Analysis complete!');
    } catch (error: any) {
      setUploading(false);
      setAnalyzing(false);
      toast.error(error.response?.data?.message || 'Analysis failed');
    }
  };

  const handleFieldValueChange = (fieldId: number, value: any) => {
    setEditedFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFinalizeReport = async () => {
    if (!analysisId || !reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    try {
      setFinalizing(true);

      // Prepare field values
      const fieldValues = Object.entries(editedFieldValues).map(([fieldId, value]) => ({
        field_id: parseInt(fieldId),
        value: value,
      }));

      // Finalize report
      const response = await analysisService.finalizeAnalysis({
        analysis_id: analysisId,
        title: reportTitle,
        field_values: fieldValues,
      });

      toast.success('Report created successfully!');
      navigate('/reports');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setFinalizing(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!analysisId || !reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    try {
      setSavingDraft(true);

      // Prepare field values
      const fieldValues = Object.entries(editedFieldValues).map(([fieldId, value]) => ({
        field_id: parseInt(fieldId),
        value: value,
      }));

      // Save as draft
      await reportsService.saveDraft({
        analysis_id: analysisId,
        title: reportTitle,
        summary: analysisResult?.summary,
        field_values: fieldValues,
      });

      toast.success('Draft saved successfully!');
      navigate('/drafts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentStep('select-template');
    setAudioFile(null);
    setTextInput('');
    setImageFile(null);
    setAnalysisId(null);
    setAnalysisResult(null);
    setEditedFieldValues({});
    setReportTitle('');
  };

  const getActiveStep = () => {
    switch (currentStep) {
      case 'select-template': return 0;
      case 'select-input': return 1;
      case 'analyzing': return 2;
      case 'results': return 3;
      default: return 0;
    }
  };

  const steps = ['Select Template', 'Select Input', 'AI Analysis', 'Review & Save'];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles className="w-7 h-7 text-white" />
              </Box>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                Analyze Call
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Upload or record a call to analyze with AI-powered insights
            </Typography>
          </Box>
        </Fade>

        {/* Progress Stepper */}
        <Fade in={true} timeout={800}>
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stepper activeStep={getActiveStep()} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontWeight: index === getActiveStep() ? 600 : 400,
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Fade>

        {/* Step 1: Select Template */}
        {currentStep === 'select-template' && (
          <Grow in={true} timeout={500}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <FileText className="w-6 h-6 text-blue-600" />
                    <Typography variant="h5" fontWeight="bold">
                      Choose a Template
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select a report template that matches your analysis needs
                  </Typography>

                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                  />
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleContinueToInput}
                    disabled={!selectedTemplate}
                    endIcon={<ArrowRight className="w-5 h-5" />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    Continue
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </Grow>
        )}

        {/* Step 2: Select Input */}
        {currentStep === 'select-input' && (
          <Grow in={true} timeout={500}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
              {/* Input Method Toggle */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 3, mb: 4 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    elevation={inputMethod === 'file' ? 6 : 2}
                    onClick={() => setInputMethod('file')}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: inputMethod === 'file' ? '2px solid' : '2px solid transparent',
                      borderColor: inputMethod === 'file' ? 'primary.main' : 'transparent',
                      bgcolor: inputMethod === 'file' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: inputMethod === 'file' ? 'primary.main' : 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Upload className={`w-7 h-7 ${inputMethod === 'file' ? 'text-white' : 'text-gray-600'}`} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Upload Audio
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload an audio file from your device
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    elevation={inputMethod === 'record' ? 6 : 2}
                    onClick={() => setInputMethod('record')}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: inputMethod === 'record' ? '2px solid' : '2px solid transparent',
                      borderColor: inputMethod === 'record' ? 'primary.main' : 'transparent',
                      bgcolor: inputMethod === 'record' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: inputMethod === 'record' ? 'primary.main' : 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Mic className={`w-7 h-7 ${inputMethod === 'record' ? 'text-white' : 'text-gray-600'}`} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Record Audio
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Record directly from your microphone
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    elevation={inputMethod === 'text' ? 6 : 2}
                    onClick={() => setInputMethod('text')}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: inputMethod === 'text' ? '2px solid' : '2px solid transparent',
                      borderColor: inputMethod === 'text' ? 'primary.main' : 'transparent',
                      bgcolor: inputMethod === 'text' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: inputMethod === 'text' ? 'primary.main' : 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Type className={`w-7 h-7 ${inputMethod === 'text' ? 'text-white' : 'text-gray-600'}`} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Enter Text
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type or paste text directly
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    elevation={inputMethod === 'image' ? 6 : 2}
                    onClick={() => setInputMethod('image')}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: inputMethod === 'image' ? '2px solid' : '2px solid transparent',
                      borderColor: inputMethod === 'image' ? 'primary.main' : 'transparent',
                      bgcolor: inputMethod === 'image' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: inputMethod === 'image' ? 'primary.main' : 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <ImageIcon className={`w-7 h-7 ${inputMethod === 'image' ? 'text-white' : 'text-gray-600'}`} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Upload Image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload screenshots or documents
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Input Interface */}
              <Fade in={true} timeout={600}>
                <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    {inputMethod === 'file' ? (
                      <AudioUploader
                        onFileSelect={handleFileSelect}
                        selectedFile={audioFile}
                        onRemoveFile={handleRemoveFile}
                        disabled={uploading || analyzing}
                      />
                    ) : inputMethod === 'record' ? (
                      <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        disabled={uploading || analyzing}
                      />
                    ) : inputMethod === 'text' ? (
                      <TextInput
                        value={textInput}
                        onTextChange={handleTextChange}
                        disabled={uploading || analyzing}
                      />
                    ) : (
                      <ImageUploader
                        onFileSelect={handleImageSelect}
                        selectedFile={imageFile}
                        onRemoveFile={handleRemoveImage}
                        disabled={uploading || analyzing}
                      />
                    )}
                  </CardContent>
                </Card>
              </Fade>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setCurrentStep('select-template')}
                    disabled={uploading || analyzing}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleUploadAndAnalyze}
                    disabled={
                      uploading ||
                      analyzing ||
                      (inputMethod === 'text'
                        ? textInput.length < 50
                        : inputMethod === 'image'
                        ? !imageFile
                        : !audioFile)
                    }
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Sparkles className="w-5 h-5" />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
                      },
                    }}
                  >
                    {uploading
                      ? inputMethod === 'text'
                        ? 'Processing...'
                        : inputMethod === 'image'
                        ? 'Uploading...'
                        : 'Uploading...'
                      : 'Analyze'}
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </Grow>
        )}

        {/* Step 3: Analyzing */}
        {currentStep === 'analyzing' && (
          <Zoom in={true} timeout={500}>
            <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', py: 8 }}>
              <Card elevation={4} sx={{ borderRadius: 4, p: 6 }}>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 4,
                      boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    <Sparkles className="w-16 h-16 text-white" />
                  </Box>
                </motion.div>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Analyzing Your {inputMethod === 'text' ? 'Text' : inputMethod === 'image' ? 'Image' : 'Call'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {inputMethod === 'text'
                    ? 'AI is analyzing your text. This may take a few moments...'
                    : inputMethod === 'image'
                    ? 'AI is extracting data from your image and analyzing it. This may take a few moments...'
                    : 'AI is transcribing and analyzing the audio. This may take a few moments...'}
                </Typography>

                <LinearProgress
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={24} thickness={5} />
                  <Typography variant="body2" color="text.secondary">
                    Processing...
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Zoom>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && analysisResult && (
          <Grow in={true} timeout={500}>
            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
              {/* Report Title Input */}
              <Fade in={true} timeout={600}>
                <Card elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <Typography variant="h5" fontWeight="bold">
                        Analysis Complete!
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      label="Report Title"
                      variant="outlined"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="Enter a title for this report"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Fade>

              {/* Analysis Results */}
              <Fade in={true} timeout={800}>
                <Box>
                  <AnalysisResults
                    result={analysisResult}
                    onFieldValueChange={handleFieldValueChange}
                    editable={true}
                  />
                </Box>
              </Fade>

              {/* Action Buttons */}
              <Fade in={true} timeout={1000}>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={resetAnalysis}
                      disabled={finalizing}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      Start New Analysis
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleSaveAsDraft}
                      disabled={!reportTitle.trim() || savingDraft || finalizing}
                      startIcon={savingDraft ? <CircularProgress size={20} color="inherit" /> : <BookmarkPlus className="w-5 h-5" />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'primary.light',
                        },
                      }}
                    >
                      {savingDraft ? 'Saving...' : 'Save as Draft'}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleFinalizeReport}
                      disabled={!reportTitle.trim() || finalizing || savingDraft}
                      startIcon={finalizing ? <CircularProgress size={20} color="inherit" /> : <Save className="w-5 h-5" />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        bgcolor: 'success.main',
                        '&:hover': {
                          bgcolor: 'success.dark',
                        },
                      }}
                    >
                      {finalizing ? 'Saving...' : 'Save Report'}
                    </Button>
                  </motion.div>
                </Box>
              </Fade>
            </Box>
          </Grow>
        )}
      </Container>
    </Layout>
  );
};
