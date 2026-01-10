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
        Analyze transcription using GPT-4 based on template fields with retry logic

        Args:
            transcription: The transcribed text
            template: Report template with fields

        Returns:
            dict: Analysis results with field values and summary
        """
        import time

        max_retries = 3
        retry_delay = 2  # seconds

        for attempt in range(max_retries):
            try:
                # Build enhanced prompt for GPT-4
                prompt = AnalysisService._build_enhanced_analysis_prompt(transcription, template)

                # Initialize OpenAI client
                client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

                # Call GPT-4 with enhanced parameters
                response = client.chat.completions.create(
                    model=current_app.config.get('GPT_MODEL', 'gpt-4-turbo-preview'),
                    messages=[
                        {
                            "role": "system",
                            "content": """You are an expert data analyst specialized in extracting structured information from text.

Your task is to:
1. Carefully read and understand the provided text
2. Extract accurate information for each specified field
3. Respect field types and constraints (text, number, dropdown options, etc.)
4. Provide ONLY information explicitly stated or clearly implied in the text
5. Use "Not mentioned" for missing information
6. Return precise, validated JSON output

Be thorough, accurate, and consistent."""
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.2,  # Lower temperature for more consistent output
                    response_format={"type": "json_object"},
                    seed=42  # For reproducibility
                )

                # Parse response
                analysis_result = json.loads(response.choices[0].message.content)

                # Validate response structure
                if not AnalysisService._validate_analysis_result(analysis_result, template):
                    if attempt < max_retries - 1:
                        print(f"Validation failed, retrying... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                        continue
                    else:
                        raise ValueError("Analysis result validation failed after retries")

                return analysis_result

            except json.JSONDecodeError as e:
                # JSON parsing error - retry
                if attempt < max_retries - 1:
                    print(f"JSON decode error, retrying... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise ValueError(f"Failed to parse analysis result as JSON: {str(e)}")

            except Exception as e:
                error_msg = str(e)

                # Handle specific errors
                if 'api_key' in error_msg.lower():
                    raise ValueError("OpenAI API key not configured")
                elif 'quota' in error_msg.lower():
                    raise ValueError("OpenAI API quota exceeded")
                elif 'rate' in error_msg.lower() or 'rate_limit' in error_msg.lower():
                    # Rate limit - retry with exponential backoff
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                        print(f"Rate limited, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise ValueError("OpenAI API rate limited - please try again later")
                else:
                    # Other errors - retry
                    if attempt < max_retries - 1:
                        print(f"Analysis error: {error_msg}, retrying... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_delay * (attempt + 1))
                        continue
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
    def _build_enhanced_analysis_prompt(transcription: str, template: ReportTemplate) -> str:
        """Build enhanced prompt with better structure and examples"""

        # Build detailed field descriptions with validation rules
        fields_description = []
        for field in template.fields:
            field_info = {
                "field_name": field.field_name,
                "field_label": field.field_label,
                "field_type": field.field_type,
                "is_required": field.is_required,
                "description": f"Extract the {field.field_label.lower()} from the text"
            }

            # Add type-specific validation rules
            if field.field_type == 'number':
                field_info['validation'] = "Must be a numeric value (integer or decimal)"
                field_info['example'] = 8 if 'score' in field.field_name.lower() else 100
            elif field.field_type == 'text':
                field_info['validation'] = "Must be a string"
                field_info['example'] = "John Doe" if 'name' in field.field_name.lower() else "Sample text"
            elif field.field_type == 'dropdown':
                options = field.get_options()
                field_info['options'] = options
                field_info['validation'] = f"Must be EXACTLY one of: {', '.join(options)}"
                field_info['example'] = options[0] if options else "Option 1"
            elif field.field_type == 'multi_select':
                options = field.get_options()
                field_info['options'] = options
                field_info['validation'] = f"Must be an array of values from: {', '.join(options)}"
                field_info['example'] = [options[0]] if options else ["Option 1"]
            elif field.field_type == 'long_text':
                field_info['validation'] = "Must be a string (can be multiple sentences)"
                field_info['example'] = "Detailed description or notes"

            fields_description.append(field_info)

        # Build example output structure
        example_output = {
            "summary": "Brief summary of the content (2-3 sentences)",
            "fields": []
        }

        for field_info in fields_description[:3]:  # Show first 3 fields as examples
            example_output["fields"].append({
                "field_name": field_info["field_name"],
                "value": field_info.get("example", "extracted value")
            })

        if len(fields_description) > 3:
            example_output["fields"].append({"...": "..."})

        prompt = f"""**Report Template:** {template.name}
{template.description if template.description else ""}

**INPUT TEXT:**
```
{transcription}
```

**FIELDS TO EXTRACT:**
{json.dumps(fields_description, indent=2)}

**CRITICAL INSTRUCTIONS:**

1. **Read Carefully:** Thoroughly analyze the entire input text before extracting any information

2. **Accuracy First:** Extract ONLY information that is explicitly stated or clearly implied in the text
   - If information is missing or unclear, use "Not mentioned"
   - Never make assumptions or invent information

3. **Type Validation:** Strictly respect field types:
   - **number**: Numeric values only (e.g., 8, 42.5, 100)
   - **text**: String values (e.g., "John Doe", "Billing")
   - **long_text**: Multi-sentence strings
   - **dropdown**: MUST use EXACTLY one value from the provided options list
   - **multi_select**: Array of values, each from the provided options list

