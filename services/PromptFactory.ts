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

    // TIER 3: Security Specification (Threat Model + Auth/Authz)
    static createSecuritySpecPrompt(
        requirements: any,
        useCases: any[],
        apiSpec?: string,
        dataModel?: any
    ): string {
        return `
        Generate a comprehensive security specification for this system.

        REQUIREMENTS:
        ${JSON.stringify(requirements, null, 2)}

        USE CASES:
        ${JSON.stringify(useCases, null, 2)}

        ${apiSpec ? `API SPECIFICATION:\n${apiSpec.substring(0, 2000)}` : ''}

        ${dataModel ? `DATA MODEL:\n${JSON.stringify(dataModel, null, 2).substring(0, 1000)}` : ''}

        INSTRUCTIONS:
        Generate a complete SecuritySpecification with:

        1. AUTHENTICATION STRATEGY:
           - Choose appropriate auth type (JWT, OAuth2, Session, SAML, etc.)
           - Specify token storage and session duration
           - MFA requirements and password policy
           - Consider: user types, SSO needs, mobile/web clients

        2. AUTHORIZATION MODEL:
           - Design RBAC/ABAC/ACL model
           - Define roles and permissions
           - Create permission matrix
           - Specify resource hierarchy if needed

        3. THREAT MODEL (STRIDE):
           - Identify assets (data, services, infrastructure)
           - List threats in each category:
             * Spoofing (identity theft)
             * Tampering (data modification)
             * Repudiation (deny actions)
             * Information Disclosure (data leakage)
             * Denial of Service
             * Elevation of Privilege
           - Assign likelihood and impact
           - Include CWE IDs for common vulnerabilities

        4. SECURITY CONTROLS:
           - Map to OWASP Top 10
           - Input validation, output encoding
           - CSRF, XSS, SQL injection prevention
           - Rate limiting, DDoS protection
           - Secure headers (CSP, HSTS, etc.)

        5. DATA PROTECTION:
           - Encryption at rest (algorithm, key size)
           - Encryption in transit (TLS 1.3)
           - Key management strategy
           - Data classification (Public, Internal, Confidential, Restricted)
           - PII handling and GDPR compliance

        6. ATTACK SURFACE:
           - List all entry points (API, UI, Database, etc.)
           - Identify trust boundaries
           - Map data flows with sensitivity levels

        Return JSON matching SecuritySpecification interface.

        EXAMPLE OUTPUT:
        {
            "authenticationStrategy": {
                "type": "JWT",
                "provider": "Custom",
                "tokenStorage": "Cookie",
                "sessionDuration": 1440,
                "refreshStrategy": "Sliding",
                "mfaRequired": true,
                "mfaMethod": "TOTP",
                "passwordPolicy": {
                    "minLength": 12,
                    "requireUppercase": true,
                    "requireLowercase": true,
                    "requireNumbers": true,
                    "requireSpecialChars": true,
                    "expirationDays": 90,
                    "preventReuse": 5
                }
            },
            "authorizationModel": {
                "type": "RBAC",
                "roles": [
                    {
                        "id": "admin",
                        "name": "Administrator",
                        "description": "Full system access",
                        "permissions": ["user:*", "system:*"]
                    },
                    {
                        "id": "user",
                        "name": "Regular User",
                        "description": "Standard user access",
                        "permissions": ["profile:read", "profile:write"]
                    }
                ]
            },
            "threatModel": {
                "methodology": "STRIDE",
                "assetInventory": [
                    {
                        "id": "asset-1",
                        "name": "User Credentials",
                        "type": "Data",
                        "sensitivity": "Restricted",
                        "description": "User passwords and authentication tokens"
                    }
                ],
                "threats": [
                    {
                        "id": "threat-1",
                        "category": "Spoofing",
                        "name": "Credential Theft via Phishing",
                        "description": "Attacker tricks users into revealing credentials",
                        "likelihood": "Medium",
                        "impact": "High",
                        "riskLevel": "High",
                        "affectedAssets": ["asset-1"],
                        "affectedComponents": ["Login System"],
                        "attackVector": "Social Engineering",
                        "cweId": "CWE-287"
                    },
                    {
                        "id": "threat-2",
                        "category": "InformationDisclosure",
                        "name": "SQL Injection Data Leak",
                        "description": "Attacker extracts sensitive data via SQL injection",
                        "likelihood": "Low",
                        "impact": "Critical",
                        "riskLevel": "High",
                        "affectedAssets": ["asset-1"],
                        "affectedComponents": ["Database Layer"],
                        "cweId": "CWE-89",
                        "cvssScore": 9.8
                    }
                ],
                "mitigations": [
                    {
                        "id": "mit-1",
                        "name": "Implement MFA",
                        "description": "Require TOTP-based MFA for all users",
                        "implementationType": "Preventive",
                        "status": "Planned",
                        "mitigatesThreats": ["threat-1"],
                        "cost": "Medium",
                        "effectiveness": "High"
                    },
                    {
                        "id": "mit-2",
                        "name": "Parameterized Queries",
                        "description": "Use prepared statements for all database queries",
                        "implementationType": "Preventive",
                        "status": "Planned",
                        "mitigatesThreats": ["threat-2"],
                        "cost": "Low",
                        "effectiveness": "High"
                    }
                ],
                "attackSurface": {
                    "entryPoints": [
                        {
                            "id": "ep-1",
                            "name": "REST API",
                            "type": "API",
                            "authentication": true,
                            "encryption": true,
                            "rateLimit": true,
                            "exposedTo": "Public"
                        }
                    ],
                    "trustBoundaries": [
                        {
                            "id": "tb-1",
                            "name": "DMZ to Internal Network",
                            "inside": ["Application Server", "Database"],
                            "outside": ["Load Balancer", "WAF"],
                            "description": "Firewall separates public-facing and internal components"
                        }
                    ],
                    "dataFlows": [
                        {
                            "id": "df-1",
                            "from": "Client Browser",
                            "to": "API Gateway",
                            "data": "User Credentials",
                            "protocol": "HTTPS",
                            "encrypted": true,
                            "authenticated": false,
                            "sensitivity": "Restricted"
                        }
                    ]
                }
            },
            "securityControls": [
                {
                    "id": "sc-1",
                    "name": "Input Validation",
                    "category": "ApplicationSecurity",
                    "type": "Preventive",
                    "implementation": "Validate all user inputs using whitelist approach",
                    "owaspMapping": ["A03:2021 - Injection"],
                    "status": "Planned"
                }
            ],
            "dataProtection": {
                "encryptionAtRest": {
                    "enabled": true,
                    "algorithm": "AES-256-GCM",
                    "keySize": 256,
                    "provider": "AWS KMS"
                },
                "encryptionInTransit": {
                    "enabled": true,
                    "algorithm": "TLS 1.3",
                    "keySize": 2048
                },
                "keyManagement": {
                    "storage": "KMS",
                    "rotationPeriod": 90,
                    "backupStrategy": "Automated daily backups to secure vault"
                },
                "dataClassification": [
                    {
                        "level": "Restricted",
                        "dataTypes": ["password", "ssn", "creditCard"],
                        "retentionPeriod": 730,
                        "accessRestrictions": ["Admin", "Security Team"],
                        "encryptionRequired": true,
                        "auditLoggingRequired": true
                    }
                ],
                "piiHandling": {
                    "identification": ["email", "name", "address", "phone"],
                    "minimization": true,
                    "anonymization": "Hashing with salt for analytics",
                    "pseudonymization": "UUID-based user IDs",
                    "rightToErasure": true,
                    "dataPortability": true
                }
            },
            "completed": true
        }

        IMPORTANT:
        - Use industry standards (OWASP, NIST, ISO 27001)
        - Be specific about algorithms, key sizes, protocols
        - Consider compliance requirements (GDPR, HIPAA, PCI-DSS if applicable)
        - Prioritize threats by risk level
        - Provide actionable mitigations
        `;
    }

    // TIER 3: Deployment Specification (Docker + K8s + CI/CD)
    static createDeploymentSpecPrompt(
        techStack: any,
        requirements: any,
        systemDesign?: string
    ): string {
        const backend = techStack?.backend?.name || 'Unknown';
        const database = techStack?.database?.name || 'Unknown';
        const hosting = techStack?.hosting?.name || 'Unknown';

        return `
        Generate a comprehensive deployment specification for this system.

        TECH STACK:
        - Backend: ${backend}
        - Database: ${database}
        - Hosting: ${hosting}
        - Full Stack: ${JSON.stringify(techStack, null, 2)}

        REQUIREMENTS:
        ${JSON.stringify(requirements, null, 2)}

        ${systemDesign ? `SYSTEM DESIGN:\n${systemDesign.substring(0, 1000)}` : ''}

        INSTRUCTIONS:
        Generate a complete DeploymentSpecification with:

        1. CONTAINERIZATION (Docker):
           - Create Dockerfile for each service
           - Base image selection (official, alpine, slim)
           - Multi-stage builds for optimization
           - Environment variables and secrets
           - Health checks
           - Resource limits

        2. ORCHESTRATION (Kubernetes):
           - Deployment manifests with replicas
           - Service definitions (ClusterIP, LoadBalancer)
           - ConfigMaps and Secrets
           - Ingress with TLS
           - HPA (Horizontal Pod Autoscaling)
           - Resource requests/limits
           - Liveness/Readiness probes

        3. CI/CD PIPELINE:
           - Detect platform from tech stack (GitHub Actions, GitLab CI, etc.)
           - Stages: Build → Test → Security Scan → Deploy
           - Automated testing
           - Container image building
           - Image registry push
           - Deployment to environments (dev, staging, prod)
           - Rollback strategy

        4. ENVIRONMENTS:
           - Development (minimal resources)
           - Staging (production-like)
           - Production (scaled, redundant)
           - Environment-specific configs

        Return JSON matching DeploymentSpecification interface.

        EXAMPLE OUTPUT (shortened):
        {
            "containerization": {
                "enabled": true,
                "platform": "Docker",
                "services": [
                    {
                        "name": "api",
                        "baseImage": "node:20-alpine",
                        "dockerfile": "FROM node:20-alpine\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm ci --production\\nCOPY . .\\nEXPOSE 3000\\nHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node healthcheck.js\\nCMD [\\"node\\", \\"server.js\\"]",
                        "buildContext": ".",
                        "exposedPorts": [3000],
                        "environmentVariables": [
                            {
                                "name": "NODE_ENV",
                                "value": "production"
                            },
                            {
                                "name": "DATABASE_URL",
                                "valueFrom": "secret",
                                "secretName": "db-credentials"
                            }
                        ],
                        "volumes": [],
                        "healthCheck": {
                            "type": "http",
                            "endpoint": "/health",
                            "interval": 30,
                            "timeout": 3,
                            "retries": 3,
                            "startPeriod": 5
                        },
                        "resources": {
                            "requests": {
                                "cpu": "100m",
                                "memory": "128Mi"
                            },
                            "limits": {
                                "cpu": "500m",
                                "memory": "512Mi"
                            }
                        }
                    }
                ]
            },
            "orchestration": {
                "platform": "Kubernetes",
                "version": "1.28",
                "deployments": [
                    {
                        "name": "api",
                        "namespace": "production",
                        "replicas": 3,
                        "selector": {
                            "app": "api"
                        },
                        "template": {
                            "labels": {
                                "app": "api",
                                "version": "v1"
                            },
                            "containers": [
                                {
                                    "name": "api",
                                    "image": "registry.example.com/api:latest",
                                    "imagePullPolicy": "Always",
                                    "ports": [
                                        {
                                            "name": "http",
                                            "containerPort": 3000,
                                            "protocol": "TCP"
                                        }
                                    ],
                                    "env": [],
                                    "volumeMounts": [],
                                    "resources": {
                                        "requests": {
                                            "cpu": "100m",
                                            "memory": "128Mi"
                                        },
                                        "limits": {
                                            "cpu": "500m",
                                            "memory": "512Mi"
                                        }
                                    },
                                    "livenessProbe": {
                                        "httpGet": {
                                            "path": "/health",
                                            "port": 3000,
                                            "scheme": "HTTP"
                                        },
                                        "initialDelaySeconds": 10,
                                        "periodSeconds": 10,
                                        "timeoutSeconds": 3,
                                        "successThreshold": 1,
                                        "failureThreshold": 3
                                    }
                                }
                            ],
                            "restartPolicy": "Always"
                        },
                        "strategy": {
                            "type": "RollingUpdate",
                            "rollingUpdate": {
                                "maxSurge": "25%",
                                "maxUnavailable": "0"
                            }
                        },
                        "autoscaling": {
                            "enabled": true,
                            "minReplicas": 2,
                            "maxReplicas": 10,
                            "metrics": [
                                {
                                    "type": "cpu",
                                    "targetAverageUtilization": 70
                                }
                            ]
                        }
                    }
                ],
                "services": [
                    {
                        "name": "api-service",
                        "namespace": "production",
                        "type": "ClusterIP",
                        "selector": {
                            "app": "api"
                        },
                        "ports": [
                            {
                                "name": "http",
                                "port": 80,
                                "targetPort": 3000,
                                "protocol": "TCP"
                            }
                        ]
                    }
                ],
                "configMaps": [
                    {
                        "name": "app-config",
                        "namespace": "production",
                        "data": {
                            "LOG_LEVEL": "info",
                            "FEATURE_FLAGS": "newUI:true"
                        }
                    }
                ],
                "secrets": [
                    {
                        "name": "db-credentials",
                        "namespace": "production",
                        "type": "Opaque",
                        "data": ["DATABASE_URL", "DATABASE_PASSWORD"]
                    }
                ],
                "namespaces": ["development", "staging", "production"]
            },
            "cicd": {
                "platform": "GitHub Actions",
                "stages": [
                    {
                        "name": "Build and Test",
                        "jobs": [
                            {
                                "name": "build",
                                "runsOn": "ubuntu-latest",
                                "steps": [
                                    {
                                        "name": "Checkout code",
                                        "type": "action",
                                        "action": "actions/checkout@v4"
                                    },
                                    {
                                        "name": "Setup Node.js",
                                        "type": "action",
                                        "action": "actions/setup-node@v4",
                                        "with": {
                                            "node-version": "20"
                                        }
                                    },
                                    {
                                        "name": "Install dependencies",
                                        "type": "script",
                                        "script": "npm ci"
                                    },
                                    {
                                        "name": "Run tests",
                                        "type": "script",
                                        "script": "npm test"
                                    },
                                    {
                                        "name": "Build Docker image",
                                        "type": "script",
                                        "script": "docker build -t api:latest ."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "Deploy to Production",
                        "jobs": [
                            {
                                "name": "deploy",
                                "runsOn": "ubuntu-latest",
                                "environment": "production",
                                "steps": [
                                    {
                                        "name": "Deploy to Kubernetes",
                                        "type": "script",
                                        "script": "kubectl apply -f k8s/"
                                    }
                                ]
                            }
                        ],
                        "condition": "github.ref == 'refs/heads/main'"
                    }
                ],
                "triggers": [
                    {
                        "type": "push",
                        "branches": ["main", "develop"]
                    },
                    {
                        "type": "pull_request",
                        "branches": ["main"]
                    }
                ],
                "secrets": ["DOCKER_REGISTRY_TOKEN", "KUBECONFIG"]
            },
            "environments": [
                {
                    "name": "development",
                    "url": "https://dev.example.com",
                    "variables": {
                        "NODE_ENV": "development",
                        "LOG_LEVEL": "debug"
                    },
                    "secrets": ["DATABASE_URL"],
                    "resources": {
                        "cpu": "200m",
                        "memory": "256Mi",
                        "storage": "1Gi",
                        "replicas": 1
                    }
                },
                {
                    "name": "production",
                    "url": "https://example.com",
                    "variables": {
                        "NODE_ENV": "production",
                        "LOG_LEVEL": "info"
                    },
                    "secrets": ["DATABASE_URL", "API_KEYS"],
                    "resources": {
                        "cpu": "1000m",
                        "memory": "2Gi",
                        "storage": "10Gi",
                        "replicas": 3
                    },
                    "approvalRequired": true
                }
            ],
            "completed": true
        }

        IMPORTANT:
        - Use multi-stage Docker builds for smaller images
        - Set appropriate resource requests/limits
        - Implement health checks for reliability
        - Use secrets for sensitive data, not env vars
        - Enable autoscaling based on CPU/memory
        - Implement zero-downtime deployments (RollingUpdate)
        `;
    }

    // TIER 3: Observability Specification (Logging + Metrics + Tracing + Alerting)
    static createObservabilitySpecPrompt(
        techStack: any,
        requirements: any,
        apiSpec?: string
    ): string {
        const backend = techStack?.backend?.name || 'Unknown';
        const hosting = techStack?.hosting?.name || 'Unknown';

        return `
        Generate a comprehensive observability specification for this system.

        TECH STACK:
        - Backend: ${backend}
        - Hosting: ${hosting}
        - Full Stack: ${JSON.stringify(techStack, null, 2)}

        QUALITY REQUIREMENTS:
        ${JSON.stringify(requirements?.qualityRequirements || [], null, 2)}

        ${apiSpec ? `API ENDPOINTS:\n${apiSpec.substring(0, 1500)}` : ''}

        INSTRUCTIONS:
        Generate a complete ObservabilitySpecification with:

        1. LOGGING:
           - Select framework based on backend (Winston/Pino for Node.js, Logback for Java, etc.)
           - Structured JSON logging
           - Log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
           - Destinations (Console, Elasticsearch, CloudWatch, Datadog, etc.)
           - Context fields (requestId, userId, traceId, environment)
           - Sampling for high-volume logs
           - Sensitive data redaction (passwords, tokens, PII)
           - Retention policies by level

        2. METRICS:
           - Choose framework (Prometheus, StatsD, OpenTelemetry, Micrometer)
           - System metrics (CPU, memory, disk, network)
           - Application metrics (request rate, latency, error rate)
           - Business metrics (orders per minute, revenue, conversions)
           - Custom metrics per endpoint
           - Exporters (Prometheus, CloudWatch, Datadog, etc.)

        3. TRACING:
           - Enable distributed tracing (OpenTelemetry, Jaeger, Zipkin)
           - Sampling rate (0.1 = 10%)
           - Trace context propagation (W3C, B3, Jaeger)
           - Span processors and exporters

        4. ALERTING:
           - Alert rules based on metrics
           - Severity levels (Critical, High, Medium, Low)
           - Notification channels (Email, Slack, PagerDuty, Webhook)
           - Escalation policies
           - Common alerts: high error rate, high latency, service down, disk full

        5. DASHBOARDS:
           - Grafana/Kibana dashboards
           - Panels for key metrics
           - SLO tracking
           - Real-time and historical views

        6. SLOs (Service Level Objectives):
           - Define SLIs (Service Level Indicators)
           - Set SLO targets (e.g., 99.9% availability, p95 latency < 200ms)
           - Error budget calculation

        Return JSON matching ObservabilitySpecification interface.

        EXAMPLE OUTPUT:
        {
            "logging": {
                "framework": "Winston",
                "levels": ["INFO", "WARN", "ERROR", "FATAL"],
                "structuredLogging": true,
                "destinations": [
                    {
                        "type": "Console",
                        "config": {
                            "format": "json"
                        }
                    },
                    {
                        "type": "Elasticsearch",
                        "config": {
                            "node": "https://elasticsearch.example.com",
                            "index": "app-logs",
                            "auth": {
                                "username": "elastic",
                                "password": "secret"
                            }
                        },
                        "filter": {
                            "minLevel": "INFO"
                        }
                    }
                ],
                "contextFields": ["requestId", "userId", "traceId", "environment", "service"],
                "sampling": {
                    "enabled": true,
                    "rate": 0.1,
                    "rules": [
                        {
                            "condition": "level === 'DEBUG'",
                            "rate": 0.01
                        }
                    ]
                },
                "retention": {
                    "trace": 1,
                    "debug": 3,
                    "info": 7,
                    "warn": 30,
                    "error": 90,
                    "fatal": 365
                },
                "sensitiveDataHandling": {
                    "redactFields": ["password", "token", "apiKey", "ssn", "creditCard"],
                    "maskFields": ["email", "phone"],
                    "hashFields": ["userId", "sessionId"],
                    "piiDetection": true
                }
            },
            "metrics": {
                "framework": "Prometheus",
                "collectionInterval": 15,
                "exporters": [
                    {
                        "type": "Prometheus",
                        "endpoint": "/metrics"
                    }
                ],
                "customMetrics": [
                    {
                        "name": "http_request_duration_seconds",
                        "type": "Histogram",
                        "description": "HTTP request latency in seconds",
                        "unit": "seconds",
                        "labels": ["method", "endpoint", "status"],
                        "aggregation": "avg"
                    },
                    {
                        "name": "http_requests_total",
                        "type": "Counter",
                        "description": "Total HTTP requests",
                        "labels": ["method", "endpoint", "status"]
                    },
                    {
                        "name": "active_connections",
                        "type": "Gauge",
                        "description": "Number of active connections"
                    }
                ],
                "systemMetrics": {
                    "cpu": true,
                    "memory": true,
                    "disk": true,
                    "network": true,
                    "processMetrics": true,
                    "runtimeMetrics": true
                },
                "businessMetrics": [
                    {
                        "name": "orders_per_minute",
                        "description": "Number of orders placed per minute",
                        "calculation": "rate(orders_total[1m])",
                        "threshold": 100,
                        "alertOnThreshold": true
                    }
                ]
            },
            "tracing": {
                "enabled": true,
                "framework": "OpenTelemetry",
                "samplingRate": 0.1,
                "exporters": [
                    {
                        "type": "Jaeger",
                        "endpoint": "http://jaeger-collector:14268/api/traces"
                    }
                ],
                "propagation": "W3C",
                "spanProcessors": [
                    {
                        "type": "BatchSpanProcessor",
                        "maxQueueSize": 2048,
                        "maxExportBatchSize": 512,
                        "exportTimeout": 30000
                    }
                ]
            },
            "alerting": {
                "provider": "Prometheus Alertmanager",
                "rules": [
                    {
                        "id": "alert-1",
                        "name": "HighErrorRate",
                        "severity": "Critical",
                        "condition": "rate(http_requests_total{status=~\"5..\"}[5m]) > 0.05",
                        "threshold": 0.05,
                        "duration": 300,
                        "annotations": {
                            "summary": "High error rate detected",
                            "description": "Error rate is above 5% for 5 minutes"
                        },
                        "labels": {
                            "team": "backend"
                        },
                        "notificationChannels": ["slack", "pagerduty"],
                        "enabled": true
                    },
                    {
                        "id": "alert-2",
                        "name": "HighLatency",
                        "severity": "High",
                        "condition": "histogram_quantile(0.95, http_request_duration_seconds) > 1",
                        "threshold": 1,
                        "duration": 300,
                        "annotations": {
                            "summary": "High latency detected",
                            "description": "P95 latency is above 1 second"
                        },
                        "notificationChannels": ["slack"],
                        "enabled": true
                    },
                    {
                        "id": "alert-3",
                        "name": "ServiceDown",
                        "severity": "Critical",
                        "condition": "up{job=\"api\"} == 0",
                        "duration": 60,
                        "annotations": {
                            "summary": "Service is down",
                            "description": "API service is not responding"
                        },
                        "notificationChannels": ["slack", "pagerduty", "email"],
                        "enabled": true
                    }
                ],
                "notificationChannels": [
                    {
                        "id": "slack",
                        "type": "Slack",
                        "target": "https://hooks.slack.com/services/xxx/yyy/zzz"
                    },
                    {
                        "id": "pagerduty",
                        "type": "PagerDuty",
                        "target": "integration-key-here"
                    },
                    {
                        "id": "email",
                        "type": "Email",
                        "target": "oncall@example.com"
                    }
                ],
                "escalationPolicies": [
                    {
                        "id": "critical-escalation",
                        "name": "Critical Alert Escalation",
                        "steps": [
                            {
                                "delay": 0,
                                "notificationChannels": ["slack", "pagerduty"]
                            },
                            {
                                "delay": 15,
                                "notificationChannels": ["email"]
                            }
                        ]
                    }
                ]
            },
            "dashboards": [
                {
                    "id": "main-dashboard",
                    "name": "Application Overview",
                    "description": "Main application metrics and health",
                    "provider": "Grafana",
                    "panels": [
                        {
                            "id": "panel-1",
                            "title": "Request Rate",
                            "type": "Graph",
                            "query": "rate(http_requests_total[5m])",
                            "visualization": "Timeseries",
                            "position": {
                                "x": 0,
                                "y": 0,
                                "width": 12,
                                "height": 8
                            },
                            "unit": "req/s"
                        },
                        {
                            "id": "panel-2",
                            "title": "Error Rate",
                            "type": "Graph",
                            "query": "rate(http_requests_total{status=~\"5..\"}[5m])",
                            "visualization": "Timeseries",
                            "position": {
                                "x": 12,
                                "y": 0,
                                "width": 12,
                                "height": 8
                            },
                            "thresholds": [
                                {
                                    "value": 0.01,
                                    "color": "yellow",
                                    "label": "Warning"
                                },
                                {
                                    "value": 0.05,
                                    "color": "red",
                                    "label": "Critical"
                                }
                            ],
                            "unit": "errors/s"
                        }
                    ],
                    "refreshInterval": 30,
                    "timeRange": "1h"
                }
            ],
            "slos": {
                "slis": [
                    {
                        "id": "sli-availability",
                        "name": "Availability",
                        "description": "Percentage of successful requests",
                        "query": "sum(rate(http_requests_total{status!~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
                        "unit": "percentage"
                    },
                    {
                        "id": "sli-latency",
                        "name": "Latency",
                        "description": "95th percentile request latency",
                        "query": "histogram_quantile(0.95, http_request_duration_seconds)",
                        "unit": "seconds"
                    }
                ],
                "slos": [
                    {
                        "id": "slo-availability",
                        "name": "99.9% Availability",
                        "sliId": "sli-availability",
                        "target": 99.9,
                        "window": "30d",
                        "alertOnBreach": true
                    },
                    {
                        "id": "slo-latency",
                        "name": "P95 Latency < 200ms",
                        "sliId": "sli-latency",
                        "target": 0.2,
                        "window": "7d",
                        "threshold": 0.2,
                        "alertOnBreach": true
                    }
                ]
            },
            "completed": true
        }

        IMPORTANT:
        - Use structured JSON logging for machine-readable logs
        - Implement correlation IDs for request tracing
        - Set appropriate retention policies to manage costs
        - Redact sensitive data (PII, credentials) from logs
        - Define meaningful metrics that map to business KPIs
        - Set realistic SLO targets based on requirements
        - Create actionable alerts (avoid alert fatigue)
        `;
    }

    // TIER 3: Performance Specification (Caching + Optimization + Scaling)
    static createPerformanceSpecPrompt(
        requirements: any,
        techStack: any,
        dataModel?: any,
        apiSpec?: string
    ): string {
        return `
        Generate a comprehensive performance specification for this system.

        QUALITY REQUIREMENTS:
        ${JSON.stringify(requirements?.qualityRequirements || [], null, 2)}

        TECH STACK:
        ${JSON.stringify(techStack, null, 2)}

        ${dataModel ? `DATABASE SCHEMA:\n${JSON.stringify(dataModel, null, 2).substring(0, 1500)}` : ''}

        ${apiSpec ? `API ENDPOINTS:\n${apiSpec.substring(0, 1500)}` : ''}

        INSTRUCTIONS:
        Generate a complete PerformanceSpecification with:

        1. SLOs (Service Level Objectives):
           - Extract from quality requirements
           - Latency (p50, p95, p99)
           - Availability (uptime %)
           - Throughput (requests/second)
           - Error rate (%)
           - Define realistic targets

        2. CACHING STRATEGY:
           - Multi-layer caching (Browser → CDN → Application → Database)
           - Cache types: Memory (Node-cache), Redis, Memcached, HTTP caching
           - TTL (Time to Live) per resource
           - Eviction policies (LRU, LFU, FIFO)
           - Invalidation strategies (TTL, Event-driven, Manual)
           - Cache warming for popular data
           - Coherence strategy (Strong, Eventual, Weak)

        3. DATABASE OPTIMIZATION:
           - Indexes (BTREE, HASH, GIN, GIST) based on query patterns
           - Query optimization techniques
           - Connection pooling (min, max, timeout)
           - Partitioning strategy if needed
           - Read replicas for scaling
           - Denormalization rules if beneficial

        4. API OPTIMIZATION:
           - Rate limiting (per IP, per user, per API key)
           - Pagination (offset, cursor, keyset)
           - Compression (gzip, brotli)
           - Batch endpoints for bulk operations
           - GraphQL optimization (query depth, complexity, DataLoader)

        5. LOAD PROFILE:
           - Expected traffic (requests/sec, concurrent users)
           - Peak traffic patterns
           - Traffic distribution (by endpoint, region, user type)
           - User behavior (session duration, pages per session)

        6. SCALING STRATEGY:
           - Horizontal scaling (stateless, load balancing)
           - Vertical scaling (resource limits)
           - Auto-scaling (metrics, thresholds, cooldown)
           - Capacity planning (current, projected growth, bottlenecks)

        Return JSON matching PerformanceSpecification interface.

        EXAMPLE OUTPUT:
        {
            "slos": [
                {
                    "id": "slo-latency-p95",
                    "metric": "Latency",
                    "target": 200,
                    "unit": "ms",
                    "percentile": 95,
                    "window": "5m",
                    "description": "95% of requests should complete within 200ms"
                },
                {
                    "id": "slo-availability",
                    "metric": "Availability",
                    "target": 99.9,
                    "unit": "%",
                    "window": "30d",
                    "description": "Service should be available 99.9% of the time"
                },
                {
                    "id": "slo-throughput",
                    "metric": "Throughput",
                    "target": 1000,
                    "unit": "requests/s",
                    "window": "1m",
                    "description": "System should handle 1000 requests per second"
                }
            ],
            "cachingStrategy": {
                "enabled": true,
                "layers": [
                    {
                        "name": "CDN Cache",
                        "level": "CDN",
                        "type": "CDN",
                        "ttl": 86400,
                        "evictionPolicy": "TTL",
                        "cachedResources": [
                            {
                                "resource": "static-assets",
                                "keys": ["*.js", "*.css", "*.png", "*.jpg"],
                                "ttl": 2592000
                            }
                        ]
                    },
                    {
                        "name": "Redis Cache",
                        "level": "Application",
                        "type": "Redis",
                        "ttl": 300,
                        "maxSize": "2GB",
                        "evictionPolicy": "LRU",
                        "cachedResources": [
                            {
                                "resource": "user-profile",
                                "keys": ["user:{id}"],
                                "ttl": 600
                            },
                            {
                                "resource": "product-catalog",
                                "keys": ["products:list", "product:{id}"],
                                "ttl": 1800
                            }
                        ],
                        "config": {
                            "host": "redis.example.com",
                            "port": 6379,
                            "maxRetriesPerRequest": 3
                        }
                    },
                    {
                        "name": "ORM Cache",
                        "level": "Database",
                        "type": "ORM",
                        "ttl": 60,
                        "evictionPolicy": "LRU",
                        "cachedResources": [
                            {
                                "resource": "lookup-tables",
                                "keys": ["categories", "tags"],
                                "ttl": 3600
                            }
                        ]
                    }
                ],
                "invalidationStrategy": {
                    "type": "Hybrid",
                    "events": [
                        {
                            "eventType": "user.updated",
                            "invalidates": ["user:{id}", "user:{id}:*"]
                        },
                        {
                            "eventType": "product.updated",
                            "invalidates": ["product:{id}", "products:list"]
                        }
                    ]
                },
                "cacheWarming": {
                    "enabled": true,
                    "schedule": "0 */6 * * *",
                    "resources": ["product-catalog", "categories"],
                    "strategy": "eager"
                },
                "coherence": {
                    "type": "Eventual",
                    "synchronization": "Invalidate"
                }
            },
            "databaseOptimization": {
                "indexing": {
                    "indexes": [
                        {
                            "table": "users",
                            "columns": ["email"],
                            "type": "BTREE",
                            "unique": true,
                            "rationale": "Fast lookup for authentication"
                        },
                        {
                            "table": "orders",
                            "columns": ["user_id", "created_at"],
                            "type": "BTREE",
                            "unique": false,
                            "rationale": "Optimize user order history queries"
                        },
                        {
                            "table": "products",
                            "columns": ["category_id", "price"],
                            "type": "BTREE",
                            "unique": false,
                            "rationale": "Fast filtering by category and price range"
                        }
                    ],
                    "autoAnalyze": true,
                    "recommendations": [
                        "Add covering index on (user_id, created_at, status) for order queries",
                        "Consider GIN index on JSON columns if using JSONB"
                    ]
                },
                "queryOptimization": [
                    {
                        "queryId": "q1",
                        "originalQuery": "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
                        "optimizedQuery": "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
                        "technique": "Pagination",
                        "expectedImprovement": "90% faster for large result sets",
                        "rationale": "Limit result set to prevent full table scan"
                    }
                ],
                "connectionPooling": {
                    "enabled": true,
                    "minConnections": 2,
                    "maxConnections": 20,
                    "acquireTimeout": 30000,
                    "idleTimeout": 600000,
                    "maxLifetime": 1800000,
                    "strategy": "dynamic"
                }
            },
            "apiOptimization": {
                "rateLimiting": {
                    "enabled": true,
                    "strategy": "Token Bucket",
                    "limits": [
                        {
                            "endpoint": "/api/auth/login",
                            "limit": 5,
                            "window": 300,
                            "scope": "IP"
                        },
                        {
                            "endpoint": "*",
                            "limit": 1000,
                            "window": 3600,
                            "scope": "User"
                        }
                    ],
                    "storage": "Redis"
                },
                "pagination": {
                    "type": "Cursor",
                    "defaultPageSize": 20,
                    "maxPageSize": 100,
                    "cursorEncoding": "base64"
                },
                "compression": {
                    "enabled": true,
                    "algorithms": ["br", "gzip"],
                    "minSize": 1024,
                    "contentTypes": ["application/json", "text/html", "text/css", "application/javascript"]
                },
                "batchEndpoints": [
                    {
                        "path": "/api/batch",
                        "maxBatchSize": 50,
                        "timeout": 30000,
                        "parallelExecution": true
                    }
                ]
            },
            "loadProfile": {
                "expectedLoad": {
                    "requestsPerSecond": 500,
                    "concurrentUsers": 1000,
                    "avgResponseTime": 150,
                    "peakTime": "09:00-17:00 weekdays"
                },
                "peakLoad": {
                    "requestsPerSecond": 2000,
                    "concurrentUsers": 5000,
                    "avgResponseTime": 200,
                    "peakTime": "Black Friday, Cyber Monday"
                },
                "trafficDistribution": {
                    "byEndpoint": [
                        {
                            "endpoint": "/api/products",
                            "percentage": 40,
                            "avgLatency": 100
                        },
                        {
                            "endpoint": "/api/orders",
                            "percentage": 30,
                            "avgLatency": 200
                        }
                    ]
                },
                "userBehavior": {
                    "avgSessionDuration": 15,
                    "pagesPerSession": 8,
                    "bounceRate": 35,
                    "conversionRate": 2.5
                }
            },
            "scalingStrategy": {
                "horizontal": {
                    "enabled": true,
                    "minInstances": 2,
                    "maxInstances": 20,
                    "stateless": true,
                    "loadBalancing": {
                        "algorithm": "LeastConnections",
                        "healthCheck": {
                            "enabled": true,
                            "endpoint": "/health",
                            "interval": 30,
                            "timeout": 5,
                            "unhealthyThreshold": 3,
                            "healthyThreshold": 2
                        }
                    }
                },
                "vertical": {
                    "enabled": false,
                    "resources": {
                        "cpu": {
                            "current": "2 cores",
                            "max": "8 cores"
                        },
                        "memory": {
                            "current": "4GB",
                            "max": "16GB"
                        }
                    }
                },
                "autoScaling": {
                    "enabled": true,
                    "metrics": [
                        {
                            "name": "cpu",
                            "threshold": 70,
                            "comparisonOperator": ">",
                            "evaluationPeriods": 2
                        },
                        {
                            "name": "memory",
                            "threshold": 80,
                            "comparisonOperator": ">",
                            "evaluationPeriods": 2
                        }
                    ],
                    "cooldownPeriod": 300,
                    "scaleUpPolicy": {
                        "adjustment": 2,
                        "adjustmentType": "ChangeInCapacity"
                    },
                    "scaleDownPolicy": {
                        "adjustment": 1,
                        "adjustmentType": "ChangeInCapacity"
                    }
                },
                "capacityPlanning": {
                    "currentCapacity": {
                        "cpu": 60,
                        "memory": 70,
                        "storage": 40,
                        "network": 30,
                        "database": 50
                    },
                    "projectedGrowth": {
                        "timeframe": "6 months",
                        "expectedGrowth": 50,
                        "requiredCapacity": {
                            "cpu": 90,
                            "memory": 90,
                            "storage": 60,
                            "network": 45,
                            "database": 75
                        }
                    },
                    "bottlenecks": [
                        {
                            "component": "Database",
                            "metric": "Connections",
                            "currentValue": 45,
                            "threshold": 50,
                            "impact": "High",
                            "mitigation": "Increase connection pool size or add read replicas"
                        }
                    ],
                    "recommendations": [
                        "Scale horizontally to 4-6 instances",
                        "Add Redis cluster for distributed caching",
                        "Implement database read replicas"
                    ]
                }
            },
            "completed": true
        }

        IMPORTANT:
        - Set realistic SLOs based on requirements (don't over-engineer)
        - Use multi-layer caching for frequently accessed data
        - Index columns used in WHERE, JOIN, ORDER BY clauses
        - Implement rate limiting to prevent abuse
        - Use cursor-based pagination for large datasets
        - Enable compression for API responses
        - Plan for 2-3x expected peak load
        - Monitor and adjust based on actual usage
        `;
    }
}
