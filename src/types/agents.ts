/**
 * EduLen AI Agent System Types
 *
 * Comprehensive TypeScript type definitions for the AI agent architecture.
 * Uses advanced TypeScript patterns including branded types, union types,
 * and generic constraints for maximum type safety.
 */

// Branded types for strong typing
export type AgentId = string & { readonly _brand: 'AgentId' };
export type SessionId = string & { readonly _brand: 'SessionId' };
export type ToolId = string & { readonly _brand: 'ToolId' };
export type UserId = string & { readonly _brand: 'UserId' };

// Agent status enumeration
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  EXECUTING = 'executing',
  WAITING_FOR_INPUT = 'waiting_for_input',
  ERROR = 'error',
  COMPLETED = 'completed'
}

// Agent capability types
export enum AgentCapability {
  DOCUMENT_ANALYSIS = 'document_analysis',
  FINANCIAL_PLANNING = 'financial_planning',
  UNIVERSITY_RESEARCH = 'university_research',
  APPLICATION_TRACKING = 'application_tracking',
  SCHOLARSHIP_SEARCH = 'scholarship_search',
  EMAIL_COMPOSITION = 'email_composition',
  COURSE_PLANNING = 'course_planning',
  PEER_MATCHING = 'peer_matching',
  TIMELINE_PLANNING = 'timeline_planning',
  DOCUMENT_VERIFICATION = 'document_verification',
  PERSONALIZED_ADVICE = 'personalized_advice',
  NETWORKING = 'networking',
  AUTOMATED_APPLICATIONS = 'automated_applications'
}

// Priority levels for agent tasks
export enum AgentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Error types for comprehensive error handling
export enum AgentErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INTERNAL_ERROR = 'internal_error',
  CONFIGURATION_ERROR = 'configuration_error',
  DEPENDENCY_ERROR = 'dependency_error'
}

// Tool interface for agent capabilities
export interface Tool {
  readonly id: ToolId;
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly required: string[];
  readonly category: AgentCapability;
  readonly version: string;
  readonly isAsync: boolean;
}

// Base agent context interface
export interface AgentContext {
  readonly sessionId: SessionId;
  readonly userId: UserId;
  readonly timestamp: Date;
  readonly environment: 'development' | 'staging' | 'production';
  readonly locale: string;
  readonly timezone: string;
  readonly userPreferences: UserPreferences;
  readonly sessionData: Record<string, unknown>;
}

// User preferences for personalization
export interface UserPreferences {
  readonly studyDestinations: string[];
  readonly fieldOfStudy: string[];
  readonly budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  readonly timelinePreference: 'flexible' | 'fixed';
  readonly communicationStyle: 'formal' | 'casual' | 'professional';
  readonly languages: string[];
  readonly notifications: NotificationPreferences;
}

// Notification preferences
export interface NotificationPreferences {
  readonly email: boolean;
  readonly inApp: boolean;
  readonly frequency: 'immediate' | 'daily' | 'weekly';
  readonly types: string[];
}

// Agent request interface with generic typing
export interface AgentRequest<T = Record<string, unknown>> {
  readonly id: string;
  readonly agentId: AgentId;
  readonly type: string;
  readonly payload: T;
  readonly context: AgentContext;
  readonly priority: AgentPriority;
  readonly timeout?: number;
  readonly retryConfig?: RetryConfig;
  readonly metadata?: Record<string, unknown>;
}

// Retry configuration
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly backoffStrategy: 'linear' | 'exponential';
  readonly initialDelay: number;
  readonly maxDelay: number;
}

// Agent response interface with discriminated union for type safety
export type AgentResponse<T = unknown> =
  | AgentSuccessResponse<T>
  | AgentErrorResponse;

export interface AgentSuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly metadata: AgentResponseMetadata;
  readonly suggestions?: AgentSuggestion[];
}

export interface AgentErrorResponse {
  readonly success: false;
  readonly error: AgentError;
  readonly metadata: AgentResponseMetadata;
  readonly retryable: boolean;
}

// Agent error with comprehensive error information
export interface AgentError {
  readonly type: AgentErrorType;
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
  readonly timestamp: Date;
  readonly agentId: AgentId;
  readonly correlationId?: string;
}

// Response metadata for tracking and analytics
export interface AgentResponseMetadata {
  readonly executionTime: number;
  readonly agentVersion: string;
  readonly timestamp: Date;
  readonly resourcesUsed: ResourceUsage;
  readonly confidence?: number;
  readonly sources?: string[];
  readonly cacheHit?: boolean;
}

// Resource usage tracking
export interface ResourceUsage {
  readonly cpuTime: number;
  readonly memoryUsed: number;
  readonly networkCalls: number;
  readonly apiCalls: number;
  readonly tokensUsed?: number;
}

