import { UseCase } from "@/core/models/DesignDocument";

export class PromptFactory {
    // Phase 0: Requirements Specification
    static createRequirementsExtractionPrompt(chatLog: string): string {
        return `
        You are an expert software requirements analyst using the Volere requirements template methodology.
        Analyze the conversation and extract/update requirements specification information.

        INSTRUCTIONS:
        1. Act professionally and help the user define complete requirements.
        2. IMPORTANT: ADAPT TO THE USER'S LANGUAGE.
        3. Be PROACTIVE: Ask leading questions to gather missing information:
           - "What is the main business purpose of this system?"
           - "Who are the primary users? Any secondary stakeholders?"
           - "Are there any technical constraints (technology, platform, integration)?"
           - "What are the key functional requirements?"
           - "What quality attributes matter most (performance, security, usability)?"
        4. When you have solid baseline requirements, PROPOSE moving to Analysis phase.
        5. Extract and structure requirements following the Volere template.

        Return JSON with this structure:
        {
            "reply": "Your conversational response...",
            "projectPurpose": "Brief statement of project purpose",
            "stakeholders": [
                { "id": "...", "name": "...", "role": "...", "interests": ["..."] }
            ],
            "constraints": [
                { "id": "...", "type": "technical|business|regulatory|schedule", "description": "..." }
            ],
            "functionalRequirements": [
                { "id": "...", "title": "...", "description": "...", "priority": "high|medium|low" }
            ],
            "qualityRequirements": [
                { "id": "...", "category": "performance|security|usability|maintainability|reliability", "description": "...", "metric": "..." }
            ]
        }

        Chat Log:
        ${chatLog}
        `;
    }

    // Phase 1: Technology Stack
    static createTechStackPrompt(chatLog: string, requirements?: string): string {
        const requirementsContext = requirements
            ? `\n\nREQUIREMENTS CONTEXT:\nThe following requirements were identified:\n${requirements}\n\nUse these to recommend appropriate technologies.\n`
            : '';

        return `
        You are an expert software architect specialized in technology selection.
        Help the user choose the best technology stack for their project.
        ${requirementsContext}

        INSTRUCTIONS:
        1. Act professionally and ask LEADING questions to determine the best tech stack.
        2. IMPORTANT: ADAPT TO THE USER'S LANGUAGE (Swedish/English).
        3. Ask about:
           - Expected user load and scalability needs
           - Application type (web, mobile, desktop, hybrid)
           - Team skills and experience level
           - Budget and timeline constraints
           - Integration requirements
           - Performance and security requirements
           - AI/LLM needs: Will the project use AI features?
           - LLM providers: OpenAI, Gemini, Claude, or other?
           - RAG (Retrieval Augmented Generation) requirements
           - Vector database needs (Pinecone, Weaviate, Chroma, etc.)
           - Embedding models and similarity search requirements
        4. When you have enough information, RECOMMEND specific technologies for:
           - Frontend framework
           - Backend framework/language
           - Database (SQL/NoSQL)
           - AI/LLM stack (if applicable): provider, vector DB, embeddings
           - Hosting/deployment platform
           - Additional tools (CI/CD, monitoring, etc.)
        5. Provide REASONING for each recommendation based on the project needs.

        Return JSON with this structure:
        {
            "reply": "Your conversational response...",
            "frontend": { "name": "...", "category": "...", "reasoning": "..." },
            "backend": { "name": "...", "category": "...", "reasoning": "..." },
            "database": { "name": "...", "category": "...", "reasoning": "..." },
            "hosting": { "name": "...", "category": "...", "reasoning": "..." },
            "additionalTools": [
                { "name": "...", "category": "AI/LLM|VectorDB|CI/CD|Monitoring|...", "reasoning": "..." }
            ],
            "reasoning": "Overall explanation of why this stack fits the project..."
        }

        Chat Log:
        ${chatLog}
        `;
    }

