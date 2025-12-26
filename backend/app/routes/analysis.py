from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import token_required
from app.services.audio_service import AudioService
from app.services.transcription_service import TranscriptionService
from app.services.analysis_service import AnalysisService
from app.services.template_service import TemplateService
from app.models.analysis import CallAnalysis
from app.models.template import ReportTemplate
from app import db

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/upload-audio', methods=['POST'])
@token_required
def upload_audio(current_user):
    """Upload audio file for analysis"""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No audio file provided'
            }), 400

        file = request.files['audio_file']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Get template_id from form data
        template_id = request.form.get('template_id')
        if not template_id:
            return jsonify({
                'success': False,
                'message': 'Template ID is required'
            }), 400

        # Validate template exists
        template = ReportTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Validate file size
        if not AudioService.validate_file_size(file, max_size_mb=500):
            return jsonify({
                'success': False,
                'message': 'File size exceeds 500MB limit'
            }), 400

        # Save audio file
        file_path, duration = AudioService.save_audio_file(file, current_user.id)

        # Get user's team
        team = TemplateService.get_or_create_team(current_user.id)

        # Create analysis record
        analysis = CallAnalysis(
            user_id=current_user.id,
            team_id=team.id,
            template_id=template_id,
            audio_file_path=file_path,
            audio_duration=duration
        )
        db.session.add(analysis)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'file_path': file_path,
                'duration': duration,
                'duration_formatted': analysis.get_audio_duration_formatted()
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to upload audio file: {str(e)}'
        }), 500


@analysis_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_call(current_user):
    """Transcribe and analyze uploaded audio"""
    try:
        data = request.get_json()

        # Get analysis_id
        analysis_id = data.get('analysis_id')
        if not analysis_id:
            return jsonify({
                'success': False,
                'message': 'Analysis ID is required'
            }), 400

        # Get analysis record
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({
                'success': False,
                'message': 'Analysis not found'
            }), 404

        # Verify ownership
        if analysis.user_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403

        # Get template
        template = ReportTemplate.query.get(analysis.template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Get absolute file path
        absolute_path = AudioService.get_absolute_path(analysis.audio_file_path)

        # Transcribe audio
        transcription = TranscriptionService.transcribe_audio(absolute_path)

        # Save transcription
        analysis.transcription = transcription
        db.session.commit()

        # Analyze transcription with GPT-4
        analysis_result = AnalysisService.analyze_transcription(transcription, template)

        # Build field values response
        field_values = []
        for field in template.fields:
            # Find matching field in analysis result
            field_result = next(
                (f for f in analysis_result.get('fields', []) if f['field_name'] == field.field_name),
                None
            )

            field_values.append({
                'field_id': field.id,
                'field_name': field.field_name,
                'field_label': field.field_label,
                'field_type': field.field_type,
                'generated_value': field_result['value'] if field_result else None
            })

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'transcription': transcription,
                'summary': analysis_result.get('summary', ''),
                'field_values': field_values
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to analyze call'
        }), 500


@analysis_bp.route('/finalize', methods=['POST'])
@token_required
def finalize_analysis(current_user):
    """Finalize analysis and create report"""
    try:
        data = request.get_json()

        # Get required fields
        analysis_id = data.get('analysis_id')
        title = data.get('title')
        field_values = data.get('field_values', [])

        if not analysis_id or not title:
            return jsonify({
                'success': False,
                'message': 'Analysis ID and title are required'
            }), 400

        # Get analysis
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({
                'success': False,
                'message': 'Analysis not found'
            }), 404

        # Verify ownership
        if analysis.user_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403

        # Create report
        report = AnalysisService.create_report_from_analysis(
            analysis_id=analysis_id,
            user_id=current_user.id,
            title=title,
            field_values=field_values
        )

        return jsonify({
            'success': True,
            'data': {
                'report_id': report.id,
                'created_at': report.created_at.isoformat() if report.created_at else None
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Finalize error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to finalize analysis'
        }), 500


@analysis_bp.route('/history', methods=['GET'])
@token_required
def get_analysis_history(current_user):
    """Get user's analysis history"""
    try:
        # Get user's analyses
        analyses = CallAnalysis.query.filter_by(
            user_id=current_user.id
        ).order_by(CallAnalysis.created_at.desc()).limit(50).all()

        analyses_data = []
        for analysis in analyses:
            template = ReportTemplate.query.get(analysis.template_id)

            analyses_data.append({
                'id': analysis.id,
                'template_name': template.name if template else 'Unknown',
                'audio_duration': analysis.audio_duration,
                'audio_duration_formatted': analysis.get_audio_duration_formatted(),
                'has_transcription': bool(analysis.transcription),
                'created_at': analysis.created_at.isoformat() if analysis.created_at else None
            })

        return jsonify({
            'success': True,
            'data': {
                'analyses': analyses_data
            }
        }), 200

    except Exception as e:
        print(f"History error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get analysis history'
        }), 500
