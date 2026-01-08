from app import db
from app.models.report import Report, ReportFieldValue
from app.models.analysis import CallAnalysis
from app.models.template import ReportTemplate, TemplateField
from app.models.user import User
from sqlalchemy import or_, and_
from datetime import datetime


class ReportService:
    @staticmethod
    def get_reports(user_id, team_id, page=1, limit=20, search=None, status=None):
        """Get all reports for a team with pagination and filters"""
        # Start with base query for the team
        query = Report.query.filter_by(team_id=team_id)

        # Apply status filter (default to finalized if not specified)
        if status:
            query = query.filter_by(status=status)
        else:
            # Default: show only finalized reports
            query = query.filter_by(status='finalized')

        # Apply search filter
        if search:
            query = query.filter(Report.title.ilike(f'%{search}%'))

        # Order by creation date descending
        query = query.order_by(Report.created_at.desc())

        # Paginate
        total = query.count()
        reports = query.offset((page - 1) * limit).limit(limit).all()

        # Format reports with additional info
        report_list = []
        for report in reports:
            template = ReportTemplate.query.get(report.template_id)
            creator = User.query.get(report.user_id)

            report_dict = report.to_dict()
            report_dict['template_name'] = template.name if template else 'Unknown'
            report_dict['created_by'] = f"{creator.first_name} {creator.last_name}" if creator else 'Unknown'

            report_list.append(report_dict)

        return {
            'reports': report_list,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        }

    @staticmethod
    def get_report_by_id(report_id, user_id, team_id):
        """Get a single report with full details"""
        report = Report.query.filter_by(id=report_id, team_id=team_id).first()

        if not report:
            raise ValueError("Report not found")

        # Get associated data
        analysis = CallAnalysis.query.get(report.analysis_id)
        template = ReportTemplate.query.get(report.template_id)
        creator = User.query.get(report.user_id)

        # Get field values with field details
        field_values = []
        for fv in report.field_values:
            field = TemplateField.query.get(fv.field_id)
            if field:
                field_values.append({
                    'field_id': fv.field_id,
                    'field_label': field.field_label,
                    'field_type': field.field_type,
                    'value': fv.field_value
                })

        # Build response
        report_dict = report.to_dict()
        report_dict['template'] = {
            'id': template.id,
            'name': template.name,
            'description': template.description
        } if template else None
        report_dict['field_values'] = field_values
        report_dict['transcription'] = analysis.transcription if analysis else ''
        report_dict['audio_duration'] = analysis.audio_duration if analysis else 0
        report_dict['created_by'] = {
            'id': creator.id,
            'name': f"{creator.first_name} {creator.last_name}",
            'email': creator.email
        } if creator else None

        return report_dict

    @staticmethod
    def update_report(report_id, user_id, team_id, title=None, field_values=None):
        """Update a report"""
        report = Report.query.filter_by(id=report_id, team_id=team_id).first()

        if not report:
            raise ValueError("Report not found")

        # Update title if provided
        if title:
            report.title = title

        # Update field values if provided
        if field_values:
            for fv_data in field_values:
                field_id = fv_data.get('field_id')
                value = fv_data.get('value')

                # Find existing field value or create new one
                field_value = ReportFieldValue.query.filter_by(
                    report_id=report.id,
                    field_id=field_id
                ).first()

                if field_value:
                    field_value.field_value = value
                else:
                    field_value = ReportFieldValue(
                        report_id=report.id,
                        field_id=field_id,
                        field_value=value
                    )
                    db.session.add(field_value)

        report.updated_at = datetime.utcnow()
        db.session.commit()

        return report.to_dict()

    @staticmethod
    def delete_report(report_id, user_id, team_id):
        """Delete a report"""
        report = Report.query.filter_by(id=report_id, team_id=team_id).first()

        if not report:
            raise ValueError("Report not found")

        db.session.delete(report)
        db.session.commit()

        return True

    @staticmethod
    def get_recent_reports(team_id, limit=10):
        """Get recent reports for dashboard"""
        reports = Report.query.filter_by(
            team_id=team_id,
            status='finalized'
        ).order_by(Report.created_at.desc()).limit(limit).all()

        report_list = []
        for report in reports:
            creator = User.query.get(report.user_id)
            report_dict = {
                'id': report.id,
                'title': report.title,
                'created_by': f"{creator.first_name} {creator.last_name}" if creator else 'Unknown',
                'created_at': report.created_at.isoformat() if report.created_at else None
            }
            report_list.append(report_dict)

        return report_list

    @staticmethod
    def get_draft_reports(user_id, team_id, page=1, limit=20):
        """Get all draft reports for a user"""
        query = Report.query.filter_by(
            team_id=team_id,
            status='draft'
        ).order_by(Report.created_at.desc())

        # Paginate
        total = query.count()
        reports = query.offset((page - 1) * limit).limit(limit).all()

        # Format reports with additional info
        report_list = []
        for report in reports:
            template = ReportTemplate.query.get(report.template_id)
            creator = User.query.get(report.user_id)

            report_dict = report.to_dict()
            report_dict['template_name'] = template.name if template else 'Unknown'
            report_dict['created_by'] = f"{creator.first_name} {creator.last_name}" if creator else 'Unknown'

            report_list.append(report_dict)

        return {
            'drafts': report_list,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        }

    @staticmethod
    def create_draft_report(analysis_id, user_id, team_id, title, summary=None, field_values=None):
        """Create a draft report from analysis"""
        # Get the analysis
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            raise ValueError("Analysis not found")

        # Check if draft already exists for this analysis
        existing_draft = Report.query.filter_by(
            analysis_id=analysis_id,
            status='draft'
        ).first()

        if existing_draft:
            # Update existing draft
            existing_draft.title = title
            if summary:
                existing_draft.summary = summary
            existing_draft.updated_at = datetime.utcnow()

            # Update field values
            if field_values:
                # Delete old field values
                ReportFieldValue.query.filter_by(report_id=existing_draft.id).delete()

                # Add new field values
                for fv in field_values:
                    report_field_value = ReportFieldValue(
                        report_id=existing_draft.id,
                        field_id=fv['field_id'],
                        field_value=str(fv['value']) if fv['value'] is not None else None
                    )
                    db.session.add(report_field_value)

            db.session.commit()
            return existing_draft

        # Create new draft report
        report = Report(
            analysis_id=analysis_id,
            user_id=user_id,
            team_id=team_id,
            template_id=analysis.template_id,
            title=title,
            summary=summary,
            status='draft'
        )
        db.session.add(report)
        db.session.flush()  # Get report ID

        # Add field values
        if field_values:
            for fv in field_values:
                report_field_value = ReportFieldValue(
                    report_id=report.id,
                    field_id=fv['field_id'],
                    field_value=str(fv['value']) if fv['value'] is not None else None
                )
                db.session.add(report_field_value)

        db.session.commit()
        return report
