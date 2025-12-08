/**
 * EduLen Base Agent Architecture
 *
 * Abstract base class and interfaces for the AI agent system.
 * Implements advanced TypeScript patterns including generic constraints,
 * template method pattern, and comprehensive error handling.
 */

import {
  AgentId,
  SessionId,
  AgentStatus,
  AgentCapability,
  AgentRequest,
  AgentResponse,
  AgentSuccessResponse,
  AgentErrorResponse,
  AgentContext,
  AgentConfiguration,
  AgentExecutionResult,
  AgentError,
  AgentErrorType,
  AgentMessage,
  Tool,
  ExecutionStep,
  ExecutionMetrics,
  ResourceUsage,
  AgentEvent,
  AgentEventHandler,
  HealthStatus,
  ValidatedAgentRequest,
  createAgentId,
  isAgentSuccessResponse
} from '@/types/agents';

/**
 * Base agent interface defining the contract all agents must implement
 */
export interface IBaseAgent<TRequest = unknown, TResponse = unknown> {
  readonly id: AgentId;
  readonly config: AgentConfiguration;
  readonly status: AgentStatus;
  readonly capabilities: Set<AgentCapability>;

  // Core execution methods
  execute(request: ValidatedAgentRequest<TRequest>): Promise<AgentResponse<TResponse>>;
  validate(request: AgentRequest<TRequest>): Promise<ValidationResult>;
  canHandle(capability: AgentCapability): boolean;

  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;

  // Event handling
  on<T>(eventType: string, handler: AgentEventHandler<T>): void;
  off<T>(eventType: string, handler: AgentEventHandler<T>): void;
  emit<T>(event: AgentEvent<T>): Promise<void>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'critical';
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Agent execution context for maintaining state during execution
 */
export class AgentExecutionContext {
  private readonly steps: ExecutionStep[] = [];
  private readonly startTime: Date = new Date();
  private resourceUsage: ResourceUsage = {
    cpuTime: 0,
    memoryUsed: 0,
    networkCalls: 0,
    apiCalls: 0,
    tokensUsed: 0
  };

  constructor(
    public readonly agentId: AgentId,
    public readonly sessionId: SessionId,
    public readonly requestId: string
  ) {}

  addStep(step: Omit<ExecutionStep, 'stepId'>): string {
    const stepId = `${this.requestId}-${this.steps.length + 1}`;
    this.steps.push({ ...step, stepId });
    return stepId;
  }

  updateStep(stepId: string, updates: Partial<ExecutionStep>): void {
    const stepIndex = this.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex] = { ...this.steps[stepIndex], ...updates };
    }
  }

  updateResourceUsage(usage: Partial<ResourceUsage>): void {
    this.resourceUsage = { ...this.resourceUsage, ...usage };
  }

  getExecutionResult<T>(
    status: AgentStatus,
    result?: T,
    error?: AgentError
  ): AgentExecutionResult<T> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    const metrics: ExecutionMetrics = {
      totalSteps: this.steps.length,
      successfulSteps: this.steps.filter(s => s.status === AgentStatus.COMPLETED).length,
      failedSteps: this.steps.filter(s => s.status === AgentStatus.ERROR).length,
      averageStepTime: this.steps.length > 0
        ? this.steps.reduce((acc, step) => {
            const stepDuration = step.endTime
              ? step.endTime.getTime() - step.startTime.getTime()
              : 0;
            return acc + stepDuration;
          }, 0) / this.steps.length
        : 0,
      resourceUsage: this.resourceUsage
    };

    return {
      id: this.requestId,
      agentId: this.agentId,
      status,
      result,
      error,
      startTime: this.startTime,
      endTime,
      duration,
      steps: [...this.steps],
      metrics
    };
  }
}

/**
 * Abstract base agent class implementing common functionality
 */