    // Phase 2: Analysis
    static createUseCaseExtractionPrompt(chatLog: string, requirements?: string): string {
        const requirementsContext = requirements
            ? `\n\nREQUIREMENTS CONTEXT:\nThe following requirements were defined in the Requirements Specification phase:\n${requirements}\n\nUse these requirements to guide your use case identification.\n`
            : '';

        return `
        Analyze the following conversation about a software system.
        ${requirementsContext}
        Focus on identifying USE CASES that fulfill the requirements.

        1. Act as an expert software architect. Provide a helpful, concise response.
        2. IMPORTANTE: ADAPT TO THE USER'S LANGUAGE.
        3. CRITICAL: Be PROACTIVE and DRIVE the conversation forward. Instead of open-ended questions, ask LEADING questions (e.g., "Shall we include a dashboard for admins?", "I assume users need a login, correct?").
        4. When you have a solid baseline, explicitly PROPOSE moving to the 'System Design' phase.
        5. Extract any new Use Cases or update existing ones based on the conversation.

        Return the result as a JSON object with the following structure:
        {
            "reply": "Your conversational response here...",
            "useCases": [
                { "id": "...", "title": "...", "narrative": "...", "actors": ["..."] }
            ]
        }

        Chat Log:
        ${chatLog}
        `;
    }

    static createDomainModelPrompt(useCases: UseCase[]): string {
        return `
        Based on the following Use Cases, create a Domain Model in Mermaid class diagram syntax.
        Focus on the conceptual classes, their attributes, and relationships.
        Do NOT include methods.
        Return ONLY the Mermaid code, wrapped in \`\`\`mermaid blocks.
        
        Use Cases:
        ${JSON.stringify(useCases)}
        `;
    }

    // Phase 2: System Design
    static createArchitecturePrompt(domainModel: string, requirements: string): string {
        return `
        Based on the Domain Model and requirements, propose a System Architecture (e.g., Layered, Microservices).
        Create a Package Diagram in Mermaid syntax that groups the domain classes into logical subsystems/packages.
        Return ONLY the Mermaid code.
        
        Domain Model:
        ${domainModel}
        
        Requirements:
        ${requirements}
        `;
    }

    // Phase 3: Object Design
    static createClassDiagramPrompt(domainModel: string, architecture: string): string {
        return `
        Refine the Domain Model into a Design Class Diagram.
        Apply GRASP and SOLID principles.
        - Add appropriate methods to classes.
        - Add visibility modifiers (+, -, #).
        - Add type information for attributes and return types.
        - Ensure High Cohesion and Low Coupling.
        
        Return the result in Mermaid class diagram syntax.
        
        Domain Model:
        ${domainModel}
        
        Architecture:
        ${architecture}
        `;
    }

    // Phase 4: Validation
    static createValidationPrompt(useCases: UseCase[], classDiagram: string): string {
        return `
        Analyze the following Design Class Diagram against the original Use Cases.
        Perform a Traceability Check:
        1. For each Use Case, identify which classes and methods support it.
        2. Identify any missing functionality (Use Cases not supported by the design).
        3. Identify any unnecessary complexity (Classes/Methods not tracing back to a Use Case).

        Return the result as a Markdown report with the following sections:
        - ## Traceability Matrix (Table)
        - ## Missing Requirements
        - ## Unnecessary Components
        - ## Overall Quality Score (1-10)

        Use Cases:
        ${JSON.stringify(useCases)}

        Class Diagram:
        ${classDiagram}
        `;
    }

    // Gherkin BDD Scenarios Generation
    static createGherkinPrompt(useCase: UseCase, requirements?: any): string {
        const reqContext = requirements ? `\n\nREQUIREMENTS CONTEXT:\n${JSON.stringify(requirements, null, 2)}\n` : '';

        return `
        Convert this use case to Gherkin BDD scenarios.
        Generate comprehensive test scenarios using Given-When-Then format.
        ${reqContext}

        USE CASE:
        - Title: ${useCase.title}
        - Narrative: ${useCase.narrative}
        - Actors: ${useCase.actors.join(', ')}

        INSTRUCTIONS:
        1. Generate 3-5 scenarios covering:
           - Happy path (successful execution)
           - Edge cases (boundary conditions)
           - Error conditions (validation failures, exceptions)
        2. Use proper Gherkin syntax:
           - Feature: [description]
           - Scenario: [description]
           - Given [preconditions]
           - When [action]
           - Then [expected outcome]
           - And [additional conditions/outcomes]
        3. Include data tables where appropriate
        4. Make scenarios executable and testable

        Return a JSON array with this structure:
        [
            {
                "feature": "Feature name/description",
                "scenario": "Scenario name",
                "steps": "Given...\\nWhen...\\nThen...\\nAnd..."
            }
        ]
        `;
    }

