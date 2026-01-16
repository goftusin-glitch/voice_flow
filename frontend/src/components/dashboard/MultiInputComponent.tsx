import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Upload, Square, Circle } from 'lucide-react';
import { useToast } from '../common/CustomToast';

interface MultiInputComponentProps {
  onTextInput: (text: string) => void;
  onAudioRecorded: (audioBlob: Blob, audioFile: File) => void;
  onAudioFileSelected: (audioFile: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MultiInputComponent: React.FC<MultiInputComponentProps> = ({
  onTextInput,
  onAudioRecorded,
  onAudioFileSelected,
  disabled = false,
  placeholder = 'Tap mic, camera, or type here...',
}) => {
  const toast = useToast();
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });

        onAudioRecorded(audioBlob, audioFile);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Reset
        setIsRecording(false);
        setRecordingTime(0);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      toast.success('Recording stopped');
    }
  };

  const handleMicClick = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleCameraClick = () => {
    if (disabled) return;
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        onAudioFileSelected(file);
        toast.success('Audio file selected');
      } else {
        toast.error('Please select an audio file');
      }
    }
    // Reset input
    event.target.value = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|webm|aac|wma|opus)$/i)) {
        onAudioFileSelected(file);
        toast.success('Audio file uploaded');
      } else {
        toast.error('Please upload an audio file');
      }
    }
    // Reset input
    event.target.value = '';
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setTextInput(value);
    onTextInput(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm">
      <div className="flex gap-4">
        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-purple-500 hover:bg-purple-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} shadow-lg`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <Square className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={disabled || isRecording}
            className={`w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center transition-all ${
              disabled || isRecording
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-teal-600 hover:scale-110'
            } shadow-lg`}
            title="Capture image"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={disabled || isRecording}
            className={`w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center transition-all ${
              disabled || isRecording
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-orange-600 hover:scale-110'
            } shadow-lg`}
            title="Upload audio file"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.webm,.aac,.wma,.opus,.amr,.3gp"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.webm,.aac,.wma,.opus,.amr,.3gp"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Text Input Area */}
        <div className="flex-1 relative">
          <textarea
            value={textInput}
            onChange={handleTextChange}
            disabled={disabled || isRecording}
            placeholder={isRecording ? `Recording... ${formatTime(recordingTime)}` : placeholder}
            className={`w-full h-full min-h-[168px] p-4 border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isRecording ? 'bg-red-50 text-red-900' : 'bg-gray-50'
            } ${disabled || isRecording ? 'cursor-not-allowed' : ''}`}
          />

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Circle className="w-3 h-3 text-red-500 animate-pulse" fill="currentColor" />
              <span className="text-red-600 font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
