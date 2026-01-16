"""
Document Builder Prompts Configuration

This module contains all prompts used by the Document Builder tools.
Edit prompts here to modify AI behavior without changing code logic.

Structure:
- SYSTEM_PROMPTS: System-level prompts defining agent behavior
- INTENT_PROMPTS: Prompts for understanding user intent
- COLLECTION_PROMPTS: Prompts for collecting information
- GENERATION_PROMPTS: Prompts for generating documents
- REFINEMENT_PROMPTS: Prompts for refining drafts
"""

from typing import Dict, Any

# ==============================================================================
# SYSTEM PROMPTS
# ==============================================================================

DOCUMENT_BUILDER_SYSTEM_PROMPT = """
You are an expert Document Builder AI assistant specialized in creating professional 
academic and career documents for study abroad applications. You help users create:

1. Statement of Purpose (SOP)
2. Letter of Recommendation (LOR)
3. Curriculum Vitae (CV)
4. Resume

Your approach:
- Be conversational and supportive
- Ask clarifying questions when information is missing
- Never invent facts about the user
- Guide users step-by-step through the document creation process
- Provide actionable suggestions and improvements
- Maintain a professional yet friendly tone

You have access to:
- User's profile information (if previously provided)
- Document templates and examples
- Style guidelines for different universities/countries

Remember: Quality over speed. A well-crafted document takes proper information gathering.
"""

# ==============================================================================
# SOP PROMPTS
# ==============================================================================

SOP_SYSTEM_PROMPT = """
You are an expert Statement of Purpose (SOP) writer with experience in academic admissions.

Your role:
1. Understand the user's background, goals, and target program
2. Collect necessary information through natural conversation
3. Generate compelling, authentic SOPs that highlight the applicant's strengths
4. Help refine and improve drafts based on feedback

Core principles:
- Every SOP should be unique and personal to the applicant
- Never fabricate experiences, achievements, or dates
- Balance showing accomplishments with humility
- Connect past experiences to future goals
- Tailor content to specific programs and universities
- Use concrete examples over generic statements

Structure for SOPs:
1. Hook/Introduction - Engaging opening that shows motivation
2. Academic Background - Relevant education and achievements
3. Experience & Projects - Research, work, or projects relevant to the field
4. Why This Program - Specific reasons for choosing this program/university
5. Goals & Conclusion - Clear career goals and how the program helps achieve them
"""

SOP_INTENT_ANALYSIS_PROMPT = """
Analyze the user's message to understand their SOP-related intent.

User message: {message}
Current session state: {session_state}

Determine:
1. What is the user trying to do? (start new SOP, provide information, request changes, ask question)
2. What information can be extracted? (university, program, background details, etc.)
3. What information is still missing for a complete SOP?
4. What should be the next step in the conversation?

Respond in JSON format:
{{
    "intent": "start_sop|provide_info|request_change|ask_question|confirm|other",
    "extracted_info": {{
        "target_university": null or "string",
        "target_program": null or "string",
        "degree_level": null or "string",
        "background_info": null or "string",
        "experience_info": null or "string",
        "goals_info": null or "string",
        "other_info": {{}}
    }},
    "missing_critical_fields": ["field1", "field2"],
    "next_action": "ask_question|collect_info|generate_draft|refine_draft|complete",
    "next_question_topic": null or "string describing what to ask next"
}}
"""

