/**
 * Timezone Conversion Utility
 * Handles all timezone conversions, DST, and display formatting
 */

import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface TimeZoneInfo {
  timezone: string;
  offset: string;
  abbreviation: string;
  isDST: boolean;
}

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent' | 'critical';
  displayText: string;
}

/**
 * Get user's timezone or default to UTC
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Convert UTC date to user's local timezone
 */
export function toUserTimezone(utcDate: Date | string, userTimezone?: string): Date {
  const timezone = userTimezone || getUserTimezone();
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Convert user's local time to UTC
 */
export function toUTC(localDate: Date, userTimezone?: string): Date {
  const timezone = userTimezone || getUserTimezone();
  return fromZonedTime(localDate, timezone);
}

/**
 * Format date in user's timezone
 */
export function formatInUserTimezone(
  date: Date | string,
  formatString: string = 'PPp',
  userTimezone?: string
): string {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, timezone, formatString);
}

/**
 * Get timezone information
 */
export function getTimezoneInfo(timezone?: string): TimeZoneInfo {
  const tz = timezone || getUserTimezone();
  const now = new Date();

  // Get offset in minutes
  const zonedDate = toZonedTime(now, tz);
  const utcDate = new Date(now.toISOString());
  const offsetMinutes = (zonedDate.getTime() - utcDate.getTime()) / (1000 * 60);
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

  // Get abbreviation (simplified)
  const abbreviation = formatInTimeZone(now, tz, 'zzz');

  // Check if DST (simplified - compare summer vs winter offsets)
  const winterDate = new Date(now.getFullYear(), 0, 1);
  const summerDate = new Date(now.getFullYear(), 6, 1);
  const winterOffset = (toZonedTime(winterDate, tz).getTime() - new Date(winterDate.toISOString()).getTime()) / (1000 * 60);
  const summerOffset = (toZonedTime(summerDate, tz).getTime() - new Date(summerDate.toISOString()).getTime()) / (1000 * 60);
  const isDST = offsetMinutes === Math.max(winterOffset, summerOffset) && winterOffset !== summerOffset;

  return {
    timezone: tz,
    offset,
    abbreviation,
    isDST,
  };
}

/**
 * Calculate countdown to deadline
 */
export function calculateCountdown(deadline: Date | string, now?: Date): CountdownResult {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const currentDate = now || new Date();

  const diffMs = deadlineDate.getTime() - currentDate.getTime();
  const isExpired = diffMs <= 0;

  if (isExpired) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      urgencyLevel: 'critical',
      displayText: 'Deadline passed',
    };
  }

  const days = differenceInDays(deadlineDate, currentDate);
  const hours = differenceInHours(deadlineDate, currentDate) % 24;
  const minutes = differenceInMinutes(deadlineDate, currentDate) % 60;
  const seconds = Math.floor((diffMs / 1000) % 60);

  // Determine urgency level
  let urgencyLevel: CountdownResult['urgencyLevel'];
  if (days === 0 && hours < 3) {
    urgencyLevel = 'critical';
  } else if (days === 0) {
    urgencyLevel = 'urgent';
  } else if (days <= 3) {
    urgencyLevel = 'warning';
  } else {
    urgencyLevel = 'safe';
  }

  // Generate display text
  let displayText: string;
  if (days > 30) {
    displayText = `${days} days`;
  } else if (days > 0) {
    displayText = `${days}d ${hours}h`;
  } else if (hours > 0) {
    displayText = `${hours}h ${minutes}m`;
  } else {
    displayText = `${minutes}m ${seconds}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired,
    urgencyLevel,
    displayText,
  };
}

/**
 * Get urgency color based on countdown
 */
export function getUrgencyColor(urgencyLevel: CountdownResult['urgencyLevel']): string {
  const colors = {
    safe: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    urgent: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  return colors[urgencyLevel];
}

/**
 * Format deadline with countdown
 */
export function formatDeadlineWithCountdown(
  deadline: Date | string,
  userTimezone?: string
): {
  formattedDate: string;
  countdown: CountdownResult;
  timezone: TimeZoneInfo;
} {
  const timezone = getTimezoneInfo(userTimezone);
  const formattedDate = formatInUserTimezone(deadline, 'PPp', userTimezone);
  const countdown = calculateCountdown(deadline);

  return {
    formattedDate,
    countdown,
    timezone,
  };
}

/**
 * Parse portal deadline time
 * Handles different formats: "11:59 PM EST", "23:59 PST", etc.
 */
export function parsePortalDeadline(
  date: string,
  time: string,
  timezoneStr?: string
): Date {
  const timezone = timezoneStr || 'America/New_York'; // Default to EST

  // Parse time (handle 12-hour and 24-hour formats)
  let hours = 0;
  let minutes = 0;

  const time24hrMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  const time12hrMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (time24hrMatch) {
    hours = parseInt(time24hrMatch[1], 10);
    minutes = parseInt(time24hrMatch[2], 10);
  } else if (time12hrMatch) {
    hours = parseInt(time12hrMatch[1], 10);
    minutes = parseInt(time12hrMatch[2], 10);
    const period = time12hrMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  // Create date in the specified timezone
  const dateStr = `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  const localDate = new Date(dateStr);

  // Convert to UTC
  return fromZonedTime(localDate, timezone);
}

