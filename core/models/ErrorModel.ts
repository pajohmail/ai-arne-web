/**
 * Error Model & Taxonomy
 * Provides structured exception hierarchy and error handling strategies
 * to enable AI generation of comprehensive error handling code
 */

export interface ErrorTaxonomy {
  baseExceptionClass: string;
  categories: ErrorCategory[];
  httpStatusMapping: StatusCodeMapping[];
  loggingStrategy: LoggingStrategy;
}

export interface ErrorCategory {
  name: string;
  parentCategory?: string;        // For hierarchical error structures
  exceptionClass: string;
  httpStatus: number;
  errorCodes: ErrorCode[];
  handlingStrategy: 'Retry' | 'FailFast' | 'Fallback' | 'LogAndContinue' | 'Circuit Breaker';
  retryConfig?: RetryConfiguration;
}

export interface ErrorCode {
  code: string;                   // "USER_NOT_FOUND", "INVALID_INPUT", "AUTH_FAILED"
  message: string;                // Technical error message
  userMessage?: string;           // User-friendly message
  recoverable: boolean;
  logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  includeStackTrace: boolean;
  metadata?: Record<string, any>; // Additional context
}

export interface RetryConfiguration {
  maxAttempts: number;
  backoffStrategy: 'Exponential' | 'Linear' | 'Fixed' | 'Jitter';
  initialDelayMs: number;
  maxDelayMs: number;
  retryableHttpStatuses?: number[]; // [429, 503, 504]
}

export interface StatusCodeMapping {
  httpStatus: number;
  description: string;
  errorCategories: string[];
  examples: string[];
}

export interface LoggingStrategy {
  logErrors: boolean;
  logWarnings: boolean;
  includeRequestContext: boolean;
  includeUserContext: boolean;
  sanitizeSensitiveData: boolean;
  sensitiveFields: string[];      // ["password", "token", "creditCard"]
}

/**
 * Common HTTP Status Codes:
 * - 400: Bad Request (validation errors)
 * - 401: Unauthorized (authentication failed)
 * - 403: Forbidden (authorization failed)
 * - 404: Not Found (resource doesn't exist)
 * - 409: Conflict (duplicate resource)
 * - 422: Unprocessable Entity (semantic errors)
 * - 429: Too Many Requests (rate limiting)
 * - 500: Internal Server Error (unexpected errors)
 * - 503: Service Unavailable (dependency failures)
 */

/**
 * Example Error Hierarchy:
 *
 * ApplicationError (base)
 * ├── ValidationError (400)
 * │   ├── InvalidInputError
 * │   ├── MissingFieldError
 * │   └── FormatError
 * ├── AuthenticationError (401)
 * │   ├── InvalidCredentialsError
 * │   ├── TokenExpiredError
 * │   └── MissingAuthError
 * ├── AuthorizationError (403)
 * │   ├── InsufficientPermissionsError
 * │   └── ResourceAccessDeniedError
 * ├── NotFoundError (404)
 * ├── ConflictError (409)
 * │   ├── DuplicateResourceError
 * │   └── ConcurrentModificationError
 * ├── ExternalServiceError (503)
 * │   ├── DatabaseConnectionError
 * │   ├── ApiTimeoutError
 * │   └── ThirdPartyServiceError
 * └── InternalError (500)
 *     ├── ConfigurationError
 *     └── UnexpectedError
 */

export interface ErrorHandlingSpecification {
  taxonomy: ErrorTaxonomy;
  exceptionHierarchy: string;     // Mermaid class diagram of exception hierarchy
  errorFlowDiagram?: string;      // Mermaid flowchart of error handling flow
  completed: boolean;
}

/**
 * Example TypeScript Exception Class:
 * ```typescript
 * export class ValidationError extends ApplicationError {
 *   constructor(message: string, public fields?: string[]) {
 *     super(message);
 *     this.name = 'ValidationError';
 *     this.httpStatus = 400;
 *     this.recoverable = false;
 *   }
 * }
 *
 * // Usage:
 * if (!email.includes('@')) {
 *   throw new ValidationError('Invalid email format', ['email']);
 * }
 * ```
 */

/**
 * Example Error Handler Middleware:
 * ```typescript
 * export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
 *   if (err instanceof ValidationError) {
 *     logger.warn('Validation error', { error: err.message, fields: err.fields });
 *     return res.status(400).json({
 *       error: {
 *         code: 'VALIDATION_ERROR',
 *         message: err.message,
 *         fields: err.fields
 *       }
 *     });
 *   }
 *
 *   if (err instanceof AuthenticationError) {
 *     logger.warn('Authentication failed', { error: err.message });
 *     return res.status(401).json({
 *       error: {
 *         code: 'AUTH_FAILED',
 *         message: 'Authentication required'
 *       }
 *     });
 *   }
 *
 *   // Default: Internal Server Error
 *   logger.error('Unexpected error', { error: err, stack: err.stack });
 *   return res.status(500).json({
 *     error: {
 *       code: 'INTERNAL_ERROR',
 *       message: 'An unexpected error occurred'
 *     }
 *   });
 * }
 * ```
 */
