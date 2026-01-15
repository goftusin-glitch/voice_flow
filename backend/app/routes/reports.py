from flask import Blueprint, request, jsonify, send_file
from app.middleware.auth_middleware import token_required
from app.services.report_service import ReportService
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService
from app.models.team import TeamMember
from app.models.report import Report
from app import db
from datetime import datetime
import os

reports_bp = Blueprint('reports', __name__)


def get_user_team_id(user_id):
    """Get the team ID for a user"""
    team_member = TeamMember.query.filter_by(user_id=user_id).first()
    if not team_member:
        raise ValueError("User is not part of any team")
    return team_member.team_id


@reports_bp.route('', methods=['GET'])
@token_required
def get_reports(current_user):
    """Get all reports with pagination and filters"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', None)
        status = request.args.get('status', None)
        requested_team_id = request.args.get('team_id', None, type=int)

        # If team_id is provided, verify user is member of that team
        if requested_team_id:
            member = TeamMember.query.filter_by(
                user_id=current_user.id,
                team_id=requested_team_id
            ).first()

            if not member:
                return jsonify({
                    'success': False,
                    'message': 'You are not a member of this team'
                }), 403

            team_id = requested_team_id
        else:
            # Use user's default team
            team_id = get_user_team_id(current_user.id)

        print(f"User {current_user.id} ({current_user.email}) fetching reports for team {team_id}")

        # Get reports
        result = ReportService.get_reports(
            user_id=current_user.id,
            team_id=team_id,
            page=page,
            limit=limit,
            search=search,
            status=status
        )

        print(f"Found {result['total']} reports for team {team_id}")

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        print(f"ValueError getting reports for user {current_user.id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error getting reports for user {current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to get reports'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['GET'])
@token_required
def get_report(current_user, report_id):
    """Get a single report with full details"""
    try:
        team_id = get_user_team_id(current_user.id)

        report = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'data': {'report': report}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get report'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['PUT'])
@token_required
def update_report(current_user, report_id):
    """Update a report"""
    try:
        team_id = get_user_team_id(current_user.id)
        data = request.get_json()

        report = ReportService.update_report(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id,
            title=data.get('title'),
            summary=data.get('summary'),
            field_values=data.get('field_values'),
            custom_fields=data.get('custom_fields')
        )

        return jsonify({
            'success': True,
            'data': {
                'report_id': report_id,
                'updated_at': report.get('updated_at')
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error updating report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update report'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['DELETE'])
@token_required
def delete_report(current_user, report_id):
    """Delete a report"""
    try:
        team_id = get_user_team_id(current_user.id)

        ReportService.delete_report(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error deleting report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete report'
        }), 500


@reports_bp.route('/<int:report_id>/generate-pdf', methods=['POST'])
@token_required
def generate_pdf(current_user, report_id):
    """Generate PDF for a report"""
    try:
        # Get the report first to check its team
        from app.models.report import Report
        report = Report.query.get(report_id)

        if not report:
            raise ValueError("Report not found")

        # Check if user is a member of the report's team
        member = TeamMember.query.filter_by(
            user_id=current_user.id,
            team_id=report.team_id
        ).first()

        if not member:
            raise ValueError("You don't have access to this report")

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=report.team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Get relative path for URL
        pdf_filename = os.path.basename(pdf_path)
        pdf_url = f"/generated/pdfs/{pdf_filename}"

        return jsonify({
            'success': True,
            'data': {
                'pdf_url': pdf_url,
                'filename': pdf_filename
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate PDF'
        }), 500


@reports_bp.route('/<int:report_id>/download-pdf', methods=['GET'])
@token_required
def download_pdf(current_user, report_id):
    """Download PDF for a report"""
    try:
        # Get the report first to check its team
        from app.models.report import Report
        report = Report.query.get(report_id)

        if not report:
            raise ValueError("Report not found")

        # Check if user is a member of the report's team
        member = TeamMember.query.filter_by(
            user_id=current_user.id,
            team_id=report.team_id
        ).first()

        if not member:
            raise ValueError("You don't have access to this report")

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=report.team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Verify file exists
        if not os.path.exists(pdf_path):
            raise ValueError(f"Generated PDF file not found: {pdf_path}")

        # Get report title for filename
        report_title = report_data.get('title', f'report_{report_id}')
        # Sanitize filename
        safe_title = "".join(c for c in report_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title}.pdf" if safe_title else f"report_{report_id}.pdf"

        print(f"Sending PDF file: {pdf_path} as {filename}")

        # Send file with proper headers
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )

    except ValueError as e:
        print(f"ValueError downloading PDF: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error downloading PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to download PDF: {str(e)}'
        }), 500


@reports_bp.route('/<int:report_id>/share-email', methods=['POST'])
@token_required
def share_email(current_user, report_id):
    """Share report via email"""
    try:
        # Get the report first to check its team
        from app.models.report import Report
        report = Report.query.get(report_id)

        if not report:
            raise ValueError("Report not found")

        # Check if user is a member of the report's team
        member = TeamMember.query.filter_by(
            user_id=current_user.id,
            team_id=report.team_id
        ).first()

        if not member:
            raise ValueError("You don't have access to this report")

        data = request.get_json()

        # Validate recipients
        recipients = data.get('recipients', [])
        if not recipients:
            return jsonify({
                'success': False,
                'message': 'At least one recipient is required'
            }), 400

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=report.team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Send email
        sender_name = f"{current_user.first_name} {current_user.last_name}"
        custom_message = data.get('message')

        EmailService.send_report_email(
            recipients=recipients,
            report_data=report_data,
            pdf_path=pdf_path,
            sender_name=sender_name,
            custom_message=custom_message
        )

        return jsonify({
            'success': True,
            'message': 'Report shared successfully via email'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error sharing report via email: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to share report via email'
        }), 500


@reports_bp.route('/drafts', methods=['GET'])
@token_required
def get_drafts(current_user):
    """Get all draft reports"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)

        # Get user's team
        team_id = get_user_team_id(current_user.id)

        # Get draft reports
        result = ReportService.get_draft_reports(
            user_id=current_user.id,
            team_id=team_id,
            page=page,
            limit=limit
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error getting drafts: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to get drafts'
        }), 500


