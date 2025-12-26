import os
import uuid
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from mutagen import File as MutagenFile
from pydub import AudioSegment
from flask import current_app


class AudioService:
    ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm', 'mp4', 'mpeg'}

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in AudioService.ALLOWED_EXTENSIONS

    @staticmethod
    def save_audio_file(file: FileStorage, user_id: int) -> tuple:
        """
        Save uploaded audio file and return path and duration

        Returns:
            tuple: (file_path, duration_in_seconds)
        """
        if not file:
            raise ValueError("No file provided")

        if not AudioService.allowed_file(file.filename):
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(AudioService.ALLOWED_EXTENSIONS)}")

        # Create user-specific upload directory
        upload_dir = os.path.join(
            current_app.config['UPLOAD_FOLDER'],
            'audio',
            f'user_{user_id}'
        )
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        file.save(file_path)

        # Get audio duration
        duration = AudioService.get_audio_duration(file_path)

        # Return relative path for database storage
        relative_path = os.path.join('audio', f'user_{user_id}', unique_filename)

        return relative_path, duration

    @staticmethod
    def get_audio_duration(file_path: str) -> int:
        """
        Get audio duration in seconds

        Args:
            file_path: Absolute path to audio file

        Returns:
            int: Duration in seconds
        """
        try:
            # Try with mutagen first (works for most formats)
            audio = MutagenFile(file_path)
            if audio and audio.info:
                return int(audio.info.length)
        except Exception:
            pass

        try:
            # Fallback to pydub
            audio = AudioSegment.from_file(file_path)
            return int(len(audio) / 1000)  # Convert milliseconds to seconds
        except Exception as e:
            print(f"Error getting audio duration: {e}")
            return 0

    @staticmethod
    def get_absolute_path(relative_path: str) -> str:
        """Convert relative path to absolute path"""
        return os.path.join(current_app.config['UPLOAD_FOLDER'], relative_path)

    @staticmethod
    def delete_audio_file(relative_path: str) -> bool:
        """Delete audio file from storage"""
        try:
            absolute_path = AudioService.get_absolute_path(relative_path)
            if os.path.exists(absolute_path):
                os.remove(absolute_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting audio file: {e}")
            return False

    @staticmethod
    def convert_to_mp3(file_path: str) -> str:
        """
        Convert audio file to MP3 format (if not already)

        Args:
            file_path: Absolute path to audio file

        Returns:
            str: Path to MP3 file
        """
        if file_path.endswith('.mp3'):
            return file_path

        try:
            # Load audio file
            audio = AudioSegment.from_file(file_path)

            # Generate MP3 path
            mp3_path = file_path.rsplit('.', 1)[0] + '.mp3'

            # Export as MP3
            audio.export(mp3_path, format='mp3', bitrate='192k')

            # Delete original file
            if os.path.exists(file_path):
                os.remove(file_path)

            return mp3_path
        except Exception as e:
            print(f"Error converting audio to MP3: {e}")
            return file_path

    @staticmethod
    def validate_file_size(file: FileStorage, max_size_mb: int = 500) -> bool:
        """
        Validate file size

        Args:
            file: FileStorage object
            max_size_mb: Maximum size in MB

        Returns:
            bool: True if valid, False otherwise
        """
        # Seek to end to get file size
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)  # Reset to beginning

        max_size_bytes = max_size_mb * 1024 * 1024
        return size <= max_size_bytes