    // OpenAPI Specification Generation
    static createApiSpecPrompt(useCases: UseCase[], domainModel: string, techStack?: any): string {
        const backend = techStack?.backend?.name || 'REST API';

        return `
        Generate an OpenAPI 3.0 specification based on the use cases and domain model.

        USE CASES:
        ${JSON.stringify(useCases, null, 2)}

        DOMAIN MODEL:
        ${domainModel}

        BACKEND TECHNOLOGY:
        ${backend}

        INSTRUCTIONS:
        1. For each use case, define appropriate REST endpoints:
           - HTTP method (GET, POST, PUT, DELETE, PATCH)
           - Path with resource naming (e.g., /users, /users/{id})
           - Path parameters, query parameters
        2. Define request/response schemas using JSON Schema:
           - Request body schema (for POST, PUT, PATCH)
           - Response schemas for success (200, 201, 204)
           - Error responses (400, 401, 403, 404, 500)
        3. Include:
           - Operation summaries and descriptions
           - Authentication/security schemes (bearerAuth, apiKey, etc.)
           - Example request/response payloads
           - Content types (application/json)
        4. Follow RESTful conventions
        5. Derive schemas from domain model entities

        Return ONLY the complete OpenAPI YAML specification, wrapped in \`\`\`yaml blocks.
        Start with:
        openapi: 3.0.0
        info:
          title: [Project Name] API
          version: 1.0.0
        `;
    }

    // Requirements Traceability Matrix Generation
    static createTraceabilityPrompt(
        requirements: any,
        useCases: UseCase[],
        classDiagram: string,
        apiSpec?: string
    ): string {
        const apiContext = apiSpec ? `\n\nAPI SPECIFICATION:\n${apiSpec}\n` : '';

        return `
        Generate a comprehensive Requirements Traceability Matrix (RTM).
        Map each requirement to use cases, design elements, and test scenarios.
        ${apiContext}

        REQUIREMENTS:
        ${JSON.stringify(requirements, null, 2)}

        USE CASES:
        ${JSON.stringify(useCases, null, 2)}

        CLASS DIAGRAM:
        ${classDiagram}

        INSTRUCTIONS:
        1. For each requirement, assign a unique ID:
           - Functional: REQ-FR-001, REQ-FR-002, etc.
           - Quality: REQ-QR-001, REQ-QR-002, etc.
           - Constraint: REQ-CR-001, REQ-CR-002, etc.
        2. Trace each requirement to:
           - Related use case IDs
           - Implementing classes (from class diagram)
           - Implementing methods (from class diagram)
           - API endpoints (if API spec provided)
           - Test scenarios (Gherkin scenarios if available)
        3. Determine coverage status:
           - "covered": Full implementation found
           - "partial": Some implementation found
           - "missing": No implementation found
        4. Calculate coverage statistics:
           - Total requirements count
           - Implemented count
           - Coverage percentage
           - List untraced requirements
           - List unnecessary components (not traced to any requirement)

        Return JSON with this structure:
        {
            "requirements": [
                {
                    "requirementId": "REQ-FR-001",
                    "requirementType": "functional",
                    "description": "...",
                    "useCases": ["UC-001"],
                    "designElements": {
                        "classes": ["User", "UserService"],
                        "methods": ["createUser", "validateUser"],
                        "apiEndpoints": ["/users POST"]
                    },
                    "testScenarios": ["User registration happy path"],
                    "status": "covered"
                }
            ],
            "coverage": {
                "totalRequirements": 10,
                "implementedRequirements": 8,
                "coveragePercentage": 80,
                "untracedRequirements": ["REQ-FR-009", "REQ-FR-010"],
                "unnecessaryComponents": ["HelperClass.unusedMethod"]
            }
        }
        `;
    }

