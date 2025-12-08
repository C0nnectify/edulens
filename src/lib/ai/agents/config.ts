/**
 * EduLen AI Agent Configuration System
 *
 * Centralized configuration management for all AI agents in the system.
 * Provides environment-based settings, default configurations, and
 * type-safe configuration builders using advanced TypeScript patterns.
 */

import {
  AgentId,
  ToolId,
  AgentCapability,
  AgentConfiguration,
  Tool,
  RateLimit,
  EnvironmentConfig,
  RetryConfig,
  ValidatedAgentConfig,
  AgentCapabilityMap,
  PartialAgentConfig,
  createAgentId,
  createToolId
} from '@/types/agents';

// Environment types
type Environment = 'development' | 'staging' | 'production';

// Configuration builder pattern
export class AgentConfigurationBuilder {
  private config: Partial<AgentConfiguration> = {};

  static create(): AgentConfigurationBuilder {
    return new AgentConfigurationBuilder();
  }

  withId(id: string): this {
    this.config.id = createAgentId(id);
    return this;
  }

  withName(name: string): this {
    this.config.name = name;
    return this;
  }

  withDescription(description: string): this {
    this.config.description = description;
    return this;
  }

  withVersion(version: string): this {
    this.config.version = version;
    return this;
  }

  withCapabilities(capabilities: AgentCapability[]): this {
    this.config.capabilities = [...capabilities];
    return this;
  }

  withTools(tools: Tool[]): this {
    this.config.tools = [...tools];
    return this;
  }

  withConcurrency(maxConcurrentTasks: number): this {
    this.config.maxConcurrentTasks = maxConcurrentTasks;
    return this;
  }

  withTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  withRetryConfig(retryConfig: RetryConfig): this {
    this.config.retryConfig = { ...retryConfig };
    return this;
  }

  withRateLimit(rateLimit: RateLimit): this {
    this.config.rateLimit = { ...rateLimit };
    return this;
  }

  withDependencies(dependencies: AgentId[]): this {
    this.config.dependencies = [...dependencies];
    return this;
  }

  withEnvironment(environment: EnvironmentConfig): this {
    this.config.environment = { ...environment };
    return this;
  }

  build(): AgentConfiguration {
    // Validate required fields
    if (!this.config.id) {
      throw new Error('Agent ID is required');
    }
    if (!this.config.name) {
      throw new Error('Agent name is required');
    }
    if (!this.config.version) {
      throw new Error('Agent version is required');
    }
    if (!this.config.capabilities?.length) {
      throw new Error('At least one capability is required');
    }

    // Apply defaults for optional fields
    const configuration: AgentConfiguration = {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description || '',
      version: this.config.version,
      capabilities: this.config.capabilities,
      tools: this.config.tools || [],
      maxConcurrentTasks: this.config.maxConcurrentTasks || 1,
      timeout: this.config.timeout || 30000,
      retryConfig: this.config.retryConfig || getDefaultRetryConfig(),
      rateLimit: this.config.rateLimit || getDefaultRateLimit(),
      dependencies: this.config.dependencies || [],
      environment: this.config.environment || getDefaultEnvironmentConfig()
    };

    return configuration;
  }
}

// Default configuration factories
export const getDefaultRetryConfig = (): RetryConfig => ({
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000
});

export const getDefaultRateLimit = (): RateLimit => ({
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  burstLimit: 10,
  windowSize: 60000
});

export const getDefaultEnvironmentConfig = (): EnvironmentConfig => ({
  apiEndpoints: {},
  secretKeys: [],
  featureFlags: {},
  logLevel: 'info',
  metricsEnabled: true,
  tracingEnabled: false
});

// Tool factory functions
export const createDocumentAnalysisTool = (): Tool => ({
  id: createToolId('document-analysis'),
  name: 'Document Analysis Tool',
  description: 'Analyzes documents for content, structure, and requirements',
  parameters: {
    documentType: 'string',
    analysisDepth: 'string',
    extractionFields: 'array'
  },
  required: ['documentType'],
  category: AgentCapability.DOCUMENT_ANALYSIS,
  version: '1.0.0',
  isAsync: true
});

export const createFinancialPlanningTool = (): Tool => ({
  id: createToolId('financial-planning'),
  name: 'Financial Planning Tool',
  description: 'Creates financial plans and budget analyses',
  parameters: {
    budgetRange: 'object',
    duration: 'number',
    currency: 'string',
    includeScholarships: 'boolean'
  },
  required: ['budgetRange', 'duration'],
  category: AgentCapability.FINANCIAL_PLANNING,
  version: '1.0.0',
  isAsync: true
});