SOP_COLLECTION_PROMPTS = {
    "initial_greeting": """
Great! Let's create your Statement of Purpose{university_context}.

To write a compelling SOP that truly represents you, I'll need to learn about your journey. 
Let's start with the basics.

**What program are you applying to, and why does this field excite you?**
(Feel free to share as much as you'd like - the more context, the better I can help!)
""",

    "target_university_followup": """
That's a great goal. To tailor your SOP properly, I also need to know **where** you're applying.

**Which universities or specific programs are you targeting for this SOP?**
You can list more than one, and mention any particular specializations (e.g., "MS in Cybersecurity at Stanford").
""",

    "background": """
Thanks for sharing that! Now let's talk about your academic foundation.

**Tell me about your educational background:**
- Where did you study? (University, major, graduation year)
- What was your academic performance? (GPA, class rank, honors)
- Which courses were most relevant or impactful for your goals?

Don't worry about formatting - just share naturally, and I'll help organize it.
""",

    "experience": """
Excellent background! Now let's dive into your hands-on experience.

**What relevant experience do you have?**
This could include:
- Research projects (even coursework research counts!)
- Internships or work experience
- Personal projects or open-source contributions
- Publications or presentations
- Competitions or hackathons

Share the details - what you did, what you learned, and any outcomes.
""",

    "research_deep_dive": """
You mentioned research experience - that's great for your application!

**Can you tell me more about your research?**
- What problem were you trying to solve?
- What was your specific role and contribution?
- What methods or technologies did you use?
- What were the results or findings?
- Did you face any challenges? How did you overcome them?
""",

    "why_program": """
Now let's connect your experience to your target program.

**Why specifically {program} at {university}?**
Think about:
- What specific aspects of the program attract you? (courses, research areas, labs)
- Are there particular faculty members whose work interests you?
- How does this program align with your background and goals?
- What can you contribute to this program?
""",

    "goals": """
Let's talk about your future aspirations.

**What are your goals after completing this program?**
- Short-term goals (1-3 years after graduation)
- Long-term career vision
- How does this program specifically help you achieve these goals?
- What impact do you hope to make in your field?
""",

    "personal_story": """
Almost there! Let's add a personal touch.

**Is there anything unique about your journey you'd like to highlight?**
This could be:
- A defining moment that shaped your interest
- Challenges you've overcome
- A unique perspective you bring
- Personal values that drive your academic interests

This helps make your SOP stand out from others with similar backgrounds.
""",

    "final_check": """
I have all the information I need! Before I generate your SOP draft, let me confirm:

**Target Program:** {program}
**University:** {university}
**Degree:** {degree_level}

**Key highlights I'll include:**
{highlights_summary}

**Tone preference:** {tone}
**Word limit:** {word_limit}

Would you like me to proceed with generating your SOP draft, or would you like to add/modify anything?
"""
}

SOP_GENERATION_PROMPT = """
Generate a Statement of Purpose based on the following information:

**Target Program:** {program}
**Target University:** {university}
**Country:** {country}
**Degree Level:** {degree_level}

**Applicant Profile:**
- About: {about}
- Educational Background: {background}
- Relevant Experience: {experience}
- Research (if any): {research}
- Career Goals: {goals}
- Personal Notes: {personal_notes}

**Style Requirements:**
- Tone: {tone} (confident/humble/enthusiastic/balanced)
- Word Limit: {word_limit} words
- Special Instructions: {special_instructions}

The SOP should be written as a continuous essay with **no section headings or subheadings**.
Use clear paragraphs only, similar to strong real-world SOP examples.
The final essay should be close to the requested word limit and **must not be very short**
– aim to be within about ±10% of the word limit (for 1000 words, target roughly 900–1100 words).

**Context from the applicant's uploaded documents (CV, transcripts, etc.):**
{attachment_context}

**Style Guidance from Successful SOPs:**
{style_context}

IMPORTANT: Use both the uploaded document context and the style context above to inform your writing style and content:
- Match the sentence structure patterns (average sentence length, complexity)
- Adopt the tone indicators observed in successful examples
- Reference the example excerpts to understand what works well for this country/field

**Output Requirements:**
Generate a complete SOP in the following JSON format:
{{
    "title": "Statement of Purpose for [Program] at [University]",
    "sections": [
        {{"heading": "Body", "content_markdown": "Full SOP content as paragraphs (may mirror plain_text)"}}
    ],
    "plain_text": "Complete SOP as continuous text with no headings, only paragraphs",
    "word_count": integer,
    "key_strengths_highlighted": ["strength1", "strength2", ...],
    "suggestions_for_improvement": ["suggestion1", "suggestion2", ...]
}}

Remember:
- Use only factual information provided
- Use first-person voice ("I")
- Be specific and concrete
- Show, don't just tell
- Connect experiences to goals
- Make it unique to this applicant
- Apply the writing style patterns from the style context
"""

SOP_REFINEMENT_PROMPT = """
Refine the SOP section based on user feedback.

**Current Section:**
{current_section}

**User Feedback:**
{user_feedback}

**Context:**
- Target Program: {program}
- Target University: {university}
- Overall SOP Tone: {tone}

**Instructions:**
1. Address the user's specific feedback
2. Maintain consistency with the rest of the SOP
3. Keep the same approximate length unless asked to change
4. Preserve factual accuracy - don't add new claims

Return the refined section in the same format as the original.
"""

# ==============================================================================
# LOR PROMPTS
# ==============================================================================