    // TIER 2: Algorithm Specifications
    static createAlgorithmSpecPrompt(
        operation: string,
        contract: any,
        context: string
    ): string {
        return `
        Generate a detailed algorithm specification for this operation.

        OPERATION: ${operation}
        PURPOSE: ${contract.description || 'Not specified'}
        PRECONDITIONS: ${JSON.stringify(contract.preConditions || [])}
        POSTCONDITIONS: ${JSON.stringify(contract.postConditions || [])}
        CONTEXT: ${context}

        INSTRUCTIONS:
        1. Write step-by-step pseudocode using standard notation:
           - IF/ELSE for conditionals
           - FOR/WHILE for loops
           - FUNCTION calls
           - RETURN statements
           - Variable assignments
        2. Identify edge cases and how to handle them
        3. Specify time/space complexity (Big O notation)
        4. Provide concrete examples with inputs/outputs
        5. If the algorithm is complex (>10 steps), generate a Mermaid flowchart

        PSEUDOCODE FORMAT:
        STEP 1: [Description]
        STEP 2: IF [condition] THEN
          STEP 2.1: [Action]
        STEP 3: END IF
        STEP 4: FOR each [item] in [collection]
          STEP 4.1: [Action]
        STEP 5: END FOR
        STEP 6: RETURN [result]

        Return JSON with this structure:
        {
            "operation": "${operation}",
            "purpose": "Clear description of what this algorithm does",
            "inputParameters": [
                {
                    "name": "paramName",
                    "type": "string",
                    "description": "What this parameter represents",
                    "optional": false
                }
            ],
            "outputType": "Return type (string, number, object, etc.)",
            "pseudocode": "STEP 1: Initialize...\nSTEP 2: IF ...",
            "flowChart": "graph TD\n  A[Start] --> B{Condition?}\n  B -->|Yes| C[Action]\n  B -->|No| D[Other Action]",
            "complexity": {
                "time": "O(n)",
                "space": "O(1)",
                "explanation": "Why this complexity"
            },
            "edgeCases": [
                {
                    "condition": "Empty input",
                    "handling": "Return empty result",
                    "expectedBehavior": "Should not throw error"
                }
            ],
            "examples": [
                {
                    "input": {"param1": "value1"},
                    "output": "expectedOutput",
                    "explanation": "Step-by-step walkthrough"
                }
            ]
        }
        `;
    }