export const createUniversitySearchTool = (): Tool => ({
  id: createToolId('university-search'),
  name: 'University Search Tool',
  description: 'Searches and filters universities based on criteria',
  parameters: {
    location: 'array',
    fieldOfStudy: 'array',
    rankingRange: 'object',
    tuitionRange: 'object',
    languageRequirements: 'array'
  },
  required: ['fieldOfStudy'],
  category: AgentCapability.UNIVERSITY_RESEARCH,
  version: '1.0.0',
  isAsync: true
});

export const createScholarshipSearchTool = (): Tool => ({
  id: createToolId('scholarship-search'),
  name: 'Scholarship Search Tool',
  description: 'Finds and matches scholarships to user profile',
  parameters: {
    eligibilityCriteria: 'object',
    amount: 'object',
    deadlines: 'object',
    fieldOfStudy: 'array'
  },
  required: ['eligibilityCriteria'],
  category: AgentCapability.SCHOLARSHIP_SEARCH,
  version: '1.0.0',
  isAsync: true
});

export const createEmailCompositionTool = (): Tool => ({
  id: createToolId('email-composition'),
  name: 'Email Composition Tool',
  description: 'Composes professional emails for various purposes',
  parameters: {
    emailType: 'string',
    recipient: 'string',
    tone: 'string',
    template: 'string',
    customFields: 'object'
  },
  required: ['emailType', 'recipient'],
  category: AgentCapability.EMAIL_COMPOSITION,
  version: '1.0.0',
  isAsync: false
});

// Environment-specific configurations
export const getEnvironmentConfig = (env: Environment): EnvironmentConfig => {
  const baseConfig = getDefaultEnvironmentConfig();

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        apiEndpoints: {
          documentService: 'http://localhost:3001/api/documents',
          universityService: 'http://localhost:3002/api/universities',
          scholarshipService: 'http://localhost:3003/api/scholarships',
          emailService: 'http://localhost:3004/api/email'
        },
        logLevel: 'debug',
        tracingEnabled: true,
        featureFlags: {
          enableAdvancedAnalytics: false,
          enableBetaFeatures: true,
          enableCaching: true
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        apiEndpoints: {
          documentService: 'https://staging-api.edulen.com/documents',
          universityService: 'https://staging-api.edulen.com/universities',
          scholarshipService: 'https://staging-api.edulen.com/scholarships',
          emailService: 'https://staging-api.edulen.com/email'
        },
        logLevel: 'info',
        tracingEnabled: true,
        featureFlags: {
          enableAdvancedAnalytics: true,
          enableBetaFeatures: true,
          enableCaching: true
        }
      };

    case 'production':
      return {
        ...baseConfig,
        apiEndpoints: {
          documentService: 'https://api.edulen.com/documents',
          universityService: 'https://api.edulen.com/universities',
          scholarshipService: 'https://api.edulen.com/scholarships',
          emailService: 'https://api.edulen.com/email'
        },
        logLevel: 'warn',
        tracingEnabled: false,
        metricsEnabled: true,
        featureFlags: {
          enableAdvancedAnalytics: true,
          enableBetaFeatures: false,
          enableCaching: true
        }
      };

    default:
      return baseConfig;
  }
};

