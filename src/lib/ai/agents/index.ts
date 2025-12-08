/**
 * EduLen AI Agent System - Main Export Index
 *
 * Centralized exports for the complete AI agent architecture.
 * Provides a clean API surface for importing agent components.
 */

// Core types and interfaces
export type {
  AgentId,
  SessionId,
  ToolId,
  UserId,
  AgentContext,
  AgentRequest,
  AgentResponse,
  AgentSuccessResponse,
  AgentErrorResponse,
  AgentConfiguration,
  AgentExecutionResult,
  AgentError,
  AgentMessage,
  AgentEvent,
  AgentEventHandler,
  Tool,
  ExecutionStep,
  ExecutionMetrics,
  ResourceUsage,
  UserPreferences,
  NotificationPreferences,
  RetryConfig,
  RateLimit,
  EnvironmentConfig,
  AgentInstance,
  AgentRegistry,
  HealthStatus,
  HealthMetrics,
  ValidatedAgentRequest,
  ValidatedAgentConfig,
  AgentCapabilityMap,
  PartialAgentConfig
} from '@/types/agents';

// Enums
export {
  AgentStatus,
  AgentCapability,
  AgentPriority,
  AgentErrorType,
  MessageType
} from '@/types/agents';

// Type guards and utility functions
export {
  isAgentSuccessResponse,
  isAgentErrorResponse,
  createAgentId,
  createSessionId,
  createToolId,
  createUserId
} from '@/types/agents';