// Agent suggestions for improved user experience
export interface AgentSuggestion {
  readonly type: 'action' | 'information' | 'workflow';
  readonly title: string;
  readonly description: string;
  readonly action?: string;
  readonly parameters?: Record<string, unknown>;
  readonly priority: AgentPriority;
}

// Agent configuration interface
export interface AgentConfiguration {
  readonly id: AgentId;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: AgentCapability[];
  readonly tools: Tool[];
  readonly maxConcurrentTasks: number;
  readonly timeout: number;
  readonly retryConfig: RetryConfig;
  readonly rateLimit: RateLimit;
  readonly dependencies: AgentId[];
  readonly environment: EnvironmentConfig;
}

// Rate limiting configuration
export interface RateLimit {
  readonly requestsPerMinute: number;
  readonly requestsPerHour: number;
  readonly burstLimit: number;
  readonly windowSize: number;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  readonly apiEndpoints: Record<string, string>;
  readonly secretKeys: string[];
  readonly featureFlags: Record<string, boolean>;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly metricsEnabled: boolean;
  readonly tracingEnabled: boolean;
}

// Agent execution result with comprehensive typing
export interface AgentExecutionResult<T = unknown> {
  readonly id: string;
  readonly agentId: AgentId;
  readonly status: AgentStatus;
  readonly result?: T;
  readonly error?: AgentError;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly duration?: number;
  readonly steps: ExecutionStep[];
  readonly metrics: ExecutionMetrics;
}

// Individual execution step for detailed tracking
export interface ExecutionStep {
  readonly stepId: string;
  readonly name: string;
  readonly status: AgentStatus;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: AgentError;
  readonly metadata?: Record<string, unknown>;
}

// Execution metrics for performance monitoring
export interface ExecutionMetrics {
  readonly totalSteps: number;
  readonly successfulSteps: number;
  readonly failedSteps: number;
  readonly averageStepTime: number;
  readonly resourceUsage: ResourceUsage;
  readonly cacheHitRate?: number;
}

// Message interface for agent communication
export interface AgentMessage {
  readonly id: string;
  readonly fromAgentId: AgentId;
  readonly toAgentId?: AgentId; // undefined for broadcast
  readonly type: MessageType;
  readonly content: unknown;
  readonly timestamp: Date;
  readonly priority: AgentPriority;
  readonly requiresResponse: boolean;
  readonly correlationId?: string;
}

// Message types for inter-agent communication
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  BROADCAST = 'broadcast'
}

// Agent registry interface for managing agent instances
export interface AgentRegistry {
  readonly agents: Map<AgentId, AgentInstance>;
  readonly activeAgents: Set<AgentId>;
  readonly agentCapabilities: Map<AgentCapability, AgentId[]>;
}

// Agent instance interface
export interface AgentInstance {
  readonly id: AgentId;
  readonly config: AgentConfiguration;
  readonly status: AgentStatus;
  readonly lastActivity: Date;
  readonly activeTasks: number;
  readonly totalTasksProcessed: number;
  readonly errorCount: number;
  readonly averageResponseTime: number;
  readonly healthCheck: () => Promise<HealthStatus>;
}

// Health status for agent monitoring
export interface HealthStatus {
  readonly healthy: boolean;
  readonly lastChecked: Date;
  readonly issues: string[];
  readonly metrics: HealthMetrics;
}

// Health metrics
export interface HealthMetrics {
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly responseTime: number;
  readonly errorRate: number;
  readonly successRate: number;
}

// Type guards for runtime type checking
export const isAgentSuccessResponse = <T>(
  response: AgentResponse<T>
): response is AgentSuccessResponse<T> => {
  return response.success === true;
};

export const isAgentErrorResponse = (
  response: AgentResponse
): response is AgentErrorResponse => {
  return response.success === false;
};

// Utility types for advanced TypeScript patterns
export type AgentCapabilityMap<T> = {
  [K in AgentCapability]: T;
};

export type PartialAgentConfig = Partial<
  Omit<AgentConfiguration, 'id' | 'name' | 'version'>
>;

export type AgentEventHandler<T = unknown> = (
  event: AgentEvent<T>
) => Promise<void> | void;

// Agent event system
export interface AgentEvent<T = unknown> {
  readonly type: string;
  readonly agentId: AgentId;
  readonly timestamp: Date;
  readonly data: T;
  readonly metadata?: Record<string, unknown>;
}

// Factory function type for creating branded types
export const createAgentId = (id: string): AgentId => id as AgentId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createToolId = (id: string): ToolId => id as ToolId;
export const createUserId = (id: string): UserId => id as UserId;

// Validation schemas (to be used with zod in implementation)
export type ValidatedAgentRequest<T> = AgentRequest<T> & {
  readonly _validated: true;
};

export type ValidatedAgentConfig = AgentConfiguration & {
  readonly _validated: true;
};