/**
 * Common timezone abbreviations to IANA timezone mapping
 */
export const TIMEZONE_MAP: Record<string, string> = {
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  GMT: 'Europe/London',
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  IST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
};

/**
 * Convert timezone abbreviation to IANA timezone
 */
export function resolveTimezone(abbreviation: string): string {
  return TIMEZONE_MAP[abbreviation.toUpperCase()] || getUserTimezone();
}

/**
 * Check if current time is within quiet hours
 */
export function isInQuietHours(
  quietHours: { enabled: boolean; start: string; end: string; timezone: string },
  now?: Date
): boolean {
  if (!quietHours.enabled) {
    return false;
  }

  const currentTime = now || new Date();
  const currentTimeInTz = toZonedTime(currentTime, quietHours.timezone);
  const currentHour = currentTimeInTz.getHours();
  const currentMinute = currentTimeInTz.getMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;

  // Parse start and end times
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get next available time after quiet hours
 */
export function getNextAvailableTime(
  quietHours: { enabled: boolean; start: string; end: string; timezone: string },
  now?: Date
): Date {
  if (!quietHours.enabled) {
    return now || new Date();
  }

  const currentTime = now || new Date();

  if (!isInQuietHours(quietHours, currentTime)) {
    return currentTime;
  }

  // Calculate end of quiet hours
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  const currentTimeInTz = toZonedTime(currentTime, quietHours.timezone);

  const endTime = new Date(currentTimeInTz);
  endTime.setHours(endHour, endMin, 0, 0);

  // If end time is before current time, it means quiet hours end tomorrow
  if (endTime <= currentTimeInTz) {
    endTime.setDate(endTime.getDate() + 1);
  }

  // Convert back to UTC
  return fromZonedTime(endTime, quietHours.timezone);
}

/**
 * Format relative time (e.g., "in 3 days", "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Batch convert deadlines to user timezone
 */
export function convertDeadlinesToUserTimezone(
  deadlines: Array<{ id: string; date: string; timezone: string }>,
  userTimezone?: string
): Array<{ id: string; localDate: Date; formattedDate: string; countdown: CountdownResult }> {
  const tz = userTimezone || getUserTimezone();

  return deadlines.map((deadline) => {
    const utcDate = new Date(deadline.date);
    const localDate = toUserTimezone(utcDate, tz);
    const formattedDate = formatInUserTimezone(utcDate, 'PPp', tz);
    const countdown = calculateCountdown(utcDate);

    return {
      id: deadline.id,
      localDate,
      formattedDate,
      countdown,
    };
  });
}