LOR_SYSTEM_PROMPT = """
You are an expert Letter of Recommendation (LOR) writer who helps recommenders craft 
compelling letters for their students/colleagues.

Your role:
1. Gather information about the recommender-student relationship
2. Understand the student's achievements and qualities
3. Generate authentic, persuasive letters that support the application
4. Help customize letters for specific programs

Core principles:
- The letter should read as if written by the recommender
- Include specific examples and anecdotes
- Balance praise with authenticity
- Tailor strength of recommendation appropriately
- Address specific program requirements when known
- Use formal academic/professional language
"""

LOR_INTENT_ANALYSIS_PROMPT = """
Analyze the user's message to understand their LOR-related intent.

User message: {message}
Current session state: {session_state}

Determine:
1. Who is providing information? (recommender or student on behalf)
2. What information can be extracted?
3. What's the relationship context?
4. What should be the next step?

Respond in JSON format:
{{
    "intent": "start_lor|provide_info|request_change|ask_question|confirm|other",
    "perspective": "recommender|student|unknown",
    "extracted_info": {{
        "recommender_name": null or "string",
        "recommender_title": null or "string",
        "student_name": null or "string",
        "relationship": null or "string",
        "duration": null or "string",
        "skills_observed": null or [],
        "achievements": null or [],
        "target_program": null or "string",
        "target_university": null or "string"
    }},
    "missing_critical_fields": ["field1", "field2"],
    "next_action": "ask_question|collect_info|generate_draft|refine_draft|complete"
}}
"""

LOR_COLLECTION_PROMPTS = {
    "initial_greeting": """
I'll help you create a Letter of Recommendation{context}.

First, let me understand the context:
**Are you the recommender writing the letter, or are you the student preparing a draft for your recommender?**

This helps me ask the right questions and write in the appropriate voice.
""",

    "recommender_info": """
Let's start with your (the recommender's) information:

**Please provide:**
- Your full name and title
- Your organization/institution
- Your relationship to the student (e.g., professor, supervisor, mentor)
- How long have you known the student?
- In what capacity did you work together?
""",

    "student_info": """
Now, tell me about the student you're recommending:

**Student Details:**
- Student's full name
- Their role when you knew them (student, intern, research assistant, etc.)
- Duration of association
- Target program they're applying to
- Target university (if known)
""",

    "observations": """
This is the heart of the recommendation. Please share your observations:

**What specific skills have you observed?**
(technical skills, soft skills, research abilities, etc.)

**What achievements or contributions stand out?**
(projects completed, problems solved, initiatives taken)

**Can you share a specific example or anecdote that demonstrates their abilities?**

**What character traits make them suitable for graduate study?**
(work ethic, intellectual curiosity, collaboration, leadership, etc.)
""",

    "comparison": """
To strengthen the recommendation:

**How does this student compare to others you've taught/supervised?**
(Top 5%? Top 10%? Among the best you've seen?)

**What makes them unique or memorable?**

**Are there any areas of growth you've witnessed?**
""",

    "strength_level": """
**How strong would you like this recommendation to be?**

1. **Strong** - Enthusiastic endorsement, highest praise
2. **Moderate** - Positive recommendation with balanced assessment
3. **Standard** - Professional recommendation without excessive superlatives

Most successful applications have strong recommendations. Choose based on your honest assessment.
""",

    "final_check": """
I have the information needed for the LOR. Let me confirm:

**Recommender:** {recommender_name}, {recommender_title}
**Student:** {student_name}
**Relationship:** {relationship} for {duration}
**Target:** {program} at {university}

**Key points to highlight:**
{highlights_summary}

**Recommendation strength:** {strength}

Ready to generate the letter?
"""
}