// Pre-configured agent configurations for EduLen
export const EDULEN_AGENT_CONFIGS: AgentCapabilityMap<PartialAgentConfig> = {
  [AgentCapability.DOCUMENT_ANALYSIS]: {
    name: 'AI Document Assistant',
    description: 'Analyzes and optimizes documents like SOPs, resumes, and essays',
    capabilities: [AgentCapability.DOCUMENT_ANALYSIS],
    tools: [createDocumentAnalysisTool()],
    maxConcurrentTasks: 3,
    timeout: 45000,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      burstLimit: 5,
      windowSize: 60000
    }
  },

  [AgentCapability.FINANCIAL_PLANNING]: {
    name: 'Financial Planning Agent',
    description: 'Provides budget planning and financial analysis for study abroad',
    capabilities: [AgentCapability.FINANCIAL_PLANNING, AgentCapability.SCHOLARSHIP_SEARCH],
    tools: [createFinancialPlanningTool(), createScholarshipSearchTool()],
    maxConcurrentTasks: 2,
    timeout: 30000
  },

  [AgentCapability.UNIVERSITY_RESEARCH]: {
    name: 'AI University Comparison Agent',
    description: 'Researches and compares universities based on user criteria',
    capabilities: [AgentCapability.UNIVERSITY_RESEARCH],
    tools: [createUniversitySearchTool()],
    maxConcurrentTasks: 5,
    timeout: 20000,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
      burstLimit: 20,
      windowSize: 60000
    }
  },

  [AgentCapability.APPLICATION_TRACKING]: {
    name: 'AI Application Tracker',
    description: 'Tracks application deadlines and requirements',
    capabilities: [AgentCapability.APPLICATION_TRACKING],
    tools: [],
    maxConcurrentTasks: 1,
    timeout: 15000
  },

  [AgentCapability.SCHOLARSHIP_SEARCH]: {
    name: 'Scholarship Auto-Applicator',
    description: 'Finds and applies to relevant scholarships automatically',
    capabilities: [AgentCapability.SCHOLARSHIP_SEARCH],
    tools: [createScholarshipSearchTool()],
    maxConcurrentTasks: 3,
    timeout: 35000
  },

  [AgentCapability.EMAIL_COMPOSITION]: {
    name: 'Email Writing Assistant',
    description: 'Composes professional emails for academic and professional purposes',
    capabilities: [AgentCapability.EMAIL_COMPOSITION],
    tools: [createEmailCompositionTool()],
    maxConcurrentTasks: 10,
    timeout: 10000
  },

  [AgentCapability.COURSE_PLANNING]: {
    name: 'Course Planner Agent',
    description: 'Plans academic curriculum and course sequences',
    capabilities: [AgentCapability.COURSE_PLANNING],
    tools: [],
    maxConcurrentTasks: 2,
    timeout: 25000
  },

  [AgentCapability.PEER_MATCHING]: {
    name: 'Peer Community Builder',
    description: 'Connects students with similar interests and goals',
    capabilities: [AgentCapability.PEER_MATCHING, AgentCapability.NETWORKING],
    tools: [],
    maxConcurrentTasks: 1,
    timeout: 20000
  },

  [AgentCapability.TIMELINE_PLANNING]: {
    name: 'Long-Term Planner Agent',
    description: 'Creates comprehensive timeline for study abroad journey',
    capabilities: [AgentCapability.TIMELINE_PLANNING],
    tools: [],
    maxConcurrentTasks: 1,
    timeout: 30000
  },

  [AgentCapability.DOCUMENT_VERIFICATION]: {
    name: 'Advanced AI Tools',
    description: 'Verifies documents and detects fraudulent certificates',
    capabilities: [AgentCapability.DOCUMENT_VERIFICATION],
    tools: [],
    maxConcurrentTasks: 2,
    timeout: 40000,
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      burstLimit: 3,
      windowSize: 60000
    }
  },

  [AgentCapability.PERSONALIZED_ADVICE]: {
    name: 'Personalized Study Abroad Advisor',
    description: 'Provides customized guidance based on individual goals and profile',
    capabilities: [
      AgentCapability.PERSONALIZED_ADVICE,
      AgentCapability.UNIVERSITY_RESEARCH,
      AgentCapability.FINANCIAL_PLANNING
    ],
    tools: [createUniversitySearchTool(), createFinancialPlanningTool()],
    maxConcurrentTasks: 2,
    timeout: 45000
  },

  [AgentCapability.NETWORKING]: {
    name: 'AI Connection Engine',
    description: 'Facilitates networking and professional connections',
    capabilities: [AgentCapability.NETWORKING, AgentCapability.PEER_MATCHING],
    tools: [],
    maxConcurrentTasks: 1,
    timeout: 25000
  },

  [AgentCapability.AUTOMATED_APPLICATIONS]: {
    name: 'AI Suggestion Engine',
    description: 'Provides intelligent suggestions and automated application features',
    capabilities: [
      AgentCapability.AUTOMATED_APPLICATIONS,
      AgentCapability.APPLICATION_TRACKING
    ],
    tools: [],
    maxConcurrentTasks: 3,
    timeout: 35000
  }
};

// Configuration factory for EduLen agents
export class EduLenAgentConfigFactory {
  private static instance: EduLenAgentConfigFactory;
  private environment: Environment;

