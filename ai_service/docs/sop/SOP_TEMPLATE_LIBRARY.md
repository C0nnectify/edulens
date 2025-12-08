# SOP Template Library - Complete Documentation

## Overview

The SOP (Statement of Purpose) Template Library is a comprehensive system for managing, personalizing, and AI-enhancing statement of purpose documents for academic applications. It provides 20+ professional templates across different degrees, fields, and purposes, with powerful customization features.

## Table of Contents

1. [Architecture](#architecture)
2. [Template Structure](#template-structure)
3. [API Reference](#api-reference)
4. [Usage Examples](#usage-examples)
5. [Template Catalog](#template-catalog)
6. [Customization Guide](#customization-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│  API Endpoints (/api/v1/sop-templates/*)                    │
│  - List, Search, Get                                         │
│  - Personalize, Customize                                    │
│  - Recommendations, Mix Sections                             │
│  - Admin (Create, Update, Delete)                            │
├─────────────────────────────────────────────────────────────┤
│  SOPTemplateService                                          │
│  - Template management                                       │
│  - Variable substitution                                     │
│  - AI customization (Google Gemini)                          │
│  - Recommendation engine                                     │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Storage                                             │
│  - sop_templates collection                                  │
│  - Full-text search indexes                                  │
│  - Category and tag indexes                                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Template Storage**: Templates stored in MongoDB with full content, structure, and metadata
2. **Search/Filter**: Fast indexed searches by degree, field, purpose, tags
3. **Personalization**: Variable substitution with user data
4. **AI Enhancement**: Google Gemini integration for advanced customization
5. **Recommendation**: Intelligent matching based on user profile

---

## Template Structure

### Core Components

Each template consists of:

1. **Metadata**
   - ID, title, description
   - Category (degree, field, purpose)
   - Word count guidelines
   - Target audience
   - Tags for searchability

2. **Structure**
   - Section-by-section breakdown
   - Word count per section
   - Tips and key elements
   - Common mistakes to avoid

3. **Content**
   - Full template text with placeholders
   - Section-separated content
   - Variable definitions
   - Alternative intros/conclusions

4. **Guidance**
   - Success examples
   - Customization guide
   - Field-specific terminology
   - Faculty mention tips

### Template Categories

**By Degree:**
- PhD
- Masters
- Undergraduate
- MBA
- Post-doctoral

**By Field:**
- Computer Science
- Engineering (various types)
- Biology
- Physics
- Business/MBA
- Data Science
- Humanities
- Social Sciences
- Design

**By Purpose:**
- Research-focused
- Professional development
- Career change
- Industry to academia
- Career advancement
- Entrepreneurship
- First-gen student
- International student
- Gap year explanation

---

## API Reference

### Base URL
```
http://localhost:8000/api/v1/sop-templates
```

### Endpoints

#### 1. List Templates
```http
GET /api/v1/sop-templates/?skip=0&limit=50
```

**Response:**
```json
[
  {
    "id": "phd_cs_research_focused_001",
    "title": "PhD Computer Science - Research Focused",
    "category": {
      "degree": "PhD",
      "field": "Computer Science",
      "purpose": "Research-focused"
    },
    "word_count_target": 1000,
    "success_rate": 0.85,
    "usage_count": 127
  }
]
```

#### 2. Get Specific Template
```http
GET /api/v1/sop-templates/{template_id}
```

**Response:** Full template object with all details

#### 3. Search Templates
```http
POST /api/v1/sop-templates/search
Content-Type: application/json

{
  "filters": {
    "degree": "PhD",
    "field": "Computer Science",
    "purpose": "Research-focused",
    "word_count_min": 900,
    "word_count_max": 1100,
    "tags": ["Research", "Publications"]
  },
  "query": "machine learning research",
  "sort_by": "success_rate",
  "limit": 10,
  "offset": 0
}
```

**Response:**
```json
{
  "templates": [...],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

#### 4. Personalize Template
```http
POST /api/v1/sop-templates/{template_id}/personalize
Content-Type: application/json

{
  "template_id": "phd_cs_research_focused_001",
  "personalization_data": {
    "name": "John Doe",
    "university": "Stanford University",
    "program": "PhD Computer Science",
    "department": "Computer Science",
    "faculty_names": ["Dr. Jane Smith", "Dr. Bob Johnson"],
    "research_interests": ["machine learning", "computer vision"],
    "background_summary": "3 years of research experience at MIT",
    "career_goals": "Become a research scientist in AI",
    "publications": ["CVPR 2023", "NeurIPS 2022"],
    "custom_variables": {
      "research_area": "deep learning for medical imaging",
      "num_publications": "5",
      "institution": "MIT",
      "project": "automated diagnosis systems",
      "advisor": "Dr. Alice Wang"
    }
  }
}
```

**Response:**
```json
{
  "template_id": "phd_cs_research_focused_001",
  "personalized_content": "Full SOP with all variables replaced...",
  "sections": {
    "Introduction": "...",
    "Research Experience": "...",
    "Research Interests": "...",
    "Program Fit": "...",
    "Conclusion": "..."
  },
  "word_count": 1024,
  "variables_used": {
    "{{name}}": "John Doe",
    "{{university}}": "Stanford University",
    ...
  },
  "suggestions": [
    "Content is within target range",
    "Consider mentioning specific faculty research papers",
    "You have 5 publications - highlight them in research section"
  ]
}
```

#### 5. AI-Powered Customization
```http
POST /api/v1/sop-templates/{template_id}/customize
Content-Type: application/json

{
  "template_id": "phd_cs_research_focused_001",
  "personalization_data": { ... },
  "customization_instructions": "Make the tone more confident and emphasize research impact",
  "enhance_sections": ["Research Experience", "Research Interests"],
  "tone_adjustment": "more confident",
  "focus_areas": ["publications", "research methodology", "collaboration"]
}
```

**Response:**
```json
{
  "template_id": "phd_cs_research_focused_001",
  "original_content": "...",
  "customized_content": "AI-enhanced SOP...",
  "sections": { ... },
  "word_count": 1056,
  "changes_made": [
    "Enhanced research discussion with more specific details",
    "Added more confident language throughout",
    "Strengthened connections between past work and future goals",
    "Improved faculty research mentions with specific papers"
  ],
  "improvement_suggestions": [
    "Review all faculty mentions for accuracy",
    "Consider adding more quantitative results",
    "Proofread for consistency"
  ]
}
```

#### 6. Get Recommendations
```http
POST /api/v1/sop-templates/recommendations
Content-Type: application/json

{
  "user_profile": {
    "name": "Jane Doe",
    "university": "MIT",
    "program": "PhD CS",
    "research_interests": ["machine learning", "robotics"],
    "background_summary": "MS in CS, 2 years industry experience"
  },
  "degree": "PhD",
  "field": "Computer Science",
  "purpose": "Research-focused",
  "preferences": {
    "prioritize_research": true,
    "include_industry_experience": true
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "template": { ... },
      "relevance_score": 0.92,
      "match_reasons": [
        "Matches 3 research interests",
        "High success rate (0.85)",
        "Research-focused",
        "Suitable for industry-to-PhD transitions"
      ]
    },
    {
      "template": { ... },
      "relevance_score": 0.78,
      "match_reasons": [ ... ]
    }
  ],
  "total": 2
}
```

#### 7. Mix Sections from Multiple Templates
```http
POST /api/v1/sop-templates/mix-sections
Content-Type: application/json

{
  "section_selections": {
    "Introduction": "phd_cs_research_focused_001",
    "Research Experience": "phd_cs_industry_to_academia_002",
    "Research Interests": "phd_cs_research_focused_001",
    "Program Fit": "phd_cs_research_focused_001"
  },
  "personalization_data": { ... },
  "transitions": true
}
```

**Response:**
```json
{
  "mixed_content": "Complete SOP with sections from different templates...",
  "sections": { ... },
  "source_templates": {
    "Introduction": "phd_cs_research_focused_001",
    "Research Experience": "phd_cs_industry_to_academia_002",
    ...
  },
  "word_count": 1042
}
```

#### 8. Adjust Tone
```http
POST /api/v1/sop-templates/adjust-tone
Content-Type: application/json

{
  "content": "Original SOP content...",
  "current_tone": "Formal",
  "target_tone": "Confident",
  "section_type": "Introduction"
}
```

#### 9. Enhance Section
```http
POST /api/v1/sop-templates/enhance-section
Content-Type: application/json

{
  "content": "Section content...",
  "section_type": "Research Experience",
  "enhancement_type": "add_more_detail",
  "context": {
    "publications": ["CVPR 2023", "NeurIPS 2022"],
    "research_area": "computer vision"
  }
}
```

#### 10. Admin - Create Template
```http
POST /api/v1/sop-templates/
Content-Type: application/json

{
  "title": "New Template",
  "description": "Template description",
  "category": { ... },
  "word_count_min": 800,
  "word_count_max": 1000,
  "word_count_target": 900,
  "structure": [ ... ],
  "content": { ... },
  "tone": ["Formal", "Confident"],
  "target_audience": "...",
  "tags": [ ... ]
}
```

#### 11. Admin - Update Template
```http
PATCH /api/v1/sop-templates/{template_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "success_rate": 0.88,
  "tags": ["Updated", "Tags"]
}
```

#### 12. Admin - Delete Template
```http
DELETE /api/v1/sop-templates/{template_id}
```

#### 13. Get Template Statistics
```http
GET /api/v1/sop-templates/{template_id}/statistics
```

#### 14. Get Bulk Statistics
```http
GET /api/v1/sop-templates/statistics/bulk
```

**Response:**
```json
{
  "total_templates": 20,
  "total_usage": 1543,
  "average_success_rate": 0.81,
  "most_popular_templates": [ ... ],
  "templates_by_degree": {
    "PhD": 8,
    "Masters": 7,
    "Undergraduate": 3,
    "MBA": 2
  },
  "templates_by_field": { ... },
  "templates_by_purpose": { ... }
}
```

---

## Usage Examples

### Example 1: Find and Personalize PhD CS Template

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/sop-templates"

# 1. Search for suitable template
search_response = requests.post(f"{BASE_URL}/search", json={
    "filters": {
        "degree": "PhD",
        "field": "Computer Science",
        "purpose": "Research-focused"
    },
    "sort_by": "success_rate",
    "limit": 5
})

templates = search_response.json()["templates"]
best_template = templates[0]  # Highest success rate

# 2. Personalize the template
personalize_response = requests.post(
    f"{BASE_URL}/{best_template['id']}/personalize",
    json={
        "personalization_data": {
            "name": "John Doe",
            "university": "Stanford University",
            "program": "PhD Computer Science",
            "faculty_names": ["Dr. Jane Smith", "Dr. Bob Johnson"],
            "research_interests": ["machine learning", "computer vision"],
            "custom_variables": {
                "research_area": "deep learning",
                "num_publications": "5",
                "institution": "MIT",
                "project": "neural networks",
                "advisor": "Dr. Alice Wang"
            }
        }
    }
)

result = personalize_response.json()
print(f"Personalized SOP ({result['word_count']} words):")
print(result["personalized_content"])
print(f"\nSuggestions: {result['suggestions']}")
```

### Example 2: Get AI-Customized SOP

```python
# After personalizing, enhance with AI
customize_response = requests.post(
    f"{BASE_URL}/{best_template['id']}/customize",
    json={
        "personalization_data": { ... },
        "customization_instructions": "Make tone more confident, emphasize research impact and publications",
        "enhance_sections": ["Research Experience", "Research Interests"],
        "focus_areas": ["publications", "methodology", "impact"]
    }
)

customized = customize_response.json()
print("AI-Enhanced SOP:")
print(customized["customized_content"])
print(f"\nChanges made: {customized['changes_made']}")
```

### Example 3: Mix Sections from Multiple Templates

```python
# Use intro from one template, research section from another
mix_response = requests.post(
    f"{BASE_URL}/mix-sections",
    json={
        "section_selections": {
            "Introduction": "phd_cs_research_focused_001",
            "Research Experience": "phd_cs_industry_to_academia_002",
            "Research Interests": "phd_cs_research_focused_001",
            "Program Fit": "phd_cs_research_focused_001"
        },
        "personalization_data": { ... },
        "transitions": True  # AI generates smooth transitions
    }
)

mixed = mix_response.json()
print("Hybrid SOP:")
print(mixed["mixed_content"])
```

---

## Template Catalog

### Available Templates (10 shown, 20+ total)

1. **PhD Computer Science - Research Focused** (`phd_cs_research_focused_001`)
   - Target: PhD CS applicants with strong research background, 2+ publications
   - Success Rate: 85%
   - Word Count: 900-1100 words

2. **PhD Computer Science - Industry to Academia** (`phd_cs_industry_to_academia_002`)
   - Target: Industry professionals (3-5+ years) transitioning to PhD
   - Success Rate: 78%
   - Word Count: 950-1150 words

3. **Masters Computer Science - Career Advancement** (`masters_cs_career_advancement_003`)
   - Target: Working professionals seeking MS for career growth
   - Success Rate: 82%
   - Word Count: 700-900 words

4. **Masters Computer Science - Career Change** (`masters_cs_career_change_004`)
   - Target: Career changers from non-CS backgrounds
   - Success Rate: 75%
   - Word Count: 750-950 words

5. **MBA - Technology Industry** (`mba_tech_industry_005`)
   - Target: Tech professionals seeking MBA for leadership roles
   - Success Rate: 80%
   - Word Count: 800-1000 words

6. **Undergraduate CS - International Student** (`undergrad_cs_international_006`)
   - Target: International students applying to US undergraduate CS programs
   - Success Rate: 72%
   - Word Count: 500-700 words

7. **Masters Data Science - Technical Focus** (`masters_data_science_007`)
   - Target: Professionals with quantitative background seeking DS specialization
   - Success Rate: 84%
   - Word Count: 750-950 words

8. **PhD Engineering - Computational** (`phd_engineering_computational_008`)
   - Target: Engineering PhD applicants focused on computational methods
   - Success Rate: 81%
   - Word Count: 950-1150 words

9. **PhD Biology - Molecular** (`phd_biology_molecular_009`)
   - Target: Biology PhD applicants with wet lab research experience
   - Success Rate: 79%
   - Word Count: 900-1100 words

10. **Post-doctoral - STEM** (`postdoc_stem_010`)
    - Target: PhD graduates seeking postdoc positions in STEM
    - Success Rate: 83%
    - Word Count: 800-1000 words

---

## Customization Guide

### Variable Substitution

Templates use `{{variable_name}}` placeholders that get replaced with your data:

**Standard Variables:**
- `{{name}}` - Your full name
- `{{university}}` - Target university
- `{{program}}` - Program name
- `{{department}}` - Department name
- `{{faculty}}` - Comma-separated faculty names
- `{{faculty_1}}`, `{{faculty_2}}` - Individual faculty
- `{{research_interests}}` - Comma-separated interests
- `{{background}}` - Background summary
- `{{goals}}` - Career goals

**Custom Variables:**
You can add any custom variables via `custom_variables` field:
```json
{
  "custom_variables": {
    "research_area": "machine learning",
    "num_publications": "5",
    "institution": "MIT",
    "project": "neural networks",
    "advisor": "Dr. Smith"
  }
}
```

### Section Enhancement Types

When using `/enhance-section`:

1. **add_more_detail** - Expand with specific details and examples
2. **make_more_specific** - Replace general statements with specifics
3. **add_examples** - Include concrete examples
4. **improve_flow** - Better transitions and logical flow
5. **strengthen_impact** - More impactful language

### Tone Options

Available tones for adjustment:

- **Formal** - Academic, professional language
- **Confident** - Strong, assertive statements
- **Humble** - Modest, learning-focused
- **Passionate** - Enthusiastic, expressive
- **Analytical** - Logical, data-driven
- **Narrative** - Storytelling approach
- **Balanced** - Mix of confidence and humility

---

## Best Practices

### 1. Template Selection

✅ **DO:**
- Use search filters to narrow options
- Check success rate and usage count
- Read template description and target audience
- Get recommendations based on your profile

❌ **DON'T:**
- Pick template based only on title
- Ignore word count guidelines
- Use template for wrong degree/field

### 2. Personalization

✅ **DO:**
- Provide complete and accurate information
- Use specific details (numbers, names, papers)
- Research faculty thoroughly before mentioning
- Proofread variable substitutions

❌ **DON'T:**
- Leave generic placeholder text
- Mention faculty you haven't researched
- Exceed target word count significantly
- Copy-paste without customization

### 3. AI Customization

✅ **DO:**
- Provide clear customization instructions
- Review AI changes carefully
- Use for enhancement, not wholesale rewriting
- Fact-check all AI-generated content

❌ **DON'T:**
- Blindly trust AI output
- Let AI invent research you haven't done
- Use AI to inflate accomplishments
- Skip human review

### 4. Quality Control

✅ **DO:**
- Have mentors/advisors review
- Check for consistency across sections
- Verify all facts and names
- Proofread multiple times
- Ensure authentic voice

❌ **DON'T:**
- Submit without review
- Use obviously templated language
- Include unreplaced variables
- Ignore suggestions from the system

---

## Troubleshooting

### Issue: Variables not replaced

**Cause:** Variable names don't match or missing from personalization_data

**Solution:**
```python
# Check template variables
template = requests.get(f"{BASE_URL}/{template_id}").json()
required_vars = [v["name"] for v in template["content"]["variables"] if v["required"]]

# Ensure all required variables in custom_variables
```

### Issue: Word count too high/low

**Cause:** Template doesn't fit your content volume

**Solution:**
- Use `sections_to_include` parameter to exclude sections
- Try different template with matching word count
- Use `target_word_count` parameter
- Mix sections from different templates

### Issue: AI customization fails

**Cause:** Missing Google API key or rate limiting

**Solution:**
- Check `GOOGLE_API_KEY` environment variable
- Verify API key has Gemini access
- Use basic personalization if AI unavailable
- Retry with rate limiting backoff

### Issue: Generic-sounding output

**Cause:** Insufficient personalization data

**Solution:**
- Provide more specific custom variables
- Use AI customization with detailed instructions
- Manually review and add personal touches
- Use section enhancement on weak sections

---

## Initialization

### Setup Database

```bash
# Navigate to AI service directory
cd ai_service

# Initialize templates in MongoDB
python scripts/init_sop_templates.py init

# List all templates
python scripts/init_sop_templates.py list

# Delete all templates (if needed)
python scripts/init_sop_templates.py delete
```

### Environment Variables

Required in `ai_service/.env`:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Google AI (for customization features)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-1.5-flash
```

---

## Advanced Features

### Template Versioning

Templates include version numbers that auto-increment on updates:
- Version tracking for changes
- Rollback capability (future feature)
- Change history (future feature)

### Success Rate Tracking

Templates track usage and success rates:
- Update via admin endpoints
- Influences recommendations
- Helps identify best templates

### Usage Analytics

Track template usage:
- Usage count auto-increments
- Popular templates surfaced
- Helps content curation

---

## Future Enhancements

Planned features:

1. **User Feedback System**
   - Rate templates
   - Submit improvements
   - Community contributions

2. **Version History**
   - Track all template changes
   - Rollback to previous versions
   - Compare versions

3. **Collaborative Editing**
   - Multiple users refine templates
   - Comment and suggest changes
   - Review workflow

4. **Advanced AI Features**
   - Multi-model support (GPT-4, Claude)
   - Style transfer between SOPs
   - Plagiarism detection
   - Readability scoring

5. **Integration Features**
   - Export to Word/PDF with formatting
   - Grammar checking integration
   - Citation management
   - Application tracking integration

---

## Support

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Check logs in `logs/ai_service.log`
- Ensure MongoDB connection
- Verify environment variables

---

## License

Part of EduLen AI Service - Internal Use Only