    // TIER 2: Business Rules (DMN Decision Tables)
    static createDecisionTablePrompt(
        useCase: UseCase,
        requirements: any,
        domainModel: string
    ): string {
        return `
        Identify complex business rules in this use case that should be modeled as decision tables.

        USE CASE: ${useCase.title}
        NARRATIVE: ${useCase.narrative}
        ACTORS: ${useCase.actors.join(', ')}

        REQUIREMENTS CONTEXT:
        ${JSON.stringify(requirements, null, 2)}

        DOMAIN MODEL:
        ${domainModel}

        INSTRUCTIONS:
        1. Look for multi-conditional logic (IF-THEN-ELSE chains with multiple conditions)
        2. Identify decision points where multiple inputs affect outputs
        3. Create DMN decision tables with:
           - Clear input conditions
           - Output actions/values
           - Hit policy (UNIQUE, FIRST, PRIORITY, etc.)
           - All possible rule combinations
        4. Use FEEL expressions where appropriate:
           - Comparisons: >, <, >=, <=, =, !=
           - Ranges: [100..500], ]0..100[
           - Lists: "Premium", "Gold", "Silver"
           - Wildcards: * (any value)

        COMMON DECISION TABLE PATTERNS:
        - Pricing/discount logic (input: customer type, order amount; output: discount %)
        - Approval workflows (input: amount, role; output: approved, approver)
        - Risk assessment (input: score, history; output: risk level, action)
        - Eligibility checks (input: age, status; output: eligible, reason)
        - Resource allocation (input: priority, availability; output: allocated resource)

        Return JSON array with this structure:
        [
            {
                "id": "DT-001",
                "name": "Pricing Decision",
                "description": "Determines discount based on customer type and order amount",
                "hitPolicy": "UNIQUE",
                "inputs": [
                    {
                        "id": "input1",
                        "label": "Customer Type",
                        "expression": "customer.type",
                        "type": "string",
                        "allowedValues": ["Premium", "Standard"]
                    },
                    {
                        "id": "input2",
                        "label": "Order Amount",
                        "expression": "order.total",
                        "type": "number"
                    }
                ],
                "outputs": [
                    {
                        "id": "output1",
                        "label": "Discount %",
                        "name": "discountPercentage",
                        "type": "number"
                    },
                    {
                        "id": "output2",
                        "label": "Priority Shipping",
                        "name": "priorityShipping",
                        "type": "boolean"
                    }
                ],
                "rules": [
                    {
                        "inputEntries": ["\\"Premium\\"", "> 1000"],
                        "outputEntries": ["20", "true"],
                        "description": "Premium customers with large orders get 20% off and priority shipping"
                    },
                    {
                        "inputEntries": ["\\"Premium\\"", "> 500"],
                        "outputEntries": ["15", "true"],
                        "description": "Premium customers with medium orders get 15% off and priority shipping"
                    },
                    {
                        "inputEntries": ["\\"Standard\\"", "> 1000"],
                        "outputEntries": ["10", "false"],
                        "description": "Standard customers with large orders get 10% off"
                    },
                    {
                        "inputEntries": ["*", "*"],
                        "outputEntries": ["0", "false"],
                        "description": "Default: no discount, no priority shipping"
                    }
                ]
            }
        ]

        IMPORTANT:
        - Only create decision tables for truly complex conditional logic
        - Each decision table should have at least 3 rules
        - Ensure all combinations are covered (use * wildcard for defaults)
        - Rules should be mutually exclusive for UNIQUE hit policy
        `;
    }