  private constructor(environment: Environment = 'development') {
    this.environment = environment;
  }

  static getInstance(environment?: Environment): EduLenAgentConfigFactory {
    if (!EduLenAgentConfigFactory.instance) {
      EduLenAgentConfigFactory.instance = new EduLenAgentConfigFactory(environment);
    }
    return EduLenAgentConfigFactory.instance;
  }

  setEnvironment(environment: Environment): void {
    this.environment = environment;
  }

  createAgentConfig(
    capability: AgentCapability,
    overrides: Partial<AgentConfiguration> = {}
  ): AgentConfiguration {
    const baseConfig = EDULEN_AGENT_CONFIGS[capability];
    if (!baseConfig) {
      throw new Error(`No configuration found for capability: ${capability}`);
    }

    const agentId = overrides.id || createAgentId(`edulen-${capability}-agent`);

    return AgentConfigurationBuilder.create()
      .withId(agentId.toString())
      .withName(overrides.name || baseConfig.name || 'EduLen AI Agent')
      .withDescription(overrides.description || baseConfig.description || '')
      .withVersion(overrides.version || '1.0.0')
      .withCapabilities(overrides.capabilities || baseConfig.capabilities || [capability])
      .withTools(overrides.tools || baseConfig.tools || [])
      .withConcurrency(overrides.maxConcurrentTasks || baseConfig.maxConcurrentTasks || 1)
      .withTimeout(overrides.timeout || baseConfig.timeout || 30000)
      .withRetryConfig(overrides.retryConfig || baseConfig.retryConfig || getDefaultRetryConfig())
      .withRateLimit(overrides.rateLimit || baseConfig.rateLimit || getDefaultRateLimit())
      .withDependencies(overrides.dependencies || baseConfig.dependencies || [])
      .withEnvironment(overrides.environment || getEnvironmentConfig(this.environment))
      .build();
  }

  createAllAgentConfigs(): Map<AgentCapability, AgentConfiguration> {
    const configs = new Map<AgentCapability, AgentConfiguration>();

    for (const capability of Object.values(AgentCapability)) {
      try {
        const config = this.createAgentConfig(capability);
        configs.set(capability, config);
      } catch (error) {
        console.warn(`Failed to create config for capability ${capability}:`, error);
      }
    }

    return configs;
  }

  validateConfiguration(config: AgentConfiguration): ValidatedAgentConfig {
    // Validation logic
    if (!config.id || !config.name || !config.version) {
      throw new Error('Invalid configuration: Missing required fields');
    }

    if (!config.capabilities || config.capabilities.length === 0) {
      throw new Error('Invalid configuration: No capabilities defined');
    }

    if (config.maxConcurrentTasks < 1) {
      throw new Error('Invalid configuration: maxConcurrentTasks must be at least 1');
    }

    if (config.timeout < 1000) {
      throw new Error('Invalid configuration: timeout must be at least 1000ms');
    }

    // Return validated configuration with brand
    return { ...config, _validated: true } as ValidatedAgentConfig;
  }
}

// Utility functions
export const getAgentConfigForCapability = (
  capability: AgentCapability,
  environment: Environment = 'development'
): AgentConfiguration => {
  const factory = EduLenAgentConfigFactory.getInstance(environment);
  return factory.createAgentConfig(capability);
};

export const getAllAgentConfigs = (
  environment: Environment = 'development'
): Map<AgentCapability, AgentConfiguration> => {
  const factory = EduLenAgentConfigFactory.getInstance(environment);
  return factory.createAllAgentConfigs();
};

export const isValidAgentConfig = (config: unknown): config is AgentConfiguration => {
  return (
    typeof config === 'object' &&
    config !== null &&
    'id' in config &&
    'name' in config &&
    'version' in config &&
    'capabilities' in config &&
    Array.isArray((config as any).capabilities)
  );
};

// Export the factory instance for external use
export const agentConfigFactory = EduLenAgentConfigFactory.getInstance();

// Configuration constants
export const AGENT_CONFIG_VERSION = '1.0.0';
export const MAX_AGENT_TIMEOUT = 300000; // 5 minutes
export const MIN_AGENT_TIMEOUT = 1000; // 1 second
export const DEFAULT_AGENT_VERSION = '1.0.0';

// Type exports for convenience
export type { Environment };
export { AgentConfigurationBuilder, EduLenAgentConfigFactory };