@reports_bp.route('/draft', methods=['POST'])
@token_required
def save_draft(current_user):
    """Save analysis as draft"""
    try:
        data = request.get_json()

        # Get required fields
        analysis_id = data.get('analysis_id')
        title = data.get('title')

        if not analysis_id or not title:
            return jsonify({
                'success': False,
                'message': 'Analysis ID and title are required'
            }), 400

        # Get user's team
        team_id = get_user_team_id(current_user.id)

        # Create draft report
        draft = ReportService.create_draft_report(
            analysis_id=analysis_id,
            user_id=current_user.id,
            team_id=team_id,
            title=title,
            summary=data.get('summary'),
            field_values=data.get('field_values', []),
            custom_fields=data.get('custom_fields', [])
        )

        return jsonify({
            'success': True,
            'data': {
                'draft_id': draft.id,
                'created_at': draft.created_at.isoformat() if draft.created_at else None
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error saving draft: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to save draft'
        }), 500


@reports_bp.route('/<int:report_id>/finalize', methods=['POST'])
@token_required
def finalize_draft(current_user, report_id):
    """Finalize a draft report"""
    try:
        # Get user's team
        team_id = get_user_team_id(current_user.id)

        # Finalize the draft
        report = ReportService.finalize_draft(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'data': {
                'report_id': report_id,
                'status': 'finalized',
                'finalized_at': report.get('finalized_at')
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error finalizing draft: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to finalize draft'
        }), 500


@reports_bp.route('/<int:report_id>/share-whatsapp', methods=['POST'])
@token_required
def share_whatsapp(current_user, report_id):
    """Get WhatsApp share link for a report"""
    try:
        # Get the report first to check its team
        from app.models.report import Report
        report = Report.query.get(report_id)

        if not report:
            raise ValueError("Report not found")

        # Check if user is a member of the report's team
        member = TeamMember.query.filter_by(
            user_id=current_user.id,
            team_id=report.team_id
        ).first()

        if not member:
            raise ValueError("You don't have access to this report")

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=report.team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)
        pdf_filename = os.path.basename(pdf_path)

        # Create WhatsApp message
        # Note: In production, you'd want to host the PDF and include a download link
        message = f"""
Call Analysis Report: {report_data.get('title', 'Untitled')}

Created by: {report_data.get('created_by', {}).get('name', 'Unknown')}
Created at: {report_data.get('created_at', 'Unknown')}

Summary: {report_data.get('summary', 'No summary available')}

View full report with PDF attachment.
        """.strip()

        # URL encode the message
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        whatsapp_url = f"https://wa.me/?text={encoded_message}"

        return jsonify({
            'success': True,
            'data': {
                'whatsapp_url': whatsapp_url,
                'message': message,
                'pdf_filename': pdf_filename
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error creating WhatsApp share link: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create WhatsApp share link'
        }), 500


@reports_bp.route('/create-from-input', methods=['POST'])
@token_required
def create_from_input(current_user):
    """Create a draft report directly from text, voice, or image input"""
    try:
        # Get user's team
        team_id = get_user_team_id(current_user.id)

        # Check if this is a multipart form (file upload) or JSON (text input)
        if request.content_type and 'multipart/form-data' in request.content_type:
            # File upload (voice or image)
            template_id = request.form.get('template_id', type=int)
            input_type = request.form.get('input_type')  # 'voice' or 'image'
            file = request.files.get('file')

            if not template_id or not input_type or not file:
                return jsonify({
                    'success': False,
                    'message': 'Template ID, input type, and file are required'
                }), 400

            # Save the file temporarily
            from werkzeug.utils import secure_filename
            import tempfile
            filename = secure_filename(file.filename)
            temp_dir = tempfile.gettempdir()
            file_path = os.path.join(temp_dir, f"{current_user.id}_{filename}")
            file.save(file_path)

            try:
                # Create draft from file
                from app.services.analysis_service import AnalysisService

                if input_type == 'voice':
                    # Process audio file
                    draft = AnalysisService.create_draft_from_audio(
                        user_id=current_user.id,
                        team_id=team_id,
                        template_id=template_id,
                        audio_path=file_path
                    )
                elif input_type == 'image':
                    # Process image file
                    draft = AnalysisService.create_draft_from_image(
                        user_id=current_user.id,
                        team_id=team_id,
                        template_id=template_id,
                        image_path=file_path
                    )
                else:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid input type. Must be "voice" or "image"'
                    }), 400

                return jsonify({
                    'success': True,
                    'data': {
                        'draft_id': draft['id'],
                        'title': draft['title'],
                        'summary': draft.get('summary', ''),
                        'template_name': draft.get('template_name', ''),
                        'field_values': draft.get('field_values', []),
                        'created_at': draft['created_at']
                    }
                }), 201

            finally:
                # Clean up temporary file
                if os.path.exists(file_path):
                    os.remove(file_path)

        else:
            # JSON request (text input)
            data = request.get_json()
            template_id = data.get('template_id')
            text_input = data.get('text')

            if not template_id or not text_input:
                return jsonify({
                    'success': False,
                    'message': 'Template ID and text input are required'
                }), 400

            # Create draft from text
            from app.services.analysis_service import AnalysisService
            draft = AnalysisService.create_draft_from_text(
                user_id=current_user.id,
                team_id=team_id,
                template_id=template_id,
                text=text_input
            )

            return jsonify({
                'success': True,
                'data': {
                    'draft_id': draft['id'],
                    'title': draft['title'],
                    'summary': draft.get('summary', ''),
                    'template_name': draft.get('template_name', ''),
                    'field_values': draft.get('field_values', []),
                    'created_at': draft['created_at']
                }
            }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error creating report from input: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to create report: {str(e)}'
        }), 500


