# Implementation Plan: New Input Types + Accuracy Improvements

## 📋 Overview

### Feature 1: Multiple Input Types
Currently: Audio only (file upload + live recording)
Adding: Text input + Image input

### Feature 2: Analysis Accuracy Improvements
Currently: Sometimes inconsistent results
Improving: Robust pipeline with retry logic, validation, and better prompts

---

## 🎯 FEATURE 1: MULTIPLE INPUT TYPES

### Current Flow (Audio Only)
```
1. User uploads audio file / records live
2. Audio → Whisper API → Transcription (text)
3. Transcription + Template → GPT-4 → Analysis
4. Analysis → Report with field values
```

### New Flow (3 Input Types)

#### Option A: Audio Input (Existing)
```
Audio File/Recording → Whisper → Text → GPT-4 → Analysis
```

#### Option B: Text Input (NEW)
```
User types text → Skip transcription → GPT-4 → Analysis
```

#### Option C: Image Input (NEW)
```
User uploads image → GPT-4 Vision/OCR → Extract text → GPT-4 → Analysis
```

---

## 🔧 IMPLEMENTATION: FEATURE 1

### Backend Changes

#### 1. Update Analysis Model
```python
# backend/app/models/analysis.py

class CallAnalysis:
    # Add new fields
    input_type = Column(Enum('audio', 'text', 'image'))
    input_text = Column(Text)  # For direct text input
    image_file_path = Column(String(500))  # For image input
```

#### 2. Create New Service Methods
```python
# backend/app/services/analysis_service.py

class AnalysisService:

    @staticmethod
    def analyze_text(text, template_id, user_id, team_id):
        """Analyze direct text input"""
        # Skip transcription, go directly to GPT-4 analysis
        pass

    @staticmethod
    def analyze_image(image_file, template_id, user_id, team_id):
        """Analyze image input using Vision API"""
        # 1. Use GPT-4 Vision to extract text/data from image
        # 2. Analyze extracted data with template
        pass
```

#### 3. New API Endpoints
```python
# backend/app/routes/analysis.py

@analysis_bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """
    POST /api/analysis/analyze-text
    Body: {
        "text": "Customer called about billing...",
        "template_id": 1
    }
    """
    pass

@analysis_bp.route('/analyze-image', methods=['POST'])
def analyze_image():
    """
    POST /api/analysis/analyze-image
    Body: FormData {
        "image": <file>,
        "template_id": 1
    }
    """
    pass
```

### Frontend Changes

#### 1. Input Type Selector
```typescript
// frontend/src/pages/AnalyzeCall.tsx

enum InputType {
  AUDIO = 'audio',
  TEXT = 'text',
  IMAGE = 'image'
}

const [inputType, setInputType] = useState<InputType>(InputType.AUDIO);
```

#### 2. Conditional Input Components
```jsx
{inputType === 'audio' && <AudioUploader />}
{inputType === 'text' && <TextInputArea />}
{inputType === 'image' && <ImageUploader />}
```

#### 3. New Components
- `TextInputArea.tsx` - Rich text editor for direct input
- `ImageUploader.tsx` - Image upload with preview

---

## 🎯 FEATURE 2: ACCURACY IMPROVEMENTS

### Current Issues
1. ❌ Sometimes returns incomplete field values
2. ❌ Field types not always respected (text vs number)
3. ❌ No retry on API failures
4. ❌ Generic prompts without field context
5. ❌ No validation of generated values

### Solutions

#### 1. Improved GPT-4 Prompts
```python
# Use structured output with JSON mode
# Include field types and constraints in prompt
# Add few-shot examples

ANALYSIS_PROMPT = """
You are an expert call analyzer. Analyze the following transcription and extract information according to the template fields.

TRANSCRIPTION:
{transcription}

TEMPLATE FIELDS:
{fields_with_types_and_constraints}

INSTRUCTIONS:
1. Extract accurate information for each field
2. Respect field types (text, number, dropdown, etc.)
3. For missing information, use null
4. Be precise and factual

OUTPUT FORMAT (JSON):
{{
    "field_1": "value",
    "field_2": 123,
    ...
}}
"""
```

