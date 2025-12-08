/**
 * Email Parser Service
 * Parses university emails to detect status updates and extract important information
 */

export interface ParsedEmail {
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  detectedStatus?: 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'waitlisted';
  confidence: number; // 0-1
  extractedData: {
    university?: string;
    program?: string;
    interviewDate?: string;
    decisionDate?: string;
    actionRequired?: string;
    deadlines?: Array<{ type: string; date: string }>;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

/**
 * Email Parser Service
 */
export class EmailParserService {
  // Status detection keywords with weights
  private statusKeywords = {
    submitted: {
      keywords: ['submitted', 'received', 'acknowledge', 'application received', 'thank you for applying'],
      weight: 0.8,
    },
    under_review: {
      keywords: ['under review', 'reviewing', 'being evaluated', 'in process', 'currently reviewing'],
      weight: 0.85,
    },
    interview_scheduled: {
      keywords: [
        'interview',
        'schedule interview',
        'invitation to interview',
        'interview invitation',
        'please schedule',
        'interview request',
      ],
      weight: 0.9,
    },
    accepted: {
      keywords: [
        'congratulations',
        'pleased to inform',
        'happy to inform',
        'offer of admission',
        'accepted',
        'admitted',
        'welcome to',
      ],
      weight: 0.95,
    },
    rejected: {
      keywords: [
        'unfortunately',
        'regret to inform',
        'unable to offer',
        'not selected',
        'cannot offer',
        'declined',
        'not accepted',
      ],
      weight: 0.95,
    },
    waitlisted: {
      keywords: ['waitlist', 'waiting list', 'placed on waitlist', 'alternate list', 'reserve list'],
      weight: 0.9,
    },
  };

  // Action keywords
  private actionKeywords = [
    'please submit',
    'need to',
    'required to',
    'must provide',
    'action required',
    'respond by',
    'deadline',
    'by the date',
  ];

  /**
   * Parse email and extract status information
   */
  async parseEmail(email: {
    from: string;
    subject: string;
    body: string;
    receivedAt?: Date;
  }): Promise<ParsedEmail> {
    const body = this.cleanEmailBody(email.body);
    const combinedText = `${email.subject} ${body}`.toLowerCase();

    // Detect status
    const statusDetection = this.detectStatus(combinedText);

    // Extract data
    const extractedData = {
      university: this.extractUniversity(email.from, email.subject),
      program: this.extractProgram(email.subject, body),
      interviewDate: this.extractInterviewDate(body),
      decisionDate: this.extractDecisionDate(body),
      actionRequired: this.extractActionRequired(body),
      deadlines: this.extractDeadlines(body),
    };

    // Detect sentiment
    const sentiment = this.detectSentiment(combinedText, statusDetection.status);

    // Extract keywords
    const keywords = this.extractKeywords(combinedText);

    return {
      from: email.from,
      subject: email.subject,
      body: email.body,
      receivedAt: email.receivedAt || new Date(),
      detectedStatus: statusDetection.status,
      confidence: statusDetection.confidence,
      extractedData,
      sentiment,
      keywords,
    };
  }

  /**
   * Clean email body (remove signatures, disclaimers, etc.)
   */
  private cleanEmailBody(body: string): string {
    // Remove email signatures
    let cleaned = body.replace(/^--\s*$.*/gms, '');

    // Remove common footers
    cleaned = cleaned.replace(/This email is confidential.*/gi, '');
    cleaned = cleaned.replace(/Please do not reply to this email.*/gi, '');
    cleaned = cleaned.replace(/Sent from my.*/gi, '');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Detect application status from email content
   */
  private detectStatus(text: string): {
    status?: ParsedEmail['detectedStatus'];
    confidence: number;
  } {
    let maxScore = 0;
    let detectedStatus: ParsedEmail['detectedStatus'] | undefined;

    for (const [status, config] of Object.entries(this.statusKeywords)) {
      let score = 0;

      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          score += config.weight;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        detectedStatus = status as ParsedEmail['detectedStatus'];
      }
    }

    // Normalize confidence to 0-1
    const confidence = Math.min(maxScore, 1);

    // Only return status if confidence is above threshold
    return {
      status: confidence >= 0.7 ? detectedStatus : undefined,
      confidence,
    };
  }

  /**
   * Extract university name from email
   */
  private extractUniversity(from: string, subject: string): string | undefined {
    // Extract from email domain
    const domainMatch = from.match(/@([^.]+)\./);
    if (domainMatch) {
      const domain = domainMatch[1];
      // Convert to title case
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    // Try to extract from subject
    const subjectMatch = subject.match(/from\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)*)/);
    if (subjectMatch) {
      return subjectMatch[1];
    }

    return undefined;
  }

  /**
   * Extract program name from email
   */
  private extractProgram(subject: string, body: string): string | undefined {
    const text = `${subject} ${body}`;

    // Common patterns
    const patterns = [
      /(?:MS|Master(?:'s)?|M\.S\.) (?:in|of) ([A-Za-z\s]+)/i,
      /(?:PhD|Ph\.D\.|Doctorate) (?:in|of) ([A-Za-z\s]+)/i,
      /(?:MBA|M\.B\.A\.|Master of Business Administration)/i,
      /([A-Za-z\s]+) Program/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract interview date from email
   */
  private extractInterviewDate(body: string): string | undefined {
    // Look for date patterns near "interview"
    const datePatterns = [
      /interview.*?(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /interview.*?(\d{1,2}-\d{1,2}-\d{4})/i,
      /interview.*?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4}).*?interview/i,
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}).*?interview/i,
    ];

    for (const pattern of datePatterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract decision date from email
   */
  private extractDecisionDate(body: string): string | undefined {
    const patterns = [
      /decision.*?(?:by|on|before)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /decision.*?(?:by|on|before)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
      /(?:by|on|before)\s+(\d{1,2}\/\d{1,2}\/\d{4}).*?decision/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract action required text
   */
  private extractActionRequired(body: string): string | undefined {
    for (const keyword of this.actionKeywords) {
      const index = body.toLowerCase().indexOf(keyword);
      if (index !== -1) {
        // Extract surrounding context (50 chars before and after)
        const start = Math.max(0, index - 50);
        const end = Math.min(body.length, index + keyword.length + 100);
        return body.substring(start, end).trim();
      }
    }

    return undefined;
  }

  /**
   * Extract deadlines from email
   */
  private extractDeadlines(body: string): Array<{ type: string; date: string }> {
    const deadlines: Array<{ type: string; date: string }> = [];

    const deadlinePatterns = [
      { pattern: /deadline.*?(?:by|on)\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi, type: 'general' },
      { pattern: /submit.*?(?:by|on)\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi, type: 'submission' },
      { pattern: /respond.*?(?:by|on)\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi, type: 'response' },
    ];

    for (const { pattern, type } of deadlinePatterns) {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        deadlines.push({
          type,
          date: match[1],
        });
      }
    }

    return deadlines;
  }

  /**
   * Detect sentiment of email
   */
  private detectSentiment(text: string, status?: ParsedEmail['detectedStatus']): ParsedEmail['sentiment'] {
    // If status is detected, use that
    if (status === 'accepted') return 'positive';
    if (status === 'rejected') return 'negative';

    // Otherwise, analyze keywords
    const positiveKeywords = ['congratulations', 'pleased', 'happy', 'excited', 'welcome', 'great', 'excellent'];
    const negativeKeywords = ['unfortunately', 'regret', 'sorry', 'unable', 'cannot', 'declined', 'not'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of positiveKeywords) {
      if (text.includes(keyword)) positiveCount++;
    }

    for (const keyword of negativeKeywords) {
      if (text.includes(keyword)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract important keywords
   */
  private extractKeywords(text: string): string[] {
    const allKeywords = new Set<string>();

    // Add status keywords
    for (const config of Object.values(this.statusKeywords)) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          allKeywords.add(keyword);
        }
      }
    }

    // Add action keywords
    for (const keyword of this.actionKeywords) {
      if (text.includes(keyword)) {
        allKeywords.add(keyword);
      }
    }

    return Array.from(allKeywords);
  }

  /**
   * Batch parse multiple emails
   */
  async parseMultiple(emails: Array<{ from: string; subject: string; body: string; receivedAt?: Date }>): Promise<ParsedEmail[]> {
    return Promise.all(emails.map((email) => this.parseEmail(email)));
  }
}

// Export singleton
export const emailParserService = new EmailParserService();
