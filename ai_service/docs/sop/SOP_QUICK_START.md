# SOP Template Library - Quick Start Guide

Get started with the SOP Template Library in 5 minutes!

## Prerequisites

- MongoDB running
- Python 3.9+ with dependencies installed
- FastAPI server running
- Google API key (optional, for AI features)

## Step 1: Initialize Templates (2 minutes)

```bash
cd ai_service
python scripts/init_sop_templates.py init
```

This loads 20+ professional SOP templates into MongoDB.

## Step 2: Start the Server (if not running)

```bash
cd ai_service
uvicorn main:app --reload --port 8000
```

## Step 3: Basic Usage

### Search for Templates

```bash
curl -X POST "http://localhost:8000/api/v1/sop-templates/search" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "degree": "PhD",
      "field": "Computer Science"
    },
    "limit": 5
  }'
```

### Get Specific Template

```bash
curl "http://localhost:8000/api/v1/sop-templates/phd_cs_research_focused_001"
```

### Personalize a Template

```bash
curl -X POST "http://localhost:8000/api/v1/sop-templates/phd_cs_research_focused_001/personalize" \
  -H "Content-Type: application/json" \
  -d '{
    "personalization_data": {
      "name": "John Doe",
      "university": "Stanford University",
      "program": "PhD Computer Science",
      "faculty_names": ["Dr. Jane Smith"],
      "research_interests": ["machine learning"],
      "custom_variables": {
        "research_area": "deep learning",
        "num_publications": "3",
        "institution": "MIT",
        "project": "neural networks",
        "advisor": "Dr. Wang"
      }
    }
  }'
```

## Step 4: Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/sop-templates"

# 1. Search templates
response = requests.post(f"{BASE_URL}/search", json={
    "filters": {"degree": "PhD", "field": "Computer Science"},
    "sort_by": "success_rate"
})
templates = response.json()["templates"]
print(f"Found {len(templates)} templates")

# 2. Get best template
template_id = templates[0]["id"]
template = requests.get(f"{BASE_URL}/{template_id}").json()
print(f"Using: {template['title']}")

# 3. Personalize
result = requests.post(f"{BASE_URL}/{template_id}/personalize", json={
    "personalization_data": {
        "name": "Your Name",
        "university": "Target University",
        "program": "Program Name",
        "custom_variables": {
            "research_area": "your area",
            "institution": "your current institution"
            # Add more as needed by template
        }
    }
}).json()

# 4. Save result
with open("my_sop.txt", "w") as f:
    f.write(result["personalized_content"])

print(f"SOP generated: {result['word_count']} words")
print(f"Suggestions: {result['suggestions']}")
```

## Step 5: Advanced - AI Customization

```python
# Enhance with AI (requires Google API key)
customized = requests.post(f"{BASE_URL}/{template_id}/customize", json={
    "personalization_data": { ... },
    "customization_instructions": "Make more confident, emphasize research impact",
    "enhance_sections": ["Research Experience"],
    "focus_areas": ["publications", "methodology"]
}).json()

print("AI-Enhanced SOP:")
print(customized["customized_content"])
print(f"\nChanges: {customized['changes_made']}")
```

## Common Use Cases

### Use Case 1: PhD Application

```python
# Get recommendations
recommendations = requests.post(f"{BASE_URL}/recommendations", json={
    "user_profile": {
        "name": "Your Name",
        "university": "Target",
        "program": "PhD CS",
        "research_interests": ["ML", "CV"]
    },
    "degree": "PhD",
    "field": "Computer Science",
    "purpose": "Research-focused"
}).json()

best_match = recommendations["recommendations"][0]
print(f"Best template: {best_match['template']['title']}")
print(f"Match score: {best_match['relevance_score']}")
print(f"Reasons: {best_match['match_reasons']}")
```

### Use Case 2: Mix Multiple Templates

```python
# Combine sections from different templates
mixed = requests.post(f"{BASE_URL}/mix-sections", json={
    "section_selections": {
        "Introduction": "template_1_id",
        "Research Experience": "template_2_id",
        "Program Fit": "template_1_id"
    },
    "personalization_data": { ... },
    "transitions": True
}).json()

print(mixed["mixed_content"])
```

### Use Case 3: Adjust Tone

```python
# Make content more confident
adjusted = requests.post(f"{BASE_URL}/adjust-tone", json={
    "content": "Your original content...",
    "target_tone": "Confident",
    "section_type": "Introduction"
}).json()

print(adjusted["adjusted_content"])
```

## Next Steps

1. **Explore Templates**: Browse all templates at `/api/v1/sop-templates/`
2. **Read Full Docs**: See `SOP_TEMPLATE_LIBRARY.md` for complete API reference
3. **Customize Variables**: Each template has different variables - check `content.variables`
4. **Get Feedback**: Use `suggestions` field for improvement ideas
5. **Try AI Features**: Enable Google API key for advanced customization

## Tips

✅ Always provide complete personalization data
✅ Research faculty before mentioning them
✅ Review and edit AI-generated content
✅ Check word count suggestions
✅ Have mentors review final SOP

## Troubleshooting

**Templates not loading?**
```bash
python scripts/init_sop_templates.py list
# If empty, run: python scripts/init_sop_templates.py init
```

**Variables not replaced?**
- Check template's required variables
- Ensure all variables in `custom_variables`
- Use exact variable names from template

**AI features not working?**
- Set `GOOGLE_API_KEY` in `.env`
- Verify API key has Gemini access
- Fall back to basic personalization

## API Documentation

Interactive API docs available at:
```
http://localhost:8000/docs
```

Browse and test all endpoints directly in your browser!

---

**Ready to create your perfect SOP!** 🎓✨