    // TIER 2 Fas 2: Database Schema Generation
    static createDatabaseSchemaPrompt(
        domainModel: string,
        classDiagram: string,
        techStack: any
    ): string {
        const dbType = techStack?.database?.name || 'PostgreSQL';
        const ormFramework = techStack?.backend?.name?.includes('TypeScript') || techStack?.backend?.name?.includes('Node')
            ? 'TypeORM'
            : techStack?.backend?.name?.includes('Python')
            ? 'SQLAlchemy'
            : 'Prisma';

        return `
        Generate a complete database schema specification from the domain model.

        DATABASE TYPE: ${dbType}
        ORM FRAMEWORK: ${ormFramework}

        DOMAIN MODEL (Mermaid):
        ${domainModel}

        CLASS DIAGRAM (Mermaid):
        ${classDiagram}

        INSTRUCTIONS:
        1. Convert each domain class to a database table:
           - Map class name to table name (plural, snake_case convention)
           - Map attributes to columns with appropriate SQL data types
           - Identify primary keys (usually 'id')
           - Add timestamps (created_at, updated_at) where appropriate

        2. Define relationships:
           - OneToMany → foreign key in target table
           - ManyToOne → foreign key in source table
           - ManyToMany → create junction table
           - Specify CASCADE behavior for foreign keys

        3. Create indexes:
           - Primary key indexes (automatic)
           - Foreign key indexes (for query performance)
           - Unique constraints where needed
           - Consider indexes on frequently queried columns

        4. Generate ORM entity mappings:
           - Decorators/annotations for ${ormFramework}
           - Relationship mappings with cascade options
           - Validation rules

        5. Include migration strategy:
           - Initial schema creation DDL
           - Version control approach

        SQL DATA TYPE MAPPING:
        - String → VARCHAR(255) or TEXT
        - Number/Integer → INTEGER or BIGINT
        - Decimal/Float → DECIMAL(10,2) or FLOAT
        - Boolean → BOOLEAN
        - Date/DateTime → TIMESTAMP or DATETIME
        - UUID → UUID or VARCHAR(36)
        - JSON → JSON or JSONB

        Return JSON with this structure:
        {
            "databaseSchema": {
                "tables": [
                    {
                        "name": "users",
                        "schema": "public",
                        "columns": [
                            {
                                "name": "id",
                                "type": "UUID",
                                "nullable": false,
                                "autoIncrement": false,
                                "unique": true,
                                "comment": "Primary key"
                            },
                            {
                                "name": "email",
                                "type": "VARCHAR",
                                "length": 255,
                                "nullable": false,
                                "unique": true
                            },
                            {
                                "name": "created_at",
                                "type": "TIMESTAMP",
                                "nullable": false,
                                "defaultValue": "CURRENT_TIMESTAMP"
                            }
                        ],
                        "primaryKey": ["id"],
                        "uniqueConstraints": [
                            {"name": "unique_email", "columns": ["email"]}
                        ]
                    }
                ],
                "relationships": [
                    {
                        "name": "user_orders",
                        "type": "OneToMany",
                        "sourceTable": "users",
                        "targetTable": "orders",
                        "sourceColumn": "id",
                        "targetColumn": "user_id"
                    }
                ],
                "indexes": [
                    {
                        "name": "idx_users_email",
                        "table": "users",
                        "columns": ["email"],
                        "unique": true,
                        "type": "BTREE"
                    }
                ],
                "ormConfig": {
                    "framework": "${ormFramework}",
                    "entities": [
                        {
                            "className": "User",
                            "tableName": "users",
                            "properties": [
                                {
                                    "propertyName": "id",
                                    "columnName": "id",
                                    "type": "string",
                                    "nullable": false
                                },
                                {
                                    "propertyName": "orders",
                                    "columnName": null,
                                    "type": "Order[]",
                                    "nullable": false,
                                    "relation": {
                                        "type": "OneToMany",
                                        "targetEntity": "Order",
                                        "inverseProperty": "user",
                                        "cascadeActions": ["persist", "remove"]
                                    }
                                }
                            ]
                        }
                    ],
                    "connectionConfig": {
                        "database": "project_db",
                        "host": "localhost",
                        "port": 5432,
                        "ssl": false
                    }
                }
            },
            "completed": true
        }

        IMPORTANT:
        - Follow naming conventions: tables (snake_case, plural), columns (snake_case)
        - Always include primary keys
        - Add foreign key constraints with appropriate CASCADE rules
        - Include indexes for foreign keys and frequently queried columns
        - Generate complete ORM entity mappings
        `;
    }