#### 2. Field Type Validation
```python
def validate_field_value(value, field_type):
    """Validate field value matches expected type"""
    if field_type == 'number':
        return isinstance(value, (int, float))
    elif field_type == 'dropdown':
        return value in allowed_options
    # ... etc
```

#### 3. Retry Logic with Exponential Backoff
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(OpenAIError)
)
def call_gpt4_with_retry(prompt):
    """Call GPT-4 with automatic retry"""
    return openai.ChatCompletion.create(...)
```

#### 4. Response Validation
```python
def validate_analysis_response(response, template_fields):
    """Validate GPT-4 response has all required fields"""
    missing_fields = []
    invalid_types = []

    for field in template_fields:
        if field.is_required and field.id not in response:
            missing_fields.append(field)

        if field.id in response:
            if not validate_field_value(response[field.id], field.type):
                invalid_types.append(field)

    return missing_fields, invalid_types
```

#### 5. Confidence Scores
```python
# Ask GPT-4 to provide confidence scores
{
    "field_1": {
        "value": "Billing Issue",
        "confidence": 0.95
    },
    "field_2": {
        "value": 8,
        "confidence": 0.80
    }
}
```

---

## 📊 IMPLEMENTATION ORDER

### Phase 1: Text Input (Easiest)
1. Add text input UI component
2. Create analyze-text endpoint
3. Reuse existing GPT-4 analysis logic
4. Test with sample text

**Estimated Time:** 2 hours

### Phase 2: Image Input (Medium)
1. Add image upload UI component
2. Integrate GPT-4 Vision API
3. Extract text/data from images
4. Pass to analysis pipeline
5. Test with sample images

**Estimated Time:** 4 hours

### Phase 3: Accuracy Improvements (Complex)
1. Rewrite GPT-4 prompts with structured output
2. Add retry logic with exponential backoff
3. Implement field validation
4. Add response validation
5. Test with various inputs
6. Measure accuracy improvement

**Estimated Time:** 6 hours

---

## 🧪 TESTING STRATEGY

### Text Input Tests
- [ ] Short text (1-2 sentences)
- [ ] Medium text (paragraph)
- [ ] Long text (multiple paragraphs)
- [ ] Text with special characters
- [ ] Empty text handling

### Image Input Tests
- [ ] Clear printed text image
- [ ] Handwritten text image
- [ ] Image with tables/data
- [ ] Low quality image
- [ ] Multiple images
- [ ] Invalid file format

### Accuracy Tests
- [ ] All required fields filled
- [ ] Correct field types
- [ ] Dropdown values in allowed list
- [ ] Number fields are numeric
- [ ] Retry on API failure
- [ ] Validation catches errors

---

## 📈 SUCCESS METRICS

### Feature 1: Input Types
- ✅ Can analyze text input successfully
- ✅ Can analyze image input successfully
- ✅ All 3 input types produce reports
- ✅ UI allows easy switching between types

### Feature 2: Accuracy
- ✅ 95%+ of required fields populated
- ✅ 98%+ field type accuracy
- ✅ < 1% API failure rate (with retries)
- ✅ Average confidence score > 0.85
- ✅ Zero missing required fields

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database migration for new fields
- [ ] Update OpenAI API package (for Vision)
- [ ] Add new environment variables
- [ ] Update frontend build
- [ ] Test all 3 input types
- [ ] Monitor accuracy metrics
- [ ] Update documentation

---

## 📝 API CHANGES SUMMARY

### New Endpoints
- `POST /api/analysis/analyze-text` - Analyze text input
- `POST /api/analysis/analyze-image` - Analyze image input

### Modified Endpoints
- `POST /api/analysis/analyze` - Enhanced with retry logic and validation

### New Database Fields
- `call_analyses.input_type` (enum)
- `call_analyses.input_text` (text)
- `call_analyses.image_file_path` (varchar)

---

**Start Implementation:** Feature 1 → Phase 1 (Text Input)
**Priority:** High
**Complexity:** Medium to High