LOR_GENERATION_PROMPT = """
Generate a formal Letter of Recommendation based on the following information:

**Recommender:**
- Name: {recommender_name}
- Title/Position: {recommender_title}
- Organization: {organization}
- Relationship to Student: {relationship}
- Duration of Association: {duration}

**Student:**
- Name: {student_name}
- Role: {student_role}
- Duration Under Supervision: {supervision_duration}

**Observations:**
- Skills Observed: {skills_observed}
- Key Achievements: {achievements}
- Character Traits: {character_traits}
- Comparison to Peers: {peer_comparison}
- Specific Examples: {examples}

**Target Application:**
- Program: {target_program}
- University: {target_university}
- Country: {target_country}

**Style:**
- Tone: {tone}
- Recommendation Strength: {strength}
- Word Limit: {word_limit}

The letter should follow a professional recommendation-letter format like the
examples used in admissions: date and addresses (if appropriate), greeting
("Dear Admissions Committee," or similar), 2–4 well-developed body
paragraphs, a closing paragraph, and a signature/closing block.

Do **not** insert internal section headings such as "Introduction" or
"Academic Performance" inside the letter body. It should read as continuous
prose, not as a report with titled sections.

Aim to be close to the requested word limit and avoid very short drafts:
target roughly ±15% of the word limit (for 800 words, about 680–920 words).

**Style Guidance from Successful LORs:**
{style_context}

IMPORTANT: Use the style context above to inform your writing style:
- Match the sentence structure patterns (average sentence length, complexity)
- Use similar formatting and paragraph organization
- Adopt the tone indicators observed in successful examples
- Maintain the formal academic voice while incorporating effective stylistic elements

**Output Requirements:**
Generate a complete LOR in the following JSON format:
{{
    "title": "Letter of Recommendation for [Student Name]",
    "sections": [
        {{"heading": "Body", "content_markdown": "Full letter content as paragraphs (may mirror plain_text)"}}
    ],
    "plain_text": "Complete letter as continuous text with greeting, body paragraphs, closing, and signature",
    "word_count": integer
}}

Remember:
- Write as if you ARE the recommender
- Use formal academic tone
- Include specific examples
- Match the recommendation strength to the requested level
- End with clear endorsement appropriate to the strength level
- Apply the writing style patterns from the style context
"""

# ==============================================================================
# CONVERSATION PROMPTS
# ==============================================================================

CONVERSATION_RESPONSE_PROMPT = """
Generate a conversational response for the document builder.

**Current Context:**
- Document Type: {document_type}
- Session State: {session_state}
- Collection Progress: {progress}%
- Next Required Information: {next_info_needed}

**User's Last Message:**
{user_message}

**Extracted Information from this message:**
{extracted_info}

**Instructions:**
1. Acknowledge what the user shared (if they provided information)
2. Store/validate the information
3. Ask for the next piece of missing information OR
4. Confirm readiness to generate if all info is collected

Keep the response:
- Conversational and supportive
- Not too long (2-4 paragraphs max)
- Focused on one topic at a time
- Including specific follow-up questions

Response:
"""

CLARIFICATION_PROMPT = """
The user's response needs clarification.

**What we asked about:** {asked_topic}
**User's response:** {user_response}
**What's unclear:** {unclear_aspect}

Generate a polite clarification request that:
1. Acknowledges what they said
2. Explains what additional detail would help
3. Gives an example if helpful

Keep it brief and friendly.
"""

ERROR_RECOVERY_PROMPT = """
Something went wrong in the conversation. Help recover gracefully.

**Error Type:** {error_type}
**Context:** {context}

Generate a response that:
1. Apologizes for the confusion
2. Summarizes what we know so far
3. Asks a clear question to get back on track

Keep it positive and reassuring.
"""

# ==============================================================================
# RESUME PROMPTS
# ==============================================================================

RESUME_SYSTEM_PROMPT = """
You are an expert Resume writer with experience in helping professionals land their target roles.

Your role:
1. Understand the user's career history, skills, and target role
2. Collect necessary information through natural conversation
3. Generate impactful, ATS-friendly resumes that highlight achievements
4. Help refine and improve drafts based on feedback

Core principles:
- Every resume should be tailored to the target role
- Use action verbs and quantifiable achievements
- Keep format clean and ATS-compatible
- Prioritize recent and relevant experience
- Never fabricate skills, experiences, or achievements
- Use industry-standard formatting

Structure for Resumes:
1. Contact Information - Name, email, phone, LinkedIn
2. Professional Summary (optional but recommended for experienced professionals)
3. Work Experience - Most recent first, with bullet points showing impact
4. Education - Degrees, institutions, dates
5. Skills - Technical and soft skills relevant to target role
6. Additional Sections - Certifications, projects, languages, awards (as relevant)
"""

RESUME_INTENT_ANALYSIS_PROMPT = """
Analyze the user's message to understand their resume-related intent.

User message: {message}
Current session state: {session_state}

Determine:
1. What is the user trying to do? (start new resume, provide information, request changes, ask question)
2. What information can be extracted? (role, experience, education, skills, etc.)
3. What information is still missing for a complete resume?
4. What should be the next step in the conversation?

Respond in JSON format:
{{
    "intent": "start_resume|provide_info|request_change|ask_question|confirm|other",
    "extracted_info": {{
        "full_name": null or "string",
        "target_role": null or "string",
        "work_experience": null or "string",
        "education": null or "string",
        "skills": null or "string",
        "other_info": {{}}
    }},
    "missing_critical_fields": ["field1", "field2"],
    "next_action": "ask_question|collect_info|generate_draft|refine_draft|complete",
    "next_question_topic": null or "topic_key"
}}
"""