    // TIER 2 Fas 2: Error Taxonomy & Exception Hierarchy
    static createErrorTaxonomyPrompt(
        requirements: any,
        useCases: UseCase[],
        apiSpec?: string
    ): string {
        const apiContext = apiSpec ? `\n\nAPI SPECIFICATION:\n${apiSpec}\n` : '';

        return `
        Generate a comprehensive error taxonomy and exception hierarchy for this system.

        REQUIREMENTS:
        ${JSON.stringify(requirements, null, 2)}

        USE CASES:
        ${JSON.stringify(useCases, null, 2)}
        ${apiContext}

        INSTRUCTIONS:
        1. Design a hierarchical exception structure:
           - Base exception class (e.g., ApplicationError)
           - Category exceptions (ValidationError, AuthenticationError, etc.)
           - Specific exceptions for each error case

        2. Map exceptions to HTTP status codes:
           - 400: Bad Request (validation errors)
           - 401: Unauthorized (authentication failed)
           - 403: Forbidden (authorization failed)
           - 404: Not Found (resource doesn't exist)
           - 409: Conflict (duplicate, concurrent modification)
           - 422: Unprocessable Entity (semantic errors)
           - 429: Too Many Requests (rate limiting)
           - 500: Internal Server Error (unexpected errors)
           - 503: Service Unavailable (dependency failures)

        3. Define error codes:
           - Use UPPER_SNAKE_CASE format
           - Make them descriptive and unique
           - Include both technical and user-friendly messages

        4. Specify handling strategies:
           - Retry: Temporary failures (network, timeouts)
           - FailFast: Invalid input, authentication failures
           - Fallback: Degraded mode when dependencies fail
           - LogAndContinue: Non-critical errors
           - Circuit Breaker: Repeated failures to external services

        5. Configure retry logic where applicable:
           - Max retry attempts
           - Backoff strategy (Exponential, Linear, Jitter)
           - Delay configuration

        Return JSON with this structure:
        {
            "taxonomy": {
                "baseExceptionClass": "ApplicationError",
                "categories": [
                    {
                        "name": "ValidationError",
                        "parentCategory": "ApplicationError",
                        "exceptionClass": "ValidationError",
                        "httpStatus": 400,
                        "errorCodes": [
                            {
                                "code": "INVALID_EMAIL",
                                "message": "Email format is invalid",
                                "userMessage": "Please provide a valid email address",
                                "recoverable": false,
                                "logLevel": "WARN",
                                "includeStackTrace": false
                            },
                            {
                                "code": "MISSING_REQUIRED_FIELD",
                                "message": "Required field is missing",
                                "userMessage": "Please fill in all required fields",
                                "recoverable": false,
                                "logLevel": "WARN",
                                "includeStackTrace": false
                            }
                        ],
                        "handlingStrategy": "FailFast"
                    },
                    {
                        "name": "AuthenticationError",
                        "parentCategory": "ApplicationError",
                        "exceptionClass": "AuthenticationError",
                        "httpStatus": 401,
                        "errorCodes": [
                            {
                                "code": "INVALID_CREDENTIALS",
                                "message": "Username or password is incorrect",
                                "userMessage": "Invalid login credentials",
                                "recoverable": false,
                                "logLevel": "WARN",
                                "includeStackTrace": false
                            },
                            {
                                "code": "TOKEN_EXPIRED",
                                "message": "Authentication token has expired",
                                "userMessage": "Your session has expired. Please log in again",
                                "recoverable": true,
                                "logLevel": "INFO",
                                "includeStackTrace": false
                            }
                        ],
                        "handlingStrategy": "FailFast"
                    },
                    {
                        "name": "ExternalServiceError",
                        "parentCategory": "ApplicationError",
                        "exceptionClass": "ExternalServiceError",
                        "httpStatus": 503,
                        "errorCodes": [
                            {
                                "code": "DATABASE_CONNECTION_FAILED",
                                "message": "Failed to connect to database",
                                "userMessage": "Service temporarily unavailable",
                                "recoverable": true,
                                "logLevel": "ERROR",
                                "includeStackTrace": true
                            }
                        ],
                        "handlingStrategy": "Retry",
                        "retryConfig": {
                            "maxAttempts": 3,
                            "backoffStrategy": "Exponential",
                            "initialDelayMs": 1000,
                            "maxDelayMs": 10000,
                            "retryableHttpStatuses": [503, 504]
                        }
                    }
                ],
                "httpStatusMapping": [
                    {
                        "httpStatus": 400,
                        "description": "Bad Request - Client sent invalid data",
                        "errorCategories": ["ValidationError"],
                        "examples": ["INVALID_EMAIL", "MISSING_REQUIRED_FIELD"]
                    },
                    {
                        "httpStatus": 401,
                        "description": "Unauthorized - Authentication required",
                        "errorCategories": ["AuthenticationError"],
                        "examples": ["INVALID_CREDENTIALS", "TOKEN_EXPIRED"]
                    }
                ],
                "loggingStrategy": {
                    "logErrors": true,
                    "logWarnings": true,
                    "includeRequestContext": true,
                    "includeUserContext": true,
                    "sanitizeSensitiveData": true,
                    "sensitiveFields": ["password", "token", "creditCard", "ssn"]
                }
            },
            "completed": true
        }

        IMPORTANT:
        - Cover all major error scenarios from use cases
        - Include both client errors (4xx) and server errors (5xx)
        - Provide clear, actionable user messages
        - Configure appropriate retry strategies for transient failures
        - Ensure sensitive data is not logged
        `;
    }
}
