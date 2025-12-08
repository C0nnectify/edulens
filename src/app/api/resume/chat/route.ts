import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Resume Chat API
 * Provides context-aware assistance for resume building
 */
export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // In production, integrate with OpenAI, Claude, or other AI services
    // For now, provide intelligent mock responses based on context
    const response = await generateAIResponse(message, context);

    return NextResponse.json({
      response: response.text,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response based on user message and context
 * TODO: Replace with actual AI service integration
 */
async function generateAIResponse(
  message: string,
  context: { section: string; content: any }
): Promise<{ text: string; suggestions?: string[] }> {
  const lowerMessage = message.toLowerCase();
  const section = context.section;

  // Achievement-related queries
  if (
    lowerMessage.includes('achievement') ||
    lowerMessage.includes('accomplish') ||
    lowerMessage.includes('write')
  ) {
    return {
      text: `Great question! When writing achievements, follow the STAR method:\n\n• Situation: Describe the context\n• Task: Explain your responsibility\n• Action: Detail what you did\n• Result: Quantify the impact\n\nExample: "Led a team of 5 developers to rebuild the checkout system, reducing cart abandonment by 35% and increasing revenue by $2M annually."\n\nAlways include numbers, percentages, or other metrics when possible!`,
      suggestions: ['Help me quantify this achievement', 'Review my bullet points'],
    };
  }

  // Summary improvement
  if (lowerMessage.includes('summary') || lowerMessage.includes('improve')) {
    return {
      text: `Let me help you craft a compelling professional summary! A great summary should:\n\n✓ Start with your job title and years of experience\n✓ Highlight 2-3 core competencies\n✓ Include a notable achievement with metrics\n✓ End with what you're looking for or your unique value\n\nKeep it between 150-300 characters for optimal readability.\n\nWould you like me to review your current summary?`,
      suggestions: [
        'Review my current summary',
        'Help me add metrics',
        'Make it more compelling',
      ],
    };
  }

  // ATS optimization
  if (lowerMessage.includes('ats') || lowerMessage.includes('optimize')) {
    return {
      text: `Let's optimize your resume for ATS (Applicant Tracking Systems)! Here are key tips:\n\n📌 Use standard section headings (Work Experience, Education, Skills)\n📌 Include relevant keywords from the job description\n📌 Avoid tables, images, or complex formatting\n📌 Use standard fonts (Arial, Calibri, Times New Roman)\n📌 Save as .docx or .pdf format\n📌 Include both acronyms and full terms (e.g., "AI (Artificial Intelligence)")\n\nYour current template is ATS-friendly! Focus on adding the right keywords for your target role.`,
      suggestions: [
        'Help me find missing keywords',
        'Review my formatting',
        'Optimize for a specific job',
      ],
    };
  }

  // Action verbs
  if (lowerMessage.includes('action verb') || lowerMessage.includes('powerful')) {
    return {
      text: `Excellent! Strong action verbs make your resume impactful. Here are powerful verbs by category:\n\n**Leadership:** Led, Directed, Orchestrated, Spearheaded, Pioneered\n**Achievement:** Achieved, Exceeded, Surpassed, Delivered, Accomplished\n**Improvement:** Optimized, Enhanced, Streamlined, Transformed, Revitalized\n**Technical:** Architected, Engineered, Developed, Implemented, Built\n**Teamwork:** Collaborated, Coordinated, Facilitated, Partnered, United\n\nReplace weak verbs like "responsible for" or "worked on" with these power words!`,
      suggestions: ['Review my verbs', 'Strengthen my bullets', 'More action verbs'],
    };
  }

  // Skills suggestions
  if (lowerMessage.includes('skill') || lowerMessage.includes('missing')) {
    return {
      text: `I can help you identify skills to add! Consider including:\n\n**Technical Skills:** Programming languages, frameworks, tools, platforms\n**Soft Skills:** Leadership, communication, problem-solving, teamwork\n**Industry-Specific:** Domain knowledge, certifications, specialized tools\n\nBased on common ${section} roles, consider adding:\n• Cloud platforms (AWS, Azure, GCP)\n• Project management tools\n• Data analysis tools\n• Communication & collaboration skills\n\nWhat type of role are you targeting? I can suggest more specific skills!`,
      suggestions: [
        'Suggest technical skills',
        'What soft skills should I add?',
        'Industry-specific skills',
      ],
    };
  }

  // Experience review
  if (lowerMessage.includes('experience') || lowerMessage.includes('review')) {
    return {
      text: `I'd be happy to review your experience section! When evaluating work experience, I look for:\n\n✅ Clear job title and company name\n✅ Specific dates (month/year format)\n✅ 3-5 strong bullet points per role\n✅ Quantified achievements (numbers, percentages, dollars)\n✅ Action verbs starting each bullet\n✅ Relevant skills and technologies used\n\nEach bullet should answer: "What did I do?" and "What was the impact?"\n\nShare a specific experience entry and I'll provide detailed feedback!`,
      suggestions: [
        'Review my latest role',
        'Help with bullet points',
        'Add more impact',
      ],
    };
  }

  // General help
  if (
    lowerMessage.includes('help') ||
    lowerMessage.includes('how') ||
    lowerMessage.includes('what')
  ) {
    return {
      text: `I'm here to help you create an outstanding resume! I can assist with:\n\n📝 Writing compelling achievements and bullet points\n🎯 Optimizing for ATS and specific job postings\n💪 Choosing powerful action verbs\n📊 Adding metrics and quantifying impact\n✨ Improving your professional summary\n🔍 Reviewing and providing feedback on any section\n\nWhat specific aspect of your resume would you like to work on?`,
      suggestions: [
        'Help me write achievements',
        'Optimize for ATS',
        'Review my entire resume',
      ],
    };
  }

  // Default response
  return {
    text: `That's a great question! I'm your AI Resume Assistant, and I'm here to help you create the best possible resume.\n\nI can help you with:\n• Writing impactful achievements\n• Optimizing for ATS systems\n• Improving your professional summary\n• Adding relevant keywords\n• Choosing strong action verbs\n• Reviewing and providing feedback\n\nWhat would you like to focus on?`,
    suggestions: [
      'Help me write achievements',
      'Improve my summary',
      'Optimize for ATS',
    ],
  };
}
