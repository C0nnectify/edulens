// Simple in-memory data store for demo purposes
// In production, this would be replaced with a proper database

import type { NotificationPreferences, NotificationLog, Deadline, ReminderSchedule } from '@/types/notification';
import type { UniversityRequirements } from '@/types/document-requirements';

export const applications = new Map<string, any>();
export const notificationPreferences = new Map<string, NotificationPreferences>();
export const notificationLogs = new Map<string, NotificationLog>();
export const deadlines = new Map<string, Deadline>();
export const reminderSchedules = new Map<string, ReminderSchedule>();
export const universityRequirements = new Map<string, UniversityRequirements>();
export const documentChecklistData = new Map<string, Array<{
  id: string;
  name: string;
  required: boolean;
  status: 'missing' | 'uploaded' | 'validated' | 'rejected';
  validationStatus?: string;
}>>;

// Initialize with some demo data
if (applications.size === 0) {
  const demoApplications = [
    {
      id: '1',
      userId: 'user1',
      universityName: 'Massachusetts Institute of Technology',
      programName: 'Master of Science in Computer Science',
      degreeLevel: 'graduate',
      status: 'under_review',
      deadline: '2024-01-15',
      submittedDate: '2024-01-10',
      lastUpdated: '2024-01-12',
      portalUrl: 'https://portal.mit.edu',
      applicationFee: 75,
      priority: 'high',
      notes: 'Dream school - high priority',
      tags: ['computer-science', 'ai', 'research'],
      documents: [
        { id: 'doc1', name: 'SOP', type: 'sop', status: 'uploaded' },
        { id: 'doc2', name: 'Resume', type: 'resume', status: 'uploaded' },
        { id: 'doc3', name: 'Transcripts', type: 'transcript', status: 'uploaded' },
        { id: 'doc4', name: 'LOR', type: 'lor', status: 'uploaded' }
      ],
      statusHistory: [
        { id: 'status1', status: 'submitted', timestamp: '2024-01-10', source: 'manual' },
        { id: 'status2', status: 'under_review', timestamp: '2024-01-12', source: 'portal_scrape' }
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-12'
    },
    {
      id: '2',
      userId: 'user1',
      universityName: 'Stanford University',
      programName: 'MS in Artificial Intelligence',
      degreeLevel: 'graduate',
      status: 'interview_scheduled',
      deadline: '2024-01-20',
      submittedDate: '2024-01-18',
      lastUpdated: '2024-01-25',
      portalUrl: 'https://gradadmissions.stanford.edu',
      applicationFee: 125,
      priority: 'high',
      notes: 'Strong program in AI',
      tags: ['artificial-intelligence', 'machine-learning'],
      documents: [
        { id: 'doc5', name: 'SOP', type: 'sop', status: 'uploaded' },
        { id: 'doc6', name: 'Resume', type: 'resume', status: 'uploaded' },
        { id: 'doc7', name: 'Portfolio', type: 'portfolio', status: 'uploaded' }
      ],
      statusHistory: [
        { id: 'status3', status: 'submitted', timestamp: '2024-01-18', source: 'manual' },
        { id: 'status4', status: 'under_review', timestamp: '2024-01-20', source: 'portal_scrape' },
        { id: 'status5', status: 'interview_scheduled', timestamp: '2024-01-25', source: 'email_parsing' }
      ],
      createdAt: '2024-01-05',
      updatedAt: '2024-01-25'
    }
  ];

  demoApplications.forEach(app => {
    applications.set(app.id, app);
  });
}
