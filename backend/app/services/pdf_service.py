from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
import os
from flask import current_app


class PDFService:
    @staticmethod
    def generate_report_pdf(report_data, output_filename=None):
        """
        Generate a PDF from report data

        Args:
            report_data: Dictionary containing report information
            output_filename: Optional filename for the PDF

        Returns:
            str: Path to the generated PDF file
        """
        # Create output directory if it doesn't exist
        pdf_folder = current_app.config['PDF_FOLDER']
        os.makedirs(pdf_folder, exist_ok=True)

        # Generate filename if not provided
        if not output_filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"report_{report_data['id']}_{timestamp}.pdf"

        output_path = os.path.join(pdf_folder, output_filename)

        # Create the PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )

        # Container for the 'Flowable' objects
        elements = []

        # Define styles
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a202c'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=12,
            spaceBefore=12
        )

        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#4a5568'),
            spaceAfter=8
        )

        # Add title
        title = Paragraph(report_data.get('title', 'Call Analysis Report'), title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))

        # Add metadata table
        metadata = [
            ['Report ID:', str(report_data.get('id', 'N/A'))],
            ['Created By:', report_data.get('created_by', {}).get('name', 'N/A')],
            ['Created At:', PDFService._format_date(report_data.get('created_at'))],
            ['Template:', report_data.get('template', {}).get('name', 'N/A')],
            ['Status:', report_data.get('status', 'N/A').upper()]
        ]

        if report_data.get('finalized_at'):
            metadata.append(['Finalized At:', PDFService._format_date(report_data.get('finalized_at'))])

        metadata_table = Table(metadata, colWidths=[2 * inch, 4 * inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#edf2f7')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0'))
        ]))
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Add summary if available
        if report_data.get('summary'):
            summary_heading = Paragraph('Summary', heading_style)
            elements.append(summary_heading)
            summary_text = Paragraph(report_data['summary'], normal_style)
            elements.append(summary_text)
            elements.append(Spacer(1, 0.2 * inch))

        # Add field values
        if report_data.get('field_values'):
            fields_heading = Paragraph('Analysis Details', heading_style)
            elements.append(fields_heading)
            elements.append(Spacer(1, 0.1 * inch))

            for field in report_data['field_values']:
                field_label = Paragraph(
                    f"<b>{field.get('field_label', 'N/A')}:</b>",
                    normal_style
                )
                elements.append(field_label)

                field_value = field.get('value', 'N/A')
                # Handle long text values
                if len(str(field_value)) > 100:
                    field_value_para = Paragraph(str(field_value), normal_style)
                    elements.append(field_value_para)
                else:
                    field_value_para = Paragraph(str(field_value), normal_style)
                    elements.append(field_value_para)

                elements.append(Spacer(1, 0.1 * inch))

        # Add transcription if available
        if report_data.get('transcription'):
            elements.append(PageBreak())
            transcription_heading = Paragraph('Full Transcription', heading_style)
            elements.append(transcription_heading)
            elements.append(Spacer(1, 0.1 * inch))

            # Split transcription into paragraphs for better formatting
            transcription_text = report_data['transcription']
            transcription_para = Paragraph(transcription_text, normal_style)
            elements.append(transcription_para)

        # Add footer information
        elements.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#718096'),
            alignment=TA_CENTER
        )
        footer = Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | Call Analyzer Application",
            footer_style
        )
        elements.append(footer)

        # Build PDF
        doc.build(elements)

        return output_path

    @staticmethod
    def _format_date(date_string):
        """Format ISO date string to readable format"""
        if not date_string:
            return 'N/A'

        try:
            dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return dt.strftime('%B %d, %Y at %I:%M %p')
        except:
            return date_string

    @staticmethod
    def get_pdf_url(filename):
        """Get the URL for a generated PDF"""
        return f"/generated/pdfs/{filename}"
