from openai import OpenAI
from flask import current_app
import json
from app.models.template import ReportTemplate, TemplateField
from app.models.analysis import CallAnalysis
from app.models.report import Report, ReportFieldValue
from app import db


class AnalysisService:
    @staticmethod
    def analyze_transcription(transcription: str, template: ReportTemplate) -> dict:
        """
        Analyze transcription using GPT-4 based on template fields

        Args:
            transcription: The transcribed text
            template: Report template with fields

        Returns:
            dict: Analysis results with field values and summary
        """
        try:
            # Build prompt for GPT-4
            prompt = AnalysisService._build_analysis_prompt(transcription, template)

            # Initialize OpenAI client
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

            # Call GPT-4
            response = client.chat.completions.create(
                model=current_app.config.get('GPT_MODEL', 'gpt-4-turbo-preview'),
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert call analyzer. Analyze the provided call transcription and extract information based on the specified fields. Return your analysis as valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            # Parse response
            analysis_result = json.loads(response.choices[0].message.content)

            return analysis_result

        except Exception as e:
            error_msg = str(e)
            print(f"Analysis error: {error_msg}")

            # Handle specific errors
            if 'api_key' in error_msg.lower():
                raise ValueError("OpenAI API key not configured")
            elif 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                raise ValueError("OpenAI API quota exceeded or rate limited")
            else:
                raise ValueError(f"Analysis failed: {error_msg}")

    @staticmethod
    def _build_analysis_prompt(transcription: str, template: ReportTemplate) -> str:
        """Build the prompt for GPT-4 analysis"""

        # Build field descriptions
        fields_description = []
        for field in template.fields:
            field_desc = {
                "field_name": field.field_name,
                "field_label": field.field_label,
                "field_type": field.field_type,
                "is_required": field.is_required
            }

            # Add options for dropdown/multi-select
            if field.field_type in ['dropdown', 'multi_select']:
                field_desc['options'] = field.get_options()

            fields_description.append(field_desc)

        prompt = f"""Analyze the following call transcription and extract information for a report titled "{template.name}".

**Call Transcription:**
{transcription}

**Fields to Extract:**
{json.dumps(fields_description, indent=2)}

**Instructions:**
1. Carefully read the call transcription
2. For each field, extract the relevant information from the transcription
3. For dropdown/multi_select fields, ONLY use values from the provided options
4. For text fields, provide concise, accurate information
5. For number fields, provide numeric values only
6. If information for a field is not available in the transcription, use "Not mentioned" or leave empty
7. Also provide a brief summary of the call (2-3 sentences)

**Response Format:**
Return a JSON object with this exact structure:
{{
    "summary": "Brief summary of the call",
    "fields": [
        {{
            "field_name": "field_name_here",
            "value": "extracted value here"
        }},
        ...
    ]
}}

Be accurate and concise in your analysis."""

        return prompt

    @staticmethod
    def create_report_from_analysis(analysis_id: int, user_id: int, title: str, field_values: list) -> Report:
        """
        Create a finalized report from analysis results

        Args:
            analysis_id: ID of the call analysis
            user_id: ID of the user creating the report
            title: Report title
            field_values: List of field values from the analysis

        Returns:
            Report: Created report object
        """
        # Get the analysis
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            raise ValueError("Analysis not found")

        # Create report
        report = Report(
            analysis_id=analysis_id,
            user_id=user_id,
            team_id=analysis.team_id,
            template_id=analysis.template_id,
            title=title,
            status='finalized'
        )
        db.session.add(report)
        db.session.flush()  # Get report ID

        # Add field values
        for fv in field_values:
            report_field_value = ReportFieldValue(
                report_id=report.id,
                field_id=fv['field_id'],
                field_value=str(fv['value']) if fv['value'] is not None else None
            )
            db.session.add(report_field_value)

        # Mark report as finalized
        report.finalize()

        db.session.commit()

        return report

    @staticmethod
    def create_text_analysis(text: str, template_id: int, user_id: int, team_id: int) -> CallAnalysis:
        """
        Create an analysis from direct text input (skip transcription)

        Args:
            text: Direct text input from user
            template_id: Template to use for analysis
            user_id: User creating the analysis
            team_id: Team ID

        Returns:
            CallAnalysis: Created analysis object
        """
        # Create analysis record with text input
        analysis = CallAnalysis(
            user_id=user_id,
            team_id=team_id,
            template_id=template_id,
            input_type='text',
            input_text=text,
            transcription=text  # Use text as transcription for analysis
        )

        db.session.add(analysis)
        db.session.commit()

        return analysis

    @staticmethod
    def generate_summary(transcription: str, max_length: int = 200) -> str:
        """
        Generate a brief summary of the transcription

        Args:
            transcription: The transcribed text
            max_length: Maximum length of summary in words

        Returns:
            str: Summary text
        """
        try:
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

            response = client.chat.completions.create(
                model=current_app.config.get('GPT_MODEL', 'gpt-4-turbo-preview'),
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional summarizer. Create concise summaries of call transcriptions in {max_length} words or less."
                    },
                    {
                        "role": "user",
                        "content": f"Summarize this call transcription:\n\n{transcription}"
                    }
                ],
                temperature=0.5,
                max_tokens=300
            )

            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            print(f"Summary generation error: {e}")
            # Fallback: return first N words of transcription
            words = transcription.split()[:50]
            return " ".join(words) + "..."
