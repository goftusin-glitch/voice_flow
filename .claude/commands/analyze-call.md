# Analyze Call Command

Test the complete call analysis flow from audio upload to report generation.

## Usage

```
/analyze-call [template-name] [audio-file-path]
```

Example:
```
/analyze-call "Customer Support" "test_audio/sample_call.mp3"
```

## Purpose

This command helps test and validate the core functionality of the Call Analyzer application by:
- Verifying OpenAI API integration (Whisper + GPT-4)
- Testing the full analysis pipeline
- Validating report generation
- Checking error handling

## Process

### Phase 1: Environment Check

1. **Verify services are running**
   ```bash
   # Check backend
   curl http://localhost:5000/api/auth/me

   # Check frontend
   curl http://localhost:5173
   ```

2. **Verify environment variables**
   - OpenAI API key is set
   - Database connection works
   - All required configs present

3. **Verify dependencies**
   - OpenAI library installed
   - pydub available for audio processing
   - Database tables exist

### Phase 2: Setup Test Data

1. **Check for test template**
   - Query database for template with given name
   - If not exists, create a sample template:
     ```python
     {
       "name": "Customer Support",
       "description": "Template for analyzing customer support calls",
       "fields": [
         {"name": "customer_name", "type": "text", "label": "Customer Name"},
         {"name": "issue_type", "type": "dropdown", "label": "Issue Type",
          "options": ["Technical", "Billing", "General"]},
         {"name": "satisfaction", "type": "number", "label": "Satisfaction (1-10)"},
         {"name": "notes", "type": "long_text", "label": "Call Notes"}
       ]
     }
     ```

2. **Verify audio file**
   - Check file exists at specified path
   - Check file format is supported
   - Check file size is reasonable (< 500MB)

### Phase 3: Execute Analysis Flow

1. **Upload Audio**
   ```python
   # POST /api/analysis/upload-audio
   response = upload_audio(
       audio_file=audio_file_path,
       template_id=template_id
   )
   analysis_id = response['data']['analysis_id']
   ```

   **Validation:**
   - ✅ File uploaded successfully
   - ✅ Analysis ID returned
   - ✅ Duration calculated correctly

2. **Transcribe with Whisper**
   ```python
   # Internal: TranscriptionService.transcribe_audio()
   # This happens inside analyze endpoint
   ```

   **Monitor for:**
   - OpenAI API errors
   - File format issues
   - Timeout issues (for long audio)

3. **Analyze with GPT-4**
   ```python
   # POST /api/analysis/analyze
   response = analyze_call(analysis_id=analysis_id)
   results = response['data']
   ```

   **Validation:**
   - ✅ Transcription completed
   - ✅ Summary generated
   - ✅ Field values extracted
   - ✅ Values match template field types

4. **Review Generated Results**
   Display:
   ```
   📝 Analysis Results:

   Transcription:
   [First 200 characters of transcription...]

   Summary:
   [Generated summary]

   Extracted Fields:
   - Customer Name: [value]
   - Issue Type: [value]
   - Satisfaction: [value]
   - Notes: [value]
   ```

5. **Finalize Report**
   ```python
   # POST /api/analysis/finalize
   response = finalize_report(
       analysis_id=analysis_id,
       title="Test Report - [timestamp]",
       field_values=extracted_values
   )
   report_id = response['data']['report_id']
   ```

   **Validation:**
   - ✅ Report saved to database
   - ✅ Report ID returned
   - ✅ Status set to 'finalized'

### Phase 4: Verification

1. **Database verification**
   ```sql
   -- Check analysis record
   SELECT * FROM call_analyses WHERE id = {analysis_id};

   -- Check report record
   SELECT * FROM reports WHERE id = {report_id};

   -- Check field values
   SELECT * FROM report_field_values WHERE report_id = {report_id};
   ```

2. **API verification**
   ```python
   # GET /api/reports/{report_id}
   report = get_report(report_id)

   # Verify:
   # - All fields present
   # - Values correct
   # - Transcription stored
   # - Summary stored
   ```

3. **Cost calculation**
   ```
   💰 API Cost Estimate:
   - Whisper API: ~$0.006 per minute
   - GPT-4 API: ~$0.03 per 1K tokens

   This test cost approximately: $X.XX
   ```