4. **Dropdown Fields:** For dropdown/multi_select fields:
   - Use ONLY values from the provided options
   - Match exactly (case-sensitive)
   - If the text mentions something similar but not exact, choose the closest match
   - If unsure, use "Not mentioned"

5. **Required Fields:** Pay special attention to required fields (is_required: true)
   - Try harder to extract these from context
   - Only use "Not mentioned" if truly not available

6. **Summary:** Provide a concise 2-3 sentence summary capturing the key points

**EXPECTED OUTPUT FORMAT:**

Return a JSON object with this EXACT structure:
{json.dumps(example_output, indent=2)}

**VALIDATION CHECKLIST:**
- All field names match exactly
- All values respect field types
- Dropdown values match options exactly
- Numbers are numeric (not strings)
- Summary is concise (2-3 sentences)
- No missing required fields
- No extra fields added

Analyze now and return valid JSON."""

        return prompt

    @staticmethod
    def _validate_analysis_result(result: dict, template: ReportTemplate) -> bool:
        """
        Validate analysis result structure and field values

        Args:
            result: Analysis result dictionary
            template: Report template

        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check required keys
            if 'fields' not in result:
                print("Validation error: Missing 'fields' key")
                return False

            if not isinstance(result['fields'], list):
                print("Validation error: 'fields' must be a list")
                return False

            # Build field map from template
            template_fields = {field.field_name: field for field in template.fields}

            # Validate each field
            result_field_map = {f['field_name']: f['value'] for f in result['fields'] if 'field_name' in f and 'value' in f}

            for field in template.fields:
                field_name = field.field_name

                # Check if field exists in result
                if field_name not in result_field_map:
                    if field.is_required:
                        print(f"Validation error: Missing required field '{field_name}'")
                        return False
                    continue

                value = result_field_map[field_name]

                # Skip validation for "Not mentioned" values
                if value == "Not mentioned" or value is None:
                    continue

                # Type validation
                if field.field_type == 'number':
                    if not isinstance(value, (int, float)):
                        try:
                            float(value)  # Try to convert
                        except (ValueError, TypeError):
                            print(f"Validation error: Field '{field_name}' must be numeric, got {type(value)}")
                            return False

                elif field.field_type in ['dropdown', 'multi_select']:
                    options = field.get_options()
                    if not options:
                        continue

                    if field.field_type == 'dropdown':
                        if value not in options:
                            print(f"Validation error: Field '{field_name}' value '{value}' not in options {options}")
                            return False
                    else:  # multi_select
                        if not isinstance(value, list):
                            print(f"Validation error: Field '{field_name}' must be a list for multi_select")
                            return False
                        for v in value:
                            if v not in options:
                                print(f"Validation error: Field '{field_name}' value '{v}' not in options {options}")
                                return False

            return True

        except Exception as e:
            print(f"Validation exception: {str(e)}")
            return False

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
    def create_image_analysis(image_path: str, template_id: int, user_id: int, team_id: int) -> CallAnalysis:
        """
        Create an analysis from image input

        Args:
            image_path: Path to uploaded image
            template_id: Template to use for analysis
            user_id: User creating the analysis
            team_id: Team ID

        Returns:
            CallAnalysis: Created analysis object
        """
        # Create analysis record with image input
        analysis = CallAnalysis(
            user_id=user_id,
            team_id=team_id,
            template_id=template_id,
            input_type='image',
            image_file_path=image_path
        )

        db.session.add(analysis)
        db.session.commit()

        return analysis

    @staticmethod
    def extract_text_from_image(image_path: str, template: ReportTemplate) -> str:
        """
        Extract text and data from image using GPT-4 Vision API

        Args:
            image_path: Path to the image file
            template: Report template (for context)

        Returns:
            str: Extracted text that will be used for analysis
        """
        try:
            import base64
            import os

            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')

            # Determine image format
            file_ext = os.path.splitext(image_path)[1].lower()
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(file_ext, 'image/jpeg')

            # Initialize OpenAI client
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])

            # Build extraction prompt
            prompt = f"""Analyze this image and extract all relevant text, data, and information.

The extracted information will be used for a report titled "{template.name}".

Please:
1. Extract all visible text from the image
2. Identify any structured data (tables, forms, fields)
3. Describe any relevant visual information
4. Present the information in a clear, organized format

If this is a:
- Screenshot: Extract all text and UI elements
- Document/Form: Extract all fields and values
- Handwritten note: Transcribe the text
- Photo: Describe relevant details

Provide the extracted information as a structured text that can be analyzed."""

            # Call GPT-4 Vision API
            response = client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.2
            )

            extracted_text = response.choices[0].message.content.strip()
            return extracted_text

        except Exception as e:
            error_msg = str(e)
            print(f"Image extraction error: {error_msg}")

            if 'api_key' in error_msg.lower():
                raise ValueError("OpenAI API key not configured")
            elif 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                raise ValueError("OpenAI API quota exceeded or rate limited")
            elif 'unsupported' in error_msg.lower() or 'format' in error_msg.lower():
                raise ValueError("Unsupported image format. Please use JPG, PNG, GIF, or WebP")
            else:
                raise ValueError(f"Image analysis failed: {error_msg}")

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
