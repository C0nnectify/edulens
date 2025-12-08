export interface NotificationPreferences {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      address: string;
    };
    sms: {
      enabled: boolean;
      phone: string;
    };
    push: {
      enabled: boolean;
      deviceTokens: string[];
    };
  };
  types: {
    deadlineReminders: boolean;
    statusUpdates: boolean;
    documentRequests: boolean;
    aiInsights: boolean;
    weeklyDigest: boolean;
    lorReminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  applicationId?: string;
  type: 'email' | 'sms' | 'push';
  template: string;
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ReminderSchedule {
  id: string;
  applicationId: string;
  deadline: string;
  deadlineType: 'application' | 'transcript' | 'lor' | 'interview_response' | 'decision' | 'enrollment_deposit';
  reminders: Array<{
    id: string;
    triggerAt: string;
    type: 'deadline' | 'document' | 'status';
    sent: boolean;
    sentAt?: string;
    notificationLogId?: string;
  }>;
  completionPercentage: number;
  lastCalculated: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  applicationId: string;
  type: 'application' | 'transcript' | 'lor' | 'interview_response' | 'decision' | 'enrollment_deposit' | 'other';
  stage: 'early_decision' | 'early_action' | 'regular' | 'rolling' | 'priority';
  date: string;
  time?: string; // "23:59"
  timezone: string;
  portalClosesAt?: string; // Exact moment portal closes
  isExtended: boolean;
  originalDate?: string;
  extensionReason?: string;
  status: 'upcoming' | 'completed' | 'missed' | 'extended';
  reminderScheduleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationPreferencesDto {
  channels?: Partial<NotificationPreferences['channels']>;
  types?: Partial<NotificationPreferences['types']>;
  quietHours?: Partial<NotificationPreferences['quietHours']>;
  timezone?: string;
}

export interface UpdateNotificationPreferencesDto extends CreateNotificationPreferencesDto {}

export interface CreateDeadlineDto {
  applicationId: string;
  type: Deadline['type'];
  stage: Deadline['stage'];
  date: string;
  time?: string;
  timezone: string;
  notes?: string;
}

export interface UpdateDeadlineDto {
  date?: string;
  time?: string;
  timezone?: string;
  status?: Deadline['status'];
  isExtended?: boolean;
  extensionReason?: string;
  notes?: string;
}