// Base agent architecture
export type {
  IBaseAgent,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './base-agent';

export {
  BaseAgent,
  AgentExecutionContext,
  createBaseAgent,
  isValidAgent
} from './base-agent';

// Configuration system
export type {
  Environment
} from './config';

export {
  AgentConfigurationBuilder,
  EduLenAgentConfigFactory,
  getDefaultRetryConfig,
  getDefaultRateLimit,
  getDefaultEnvironmentConfig,
  getEnvironmentConfig,
  createDocumentAnalysisTool,
  createFinancialPlanningTool,
  createUniversitySearchTool,
  createScholarshipSearchTool,
  createEmailCompositionTool,
  EDULEN_AGENT_CONFIGS,
  getAgentConfigForCapability,
  getAllAgentConfigs,
  isValidAgentConfig,
  agentConfigFactory,
  AGENT_CONFIG_VERSION,
  MAX_AGENT_TIMEOUT,
  MIN_AGENT_TIMEOUT,
  DEFAULT_AGENT_VERSION
} from './config';

// Constants for common agent capabilities available in EduLen
export const EDULEN_AGENT_CAPABILITIES = [
  AgentCapability.PERSONALIZED_ADVICE,
  AgentCapability.DOCUMENT_ANALYSIS,
  AgentCapability.FINANCIAL_PLANNING,
  AgentCapability.NETWORKING,
  AgentCapability.PEER_MATCHING,
  AgentCapability.TIMELINE_PLANNING,
  AgentCapability.DOCUMENT_VERIFICATION,
  AgentCapability.UNIVERSITY_RESEARCH,
  AgentCapability.AUTOMATED_APPLICATIONS,
  AgentCapability.APPLICATION_TRACKING,
  AgentCapability.SCHOLARSHIP_SEARCH,
  AgentCapability.EMAIL_COMPOSITION,
  AgentCapability.COURSE_PLANNING
] as const;

// Agent capability groups for easier management
export const AGENT_CAPABILITY_GROUPS = {
  CORE: [
    AgentCapability.PERSONALIZED_ADVICE,
    AgentCapability.DOCUMENT_ANALYSIS,
    AgentCapability.FINANCIAL_PLANNING
  ],
  RESEARCH: [
    AgentCapability.UNIVERSITY_RESEARCH,
    AgentCapability.SCHOLARSHIP_SEARCH,
    AgentCapability.COURSE_PLANNING
  ],
  APPLICATIONS: [
    AgentCapability.APPLICATION_TRACKING,
    AgentCapability.AUTOMATED_APPLICATIONS,
    AgentCapability.EMAIL_COMPOSITION
  ],
  SOCIAL: [
    AgentCapability.NETWORKING,
    AgentCapability.PEER_MATCHING
  ],
  PLANNING: [
    AgentCapability.TIMELINE_PLANNING,
    AgentCapability.COURSE_PLANNING
  ],
  VERIFICATION: [
    AgentCapability.DOCUMENT_VERIFICATION
  ]
} as const;

// Default agent priorities for different types of requests
export const DEFAULT_AGENT_PRIORITIES = {
  [AgentCapability.DOCUMENT_VERIFICATION]: AgentPriority.HIGH,
  [AgentCapability.APPLICATION_TRACKING]: AgentPriority.HIGH,
  [AgentCapability.PERSONALIZED_ADVICE]: AgentPriority.MEDIUM,
  [AgentCapability.FINANCIAL_PLANNING]: AgentPriority.MEDIUM,
  [AgentCapability.UNIVERSITY_RESEARCH]: AgentPriority.MEDIUM,
  [AgentCapability.SCHOLARSHIP_SEARCH]: AgentPriority.MEDIUM,
  [AgentCapability.EMAIL_COMPOSITION]: AgentPriority.LOW,
  [AgentCapability.COURSE_PLANNING]: AgentPriority.LOW,
  [AgentCapability.PEER_MATCHING]: AgentPriority.LOW,
  [AgentCapability.NETWORKING]: AgentPriority.LOW,
  [AgentCapability.TIMELINE_PLANNING]: AgentPriority.LOW,
  [AgentCapability.DOCUMENT_ANALYSIS]: AgentPriority.MEDIUM,
  [AgentCapability.AUTOMATED_APPLICATIONS]: AgentPriority.HIGH
} as const;

// Common agent error codes for the EduLen system
export const EDULEN_AGENT_ERROR_CODES = {
  // Validation errors
  INVALID_USER_PROFILE: 'INVALID_USER_PROFILE',
  MISSING_REQUIRED_DOCUMENTS: 'MISSING_REQUIRED_DOCUMENTS',
  INVALID_BUDGET_RANGE: 'INVALID_BUDGET_RANGE',
  INVALID_TIMELINE: 'INVALID_TIMELINE',

  // Service errors
  UNIVERSITY_SERVICE_UNAVAILABLE: 'UNIVERSITY_SERVICE_UNAVAILABLE',
  SCHOLARSHIP_SERVICE_UNAVAILABLE: 'SCHOLARSHIP_SERVICE_UNAVAILABLE',
  DOCUMENT_SERVICE_UNAVAILABLE: 'DOCUMENT_SERVICE_UNAVAILABLE',
  EMAIL_SERVICE_UNAVAILABLE: 'EMAIL_SERVICE_UNAVAILABLE',

  // Data errors
  NO_UNIVERSITIES_FOUND: 'NO_UNIVERSITIES_FOUND',
  NO_SCHOLARSHIPS_FOUND: 'NO_SCHOLARSHIPS_FOUND',
  INSUFFICIENT_USER_DATA: 'INSUFFICIENT_USER_DATA',

  // Processing errors
  DOCUMENT_ANALYSIS_FAILED: 'DOCUMENT_ANALYSIS_FAILED',
  FINANCIAL_CALCULATION_ERROR: 'FINANCIAL_CALCULATION_ERROR',
  RECOMMENDATION_GENERATION_FAILED: 'RECOMMENDATION_GENERATION_FAILED',

  // Authentication/Authorization
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const;

/**
 * Utility function to create a complete agent configuration for EduLen
 */
export const createEduLenAgentConfig = (
  capability: AgentCapability,
  environment: Environment = 'development',
  overrides: Partial<AgentConfiguration> = {}
): AgentConfiguration => {
  return getAgentConfigForCapability(capability, environment);
};

/**
 * Utility function to get the recommended priority for a capability
 */
export const getRecommendedPriority = (capability: AgentCapability): AgentPriority => {
  return DEFAULT_AGENT_PRIORITIES[capability] || AgentPriority.MEDIUM;
};

/**
 * Utility function to check if a capability belongs to a specific group
 */
export const isCapabilityInGroup = (
  capability: AgentCapability,
  group: keyof typeof AGENT_CAPABILITY_GROUPS
): boolean => {
  return AGENT_CAPABILITY_GROUPS[group].includes(capability as any);
};

/**
 * Type for agent initialization options
 */
export interface AgentInitializationOptions {
  environment?: Environment;
  enableMetrics?: boolean;
  enableTracing?: boolean;
  customTimeout?: number;
  customRateLimit?: Partial<RateLimit>;
}

/**
 * Factory function for creating pre-configured EduLen agents
 */
export const createEduLenAgent = async <TRequest = unknown, TResponse = unknown>(
  capability: AgentCapability,
  agentClass: new (id: AgentId, config: AgentConfiguration) => BaseAgent<TRequest, TResponse>,
  options: AgentInitializationOptions = {}
): Promise<BaseAgent<TRequest, TResponse>> => {
  const config = createEduLenAgentConfig(
    capability,
    options.environment,
    {
      timeout: options.customTimeout,
      rateLimit: options.customRateLimit ? {
        ...getDefaultRateLimit(),
        ...options.customRateLimit
      } : undefined,
      environment: {
        ...getEnvironmentConfig(options.environment || 'development'),
        metricsEnabled: options.enableMetrics ?? true,
        tracingEnabled: options.enableTracing ?? false
      }
    }
  );

  const agent = new agentClass(config.id, config);
  await agent.initialize();

  return agent;
};

// Re-export everything for convenience
export * from '@/types/agents';
export * from './base-agent';
export * from './config';