export abstract class BaseAgent<TRequest = unknown, TResponse = unknown>
  implements IBaseAgent<TRequest, TResponse> {

  protected _status: AgentStatus = AgentStatus.IDLE;
  protected readonly eventHandlers = new Map<string, Set<AgentEventHandler>>();
  protected executionContexts = new Map<string, AgentExecutionContext>();

  constructor(
    public readonly id: AgentId,
    public readonly config: AgentConfiguration
  ) {
    this.validateConfiguration();
  }

  // Getters
  get status(): AgentStatus {
    return this._status;
  }

  get capabilities(): Set<AgentCapability> {
    return new Set(this.config.capabilities);
  }

  // Abstract methods that must be implemented by concrete agents
  protected abstract validateRequest(request: AgentRequest<TRequest>): Promise<ValidationResult>;
  protected abstract executeInternal(
    request: ValidatedAgentRequest<TRequest>,
    context: AgentExecutionContext
  ): Promise<TResponse>;
  protected abstract getRequiredTools(): Tool[];

  // Template method pattern for execution
  async execute(request: ValidatedAgentRequest<TRequest>): Promise<AgentResponse<TResponse>> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const context = new AgentExecutionContext(this.id, request.context.sessionId, executionId);
    this.executionContexts.set(executionId, context);

    try {
      // Update status
      await this.updateStatus(AgentStatus.THINKING);

      // Pre-execution validation
      const stepId = context.addStep({
        name: 'Pre-execution validation',
        status: AgentStatus.EXECUTING,
        startTime: new Date(),
        input: request
      });

      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        const error = this.createValidationError(validationResult);
        context.updateStep(stepId, {
          status: AgentStatus.ERROR,
          endTime: new Date(),
          error
        });

        return this.createErrorResponse(error, context);
      }

      context.updateStep(stepId, {
        status: AgentStatus.COMPLETED,
        endTime: new Date(),
        output: validationResult
      });

      // Main execution
      await this.updateStatus(AgentStatus.EXECUTING);

      const execStepId = context.addStep({
        name: 'Main execution',
        status: AgentStatus.EXECUTING,
        startTime: new Date(),
        input: request.payload
      });

      const result = await this.executeInternal(request, context);

      context.updateStep(execStepId, {
        status: AgentStatus.COMPLETED,
        endTime: new Date(),
        output: result
      });

      // Post-execution processing
      const postStepId = context.addStep({
        name: 'Post-execution processing',
        status: AgentStatus.EXECUTING,
        startTime: new Date()
      });

      await this.postExecutionHook(request, result, context);

      context.updateStep(postStepId, {
        status: AgentStatus.COMPLETED,
        endTime: new Date()
      });

      await this.updateStatus(AgentStatus.COMPLETED);

      // Emit success event
      await this.emit({
        type: 'execution.completed',
        agentId: this.id,
        timestamp: new Date(),
        data: { requestId: executionId, result }
      });

      return this.createSuccessResponse(result, context);

    } catch (error) {
      const agentError = this.handleExecutionError(error, context);
      await this.updateStatus(AgentStatus.ERROR);

      // Emit error event
      await this.emit({
        type: 'execution.failed',
        agentId: this.id,
        timestamp: new Date(),
        data: { requestId: executionId, error: agentError }
      });

      return this.createErrorResponse(agentError, context);
    } finally {
      this.executionContexts.delete(executionId);
      // Reset to idle after a delay
      setTimeout(() => {
        if (this._status !== AgentStatus.ERROR) {
          this.updateStatus(AgentStatus.IDLE);
        }
      }, 1000);
    }
  }

  // Validation implementation
  async validate(request: AgentRequest<TRequest>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic request validation
    if (!request.agentId) {
      errors.push({
        field: 'agentId',
        message: 'Agent ID is required',
        code: 'MISSING_AGENT_ID',
        severity: 'error'
      });
    }

    if (request.agentId !== this.id) {
      errors.push({
        field: 'agentId',
        message: 'Request is not for this agent',
        code: 'INVALID_AGENT_ID',
        severity: 'error'
      });
    }

    if (!request.payload) {
      errors.push({
        field: 'payload',
        message: 'Request payload is required',
        code: 'MISSING_PAYLOAD',
        severity: 'error'
      });
    }

    // Context validation
    if (!request.context?.sessionId) {
      errors.push({
        field: 'context.sessionId',
        message: 'Session ID is required',
        code: 'MISSING_SESSION_ID',
        severity: 'error'
      });
    }

    if (!request.context?.userId) {
      errors.push({
        field: 'context.userId',
        message: 'User ID is required',
        code: 'MISSING_USER_ID',
        severity: 'error'
      });
    }

    // Agent-specific validation
    const agentValidation = await this.validateRequest(request);
    errors.push(...agentValidation.errors);
    warnings.push(...agentValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Capability checking
  canHandle(capability: AgentCapability): boolean {
    return this.capabilities.has(capability);
  }

  // Lifecycle methods
  async initialize(): Promise<void> {
    await this.emit({
      type: 'agent.initializing',
      agentId: this.id,
      timestamp: new Date(),
      data: { config: this.config }
    });

    await this.initializeInternal();
    await this.updateStatus(AgentStatus.IDLE);

    await this.emit({
      type: 'agent.initialized',
      agentId: this.id,
      timestamp: new Date(),
      data: { status: this.status }
    });
  }

  async shutdown(): Promise<void> {
    await this.emit({
      type: 'agent.shutting_down',
      agentId: this.id,
      timestamp: new Date(),
      data: { status: this.status }
    });

    await this.shutdownInternal();
    this.executionContexts.clear();
    this.eventHandlers.clear();

    await this.emit({
      type: 'agent.shutdown',
      agentId: this.id,
      timestamp: new Date(),
      data: { timestamp: new Date() }
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      // Check if agent is in a valid state
      if (this._status === AgentStatus.ERROR) {
        issues.push('Agent is in error state');
      }

      // Check configuration
      if (!this.config) {
        issues.push('Missing agent configuration');
      }

      // Check required tools
      const requiredTools = this.getRequiredTools();
      for (const tool of requiredTools) {
        if (!this.isToolAvailable(tool)) {
          issues.push(`Required tool '${tool.name}' is not available`);
        }
      }

      // Agent-specific health checks
      const agentHealthIssues = await this.performHealthCheck();
      issues.push(...agentHealthIssues);

      const responseTime = Date.now() - startTime;

      return {
        healthy: issues.length === 0,
        lastChecked: new Date(),
        issues,
        metrics: {
          uptime: this.getUptime(),
          memoryUsage: this.getMemoryUsage(),
          cpuUsage: 0, // Would need actual implementation
          responseTime,
          errorRate: this.getErrorRate(),
          successRate: this.getSuccessRate()
        }
      };
    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        lastChecked: new Date(),
        issues,
        metrics: {
          uptime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          responseTime: Date.now() - startTime,
          errorRate: 1,
          successRate: 0
        }
      };
    }
  }

  // Event handling
  on<T>(eventType: string, handler: AgentEventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as AgentEventHandler);
  }

  off<T>(eventType: string, handler: AgentEventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as AgentEventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  async emit<T>(event: AgentEvent<T>): Promise<void> {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      const promises = Array.from(handlers).map(handler =>
        Promise.resolve(handler(event)).catch(error => {
          console.error(`Error in event handler for ${event.type}:`, error);
        })
      );
      await Promise.all(promises);
    }
  }

  // Protected helper methods for subclasses
  protected async updateStatus(status: AgentStatus): Promise<void> {
    const previousStatus = this._status;
    this._status = status;

    await this.emit({
      type: 'agent.status_changed',
      agentId: this.id,
      timestamp: new Date(),
      data: { previousStatus, newStatus: status }
    });
  }

  protected createSuccessResponse<T>(
    data: T,
    context: AgentExecutionContext
  ): AgentSuccessResponse<T> {
    const executionResult = context.getExecutionResult(AgentStatus.COMPLETED, data);

    return {
      success: true,
      data,
      metadata: {
        executionTime: executionResult.duration || 0,
        agentVersion: this.config.version,
        timestamp: new Date(),
        resourcesUsed: executionResult.metrics.resourceUsage
      }
    };
  }

  protected createErrorResponse(
    error: AgentError,
    context: AgentExecutionContext
  ): AgentErrorResponse {
    const executionResult = context.getExecutionResult(AgentStatus.ERROR, undefined, error);

    return {
      success: false,
      error,
      metadata: {
        executionTime: executionResult.duration || 0,
        agentVersion: this.config.version,
        timestamp: new Date(),
        resourcesUsed: executionResult.metrics.resourceUsage
      },
      retryable: this.isRetryableError(error)
    };
  }

  protected createValidationError(validation: ValidationResult): AgentError {
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
    const errorMessages = validation.errors.map(e => e.message).join('; ');

    return {
      type: AgentErrorType.VALIDATION_ERROR,
      code: criticalErrors.length > 0 ? 'CRITICAL_VALIDATION_ERROR' : 'VALIDATION_ERROR',
      message: errorMessages || 'Validation failed',
      details: { errors: validation.errors, warnings: validation.warnings },
      timestamp: new Date(),
      agentId: this.id
    };
  }

  protected handleExecutionError(
    error: unknown,
    context: AgentExecutionContext
  ): AgentError {
    if (error instanceof Error) {
      return {
        type: AgentErrorType.INTERNAL_ERROR,
        code: error.name || 'EXECUTION_ERROR',
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        agentId: this.id,
        details: { context: context.requestId }
      };
    }

    return {
      type: AgentErrorType.INTERNAL_ERROR,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred during execution',
      timestamp: new Date(),
      agentId: this.id,
      details: { error: String(error), context: context.requestId }
    };
  }

  protected isRetryableError(error: AgentError): boolean {
    return [
      AgentErrorType.NETWORK_ERROR,
      AgentErrorType.TIMEOUT_ERROR,
      AgentErrorType.RATE_LIMIT_ERROR
    ].includes(error.type);
  }

  // Abstract methods for subclasses to implement
  protected abstract initializeInternal(): Promise<void>;
  protected abstract shutdownInternal(): Promise<void>;
  protected abstract performHealthCheck(): Promise<string[]>;
  protected abstract postExecutionHook(
    request: ValidatedAgentRequest<TRequest>,
    result: TResponse,
    context: AgentExecutionContext
  ): Promise<void>;

  // Private helper methods
  private validateConfiguration(): void {
    if (!this.config.id || this.config.id !== this.id) {
      throw new Error('Invalid agent configuration: ID mismatch');
    }

    if (!this.config.name || !this.config.version) {
      throw new Error('Invalid agent configuration: Missing required fields');
    }

    if (!this.config.capabilities || this.config.capabilities.length === 0) {
      throw new Error('Invalid agent configuration: No capabilities defined');
    }
  }

  private isToolAvailable(tool: Tool): boolean {
    return this.config.tools.some(t => t.id === tool.id);
  }

  private getUptime(): number {
    // Implementation would track agent start time
    return Date.now() - 0; // Placeholder
  }

  private getMemoryUsage(): number {
    // Implementation would use process.memoryUsage() or similar
    return 0; // Placeholder
  }

  private getErrorRate(): number {
    // Implementation would track error statistics
    return 0; // Placeholder
  }

  private getSuccessRate(): number {
    // Implementation would track success statistics
    return 1; // Placeholder
  }
}

/**
 * Utility functions for agent management
 */
export const createBaseAgent = <T, R>(
  id: string,
  config: Omit<AgentConfiguration, 'id'>
): AgentId => {
  return createAgentId(id);
};

export const isValidAgent = (agent: unknown): agent is IBaseAgent => {
  return (
    typeof agent === 'object' &&
    agent !== null &&
    'id' in agent &&
    'config' in agent &&
    'execute' in agent &&
    typeof (agent as any).execute === 'function'
  );
};