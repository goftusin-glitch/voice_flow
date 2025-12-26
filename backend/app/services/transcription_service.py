from openai import OpenAI
from flask import current_app
import os


class TranscriptionService:
    @staticmethod
    def transcribe_audio(file_path: str) -> str:
        """
        Transcribe audio file using OpenAI Whisper

        Args:
            file_path: Absolute path to audio file

        Returns:
            str: Transcribed text

        Raises:
            ValueError: If transcription fails
        """
        try:
            # Initialize OpenAI client
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

            # Open audio file
            with open(file_path, 'rb') as audio_file:
                # Call Whisper API
                transcript = client.audio.transcriptions.create(
                    model=current_app.config.get('WHISPER_MODEL', 'whisper-1'),
                    file=audio_file,
                    response_format='text'
                )

            # Return transcribed text
            return transcript

        except Exception as e:
            error_msg = str(e)
            print(f"Transcription error: {error_msg}")

            # Handle specific errors
            if 'api_key' in error_msg.lower():
                raise ValueError("OpenAI API key not configured")
            elif 'file' in error_msg.lower() or 'format' in error_msg.lower():
                raise ValueError("Invalid audio file format")
            elif 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                raise ValueError("OpenAI API quota exceeded or rate limited")
            else:
                raise ValueError(f"Transcription failed: {error_msg}")

    @staticmethod
    def transcribe_audio_with_timestamps(file_path: str) -> dict:
        """
        Transcribe audio with word-level timestamps

        Args:
            file_path: Absolute path to audio file

        Returns:
            dict: Transcription with timestamps

        Raises:
            ValueError: If transcription fails
        """
        try:
            # Initialize OpenAI client
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

            # Open audio file
            with open(file_path, 'rb') as audio_file:
                # Call Whisper API with verbose_json format
                transcript = client.audio.transcriptions.create(
                    model=current_app.config.get('WHISPER_MODEL', 'whisper-1'),
                    file=audio_file,
                    response_format='verbose_json',
                    timestamp_granularities=['word']
                )

            return {
                'text': transcript.text,
                'words': transcript.words if hasattr(transcript, 'words') else [],
                'language': transcript.language if hasattr(transcript, 'language') else None,
                'duration': transcript.duration if hasattr(transcript, 'duration') else None
            }

        except Exception as e:
            error_msg = str(e)
            print(f"Transcription error: {error_msg}")
            raise ValueError(f"Transcription failed: {error_msg}")

    @staticmethod
    def transcribe_audio_chunked(file_path: str, chunk_length_ms: int = 300000) -> str:
        """
        Transcribe long audio files by splitting into chunks

        Args:
            file_path: Absolute path to audio file
            chunk_length_ms: Length of each chunk in milliseconds (default: 5 minutes)

        Returns:
            str: Complete transcribed text

        Raises:
            ValueError: If transcription fails
        """
        try:
            from pydub import AudioSegment

            # Load audio file
            audio = AudioSegment.from_file(file_path)

            # If audio is short enough, transcribe directly
            if len(audio) <= chunk_length_ms:
                return TranscriptionService.transcribe_audio(file_path)

            # Split into chunks
            chunks = []
            for i in range(0, len(audio), chunk_length_ms):
                chunk = audio[i:i + chunk_length_ms]
                chunks.append(chunk)

            # Transcribe each chunk
            transcriptions = []
            temp_dir = os.path.dirname(file_path)

            for i, chunk in enumerate(chunks):
                # Export chunk to temporary file
                chunk_path = os.path.join(temp_dir, f"chunk_{i}.mp3")
                chunk.export(chunk_path, format="mp3")

                # Transcribe chunk
                chunk_transcription = TranscriptionService.transcribe_audio(chunk_path)
                transcriptions.append(chunk_transcription)

                # Delete temporary chunk file
                os.remove(chunk_path)

            # Combine transcriptions
            full_transcription = " ".join(transcriptions)

            return full_transcription

        except Exception as e:
            error_msg = str(e)
            print(f"Chunked transcription error: {error_msg}")
            raise ValueError(f"Transcription failed: {error_msg}")