@reports_bp.route('/batch-delete', methods=['POST'])
@token_required
def batch_delete_reports(current_user):
    """Delete multiple reports at once"""
    try:
        data = request.get_json()
        report_ids = data.get('report_ids', [])

        if not report_ids or not isinstance(report_ids, list):
            return jsonify({
                'success': False,
                'message': 'Report IDs array is required'
            }), 400

        team_id = get_user_team_id(current_user.id)
        deleted_count = 0
        failed_ids = []

        for report_id in report_ids:
            try:
                # Get report and verify access
                report = Report.query.get(report_id)
                if not report:
                    failed_ids.append(report_id)
                    continue

                # Check if user has access (same team)
                if report.team_id != team_id:
                    failed_ids.append(report_id)
                    continue

                # Delete report
                db.session.delete(report)
                deleted_count += 1

            except Exception as e:
                print(f"Error deleting report {report_id}: {str(e)}")
                failed_ids.append(report_id)

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'deleted_count': deleted_count,
                'failed_ids': failed_ids
            },
            'message': f'Successfully deleted {deleted_count} report(s)'
        }), 200

    except Exception as e:
        print(f"Error in batch delete: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to delete reports'
        }), 500


@reports_bp.route('/batch-finalize', methods=['POST'])
@token_required
def batch_finalize_reports(current_user):
    """Finalize multiple draft reports at once"""
    try:
        data = request.get_json()
        report_ids = data.get('report_ids', [])

        if not report_ids or not isinstance(report_ids, list):
            return jsonify({
                'success': False,
                'message': 'Report IDs array is required'
            }), 400

        team_id = get_user_team_id(current_user.id)
        finalized_count = 0
        failed_ids = []

        for report_id in report_ids:
            try:
                # Get report and verify access
                report = Report.query.get(report_id)
                if not report:
                    failed_ids.append(report_id)
                    continue

                # Check if user has access (same team)
                if report.team_id != team_id:
                    failed_ids.append(report_id)
                    continue

                # Check if already finalized
                if report.status == 'finalized':
                    failed_ids.append(report_id)
                    continue

                # Finalize report
                report.status = 'finalized'
                report.finalized_at = datetime.utcnow()
                finalized_count += 1

            except Exception as e:
                print(f"Error finalizing report {report_id}: {str(e)}")
                failed_ids.append(report_id)

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'finalized_count': finalized_count,
                'failed_ids': failed_ids
            },
            'message': f'Successfully finalized {finalized_count} report(s)'
        }), 200

    except Exception as e:
        print(f"Error in batch finalize: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to finalize reports'
        }), 500
