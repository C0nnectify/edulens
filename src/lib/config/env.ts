/**
 * Environment Variables Configuration
 * Centralized configuration for all services
 */

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'BETTER_AUTH_SECRET', 'JWT_SECRET'];

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file'
    );
  }
}

// Call validation in non-production environments
if (process.env.NODE_ENV !== 'production') {
  validateEnv();
}

export const config = {
  // Application
  app: {
    env: process.env.NODE_ENV || 'development',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    port: parseInt(process.env.PORT || '3000'),
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI!,
    name: process.env.MONGODB_DB_NAME || 'edulen',
  },

  // Authentication
  auth: {
    secret: process.env.BETTER_AUTH_SECRET!,
    url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    jwt: {
      secret: process.env.JWT_SECRET!,
      algorithm: (process.env.JWT_ALGORITHM || 'HS256') as any,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    session: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'),
      updateAge: parseInt(process.env.SESSION_UPDATE_AGE || '86400'),
    },
  },

  // Email Service
  email: {
    provider: (process.env.EMAIL_PROVIDER || 'sendgrid') as 'sendgrid' | 'postmark' | 'aws-ses' | 'resend',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@edulen.app',
      fromName: process.env.SENDGRID_FROM_NAME || 'EduLen',
    },
    postmark: {
      apiKey: process.env.POSTMARK_API_KEY,
      fromEmail: process.env.POSTMARK_FROM_EMAIL || 'noreply@edulen.app',
      fromName: process.env.POSTMARK_FROM_NAME || 'EduLen',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@edulen.app',
    },
    awsSes: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@edulen.app',
    },
  },

  // SMS Service
  sms: {
    provider: (process.env.SMS_PROVIDER || 'twilio') as 'twilio' | 'vonage',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },
  },

  // Push Notifications
  push: {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    },
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
  },

  // Google Services
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  // Microsoft Services
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  },

  // Feature Flags
  features: {
    emailParsing: process.env.ENABLE_EMAIL_PARSING === 'true',
    portalScraping: process.env.ENABLE_PORTAL_SCRAPING === 'true',
    aiInsights: process.env.ENABLE_AI_INSIGHTS === 'true',
    calendarSync: process.env.ENABLE_CALENDAR_SYNC === 'true',
  },

  // AI Service
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },

  // Rate Limiting
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  },

  // File Upload
  upload: {
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,jpg,jpeg,png').split(','),
    storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'aws-s3' | 'cloudinary',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },

  // Cron Jobs
  cron: {
    secret: process.env.CRON_SECRET,
    reminderSchedule: process.env.REMINDER_CRON_SCHEDULE || '0 * * * *',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.ENABLE_DEBUG_LOGS === 'true',
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || 'development',
  },

  // Security
  security: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH || '8'),
    requirePasswordSpecialChar: process.env.REQUIRE_PASSWORD_SPECIAL_CHAR !== 'false',
    requirePasswordNumber: process.env.REQUIRE_PASSWORD_NUMBER !== 'false',
  },

  // Development
  dev: {
    useMockEmail: process.env.USE_MOCK_EMAIL === 'true',
    useMockSms: process.env.USE_MOCK_SMS === 'true',
    useMockPush: process.env.USE_MOCK_PUSH === 'true',
    testEmail: process.env.DEV_TEST_EMAIL || 'test@example.com',
    testPhone: process.env.DEV_TEST_PHONE || '+1234567890',
  },

  // Maintenance
  maintenance: {
    mode: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || 'We\'ll be back soon!',
  },
} as const;

// Type-safe config access
export type Config = typeof config;

// Helper functions
export function isDevelopment(): boolean {
  return config.app.env === 'development';
}

export function isProduction(): boolean {
  return config.app.env === 'production';
}

export function isMaintenanceMode(): boolean {
  return config.maintenance.mode;
}

// Export for service-specific configs
export const emailConfig = config.email;
export const smsConfig = config.sms;
export const pushConfig = config.push;
export const databaseConfig = config.database;
export const authConfig = config.auth;