### Phase 5: Report Results

Generate a test report:

```markdown
# Analysis Test Report

**Date**: [timestamp]
**Template**: [template-name]
**Audio File**: [audio-file-path]

## Results

### ✅ Success Criteria
- [x] Audio uploaded successfully
- [x] Whisper transcription completed
- [x] GPT-4 analysis completed
- [x] Field values extracted correctly
- [x] Report finalized and saved
- [x] Database records created

### 📊 Performance Metrics
- Audio Duration: X minutes
- Transcription Time: X seconds
- Analysis Time: X seconds
- Total Time: X seconds
- API Cost: $X.XX

### 🔍 Quality Check
- Transcription Accuracy: [Manual verification needed]
- Field Extraction Accuracy: [Check if values make sense]
- Summary Quality: [Is summary coherent and accurate?]

### 🐛 Issues Encountered
[List any errors or warnings]

### 💡 Recommendations
[Suggestions for improvement]
```

## Error Scenarios to Test

Test these common failure modes:

1. **Invalid audio file**
   ```
   /analyze-call "Test" "invalid_file.txt"
   Expected: Error message about invalid file format
   ```

2. **Missing template**
   ```
   /analyze-call "NonExistent" "test.mp3"
   Expected: Error message about template not found
   ```

3. **Corrupted audio**
   ```
   /analyze-call "Test" "corrupted.mp3"
   Expected: Graceful error from pydub or Whisper
   ```

4. **Very long audio** (> 10 minutes)
   ```
   Expected: May need chunking or timeout handling
   ```

5. **OpenAI API key missing**
   ```
   Expected: Clear error message about missing API key
   ```

## Sample Test Audio

If no audio file provided, use one of these sources:

1. **Generate test audio with text-to-speech**
   ```python
   from gtts import gTTS
   text = "Hello, I'm calling about a billing issue. My name is John Smith..."
   tts = gTTS(text=text, lang='en')
   tts.save("test_audio/sample.mp3")
   ```

2. **Use online samples**
   - Common Voice dataset
   - LibriSpeech corpus
   - Custom recording with browser audio recorder

## Expected Output

A successful test should show:

```
🎙️ Starting Call Analysis Test...

✅ Environment Check: PASSED
   - Backend running: http://localhost:5000
   - Frontend running: http://localhost:5173
   - OpenAI API: Configured
   - Database: Connected

✅ Template Check: PASSED
   - Template "Customer Support" found
   - 4 fields defined

✅ Audio Upload: PASSED
   - File: test.mp3 (180 seconds)
   - Analysis ID: 123

⏳ Transcribing audio with Whisper...
✅ Transcription: COMPLETED (5.2s)
   - 287 words transcribed

⏳ Analyzing with GPT-4...
✅ Analysis: COMPLETED (8.7s)
   - Summary generated
   - 4 fields extracted

✅ Report Finalized: PASSED
   - Report ID: 456
   - Saved to database

📊 Performance Summary:
   - Total Time: 13.9 seconds
   - Estimated Cost: $0.15

🎉 Analysis Test: PASSED
   All validation gates passed successfully!
```

## Notes for AI Assistant

- **This is a testing command** - run it to verify the system works
- **Check for errors at each step** - don't continue if something fails
- **Validate data quality** - make sure extracted values make sense
- **Monitor API costs** - OpenAI API calls cost money
- **Use realistic test data** - helps validate accuracy
- **Save test results** - helpful for debugging and optimization

## Integration with PRP

Use this command during `/execute-prp` when implementing analysis features:

1. After implementing transcription service
2. After implementing analysis service
3. After implementing report finalization
4. As final validation gate

## Troubleshooting

Common issues and solutions:

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Whisper API error | Invalid API key | Check OPENAI_API_KEY in .env |
| File format error | Unsupported format | Convert to MP3 with pydub |
| Timeout error | Audio too long | Implement chunking or increase timeout |
| Empty transcription | Silent audio | Verify audio has speech |
| Poor field extraction | Vague prompt | Improve GPT-4 prompt in AnalysisService |
| Database error | Migration not run | Run `flask db upgrade` |
| Cost too high | Using wrong model | Verify using whisper-1 and gpt-4-turbo |