RESUME_COLLECTION_PROMPTS = {
    "initial_greeting": """Got it. I can build your resume from what you share here.

What role are you targeting, and do you want a 1-2 line summary included?

When you're ready, write "Generate Resume" and I will generate it.""",
    
    "target_role": "What role or position are you targeting with this resume?",
    
    "full_name": "What's your full name as you want it to appear on the resume?",
    
    "contact_info": "Please share your contact information (email, phone, LinkedIn profile).",
    
    "professional_summary": """Would you like to include a professional summary at the top of your resume? 

If yes, briefly describe your professional background and key strengths.""",
    
    "work_experience": """Tell me about your work experience. For each role, please include:
- Company name
- Job title
- Duration (start and end dates)
- Key responsibilities and achievements (use numbers where possible)

Start with your most recent position.""",
    
    "education": """What's your educational background? Please include:
- Degree/Certification
- Institution name
- Graduation year (or expected)
- GPA (if strong and recent)
- Relevant coursework (optional)""",
    
    "skills": """What are your key skills? Please include:
- Technical skills (programming languages, tools, software)
- Soft skills (leadership, communication, problem-solving)
- Industry-specific skills

Focus on skills relevant to your target role.""",
    
    "certifications": "Do you have any professional certifications or licenses? If so, please list them.",
    
    "projects": "Would you like to highlight any significant projects? If so, please describe them briefly.",
    
    "languages": "Do you speak any languages other than English? Please list them with proficiency levels.",
    
    "awards": "Have you received any awards, honors, or recognition? Please share them.",
    
    "final_check": """Great! I have enough information to create your resume for the **{target_role}** role.

Before I generate it, is there anything else you'd like to add or emphasize?

When ready, say "Generate Resume" and I'll create it for you.""",
}

RESUME_GENERATION_PROMPT = """
Generate a professional resume based on the following information:

**Target Role:** {target_role}
**Full Name:** {full_name}
**Contact Information:** {contact_info}

**Professional Summary:** {professional_summary}

**Work Experience:**
{work_experience}

**Education:**
{education}

**Skills:**
{skills}

**Additional Information:**
Certifications: {certifications}
Projects: {projects}
Languages: {languages}
Awards: {awards}

**Format Preference:** {format_preference}
**Special Instructions:** {special_instructions}

Create a well-structured, ATS-friendly resume with:
1. Clear section headings
2. Bullet points for work experience using action verbs
3. Quantifiable achievements where possible
4. Consistent formatting
5. Appropriate length (1-2 pages based on experience level)

Return the resume in markdown format with clear sections.
"""

RESUME_REFINEMENT_PROMPT = """
Refine the following resume section based on user feedback.

**Section:** {section_name}
**Current Content:**
{current_content}

**User Feedback:**
{feedback}

**Instructions:**
- Address the user's feedback specifically
- Maintain professional tone and formatting
- Use action verbs and quantifiable achievements
- Ensure ATS compatibility
- Keep the section length appropriate

Return the refined section in markdown format.
"""

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def get_sop_prompt(prompt_key: str, **kwargs) -> str:
    """Get an SOP prompt with variables filled in."""
    if prompt_key in SOP_COLLECTION_PROMPTS:
        return SOP_COLLECTION_PROMPTS[prompt_key].format(**kwargs)
    return ""

def get_lor_prompt(prompt_key: str, **kwargs) -> str:
    """Get a LOR prompt with variables filled in."""
    if prompt_key in LOR_COLLECTION_PROMPTS:
        return LOR_COLLECTION_PROMPTS[prompt_key].format(**kwargs)
    return ""

def get_resume_prompt(prompt_key: str, **kwargs) -> str:
    """Get a Resume prompt with variables filled in."""
    if prompt_key in RESUME_COLLECTION_PROMPTS:
        return RESUME_COLLECTION_PROMPTS[prompt_key].format(**kwargs)
    return ""

def format_generation_prompt(document_type: str, data: Dict[str, Any]) -> str:
    """Format the generation prompt with collected data."""
    if document_type == "sop":
        return SOP_GENERATION_PROMPT.format(**data)
    elif document_type == "lor":
        return LOR_GENERATION_PROMPT.format(**data)
    elif document_type == "resume" or document_type == "cv":
        return RESUME_GENERATION_PROMPT.format(**data)
    return ""
