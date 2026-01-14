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
            ? `
═══════════════════════════════════════════════════════════════
⚠️  ALREADY DEFINED IN REQUIREMENTS PHASE - DO NOT RE-ASK! ⚠️
═══════════════════════════════════════════════════════════════

The following was ALREADY discussed and defined in the Requirements phase:
${requirements}

❌ DO NOT ask about:
   - Project purpose or goals (already defined)
   - Who will use the system (stakeholders already identified)
   - What features are needed (requirements already captured)
   - Business constraints (already documented)

✅ FOCUS ONLY ON:
   - Technology selection
   - Technical architecture decisions
   - Platform and framework choices
   - Infrastructure and deployment preferences

═══════════════════════════════════════════════════════════════
`
            : '';

        return `
        You are an expert software architect specialized in technology selection.
        Help the user choose the best technology stack for their project.
        ${requirementsContext}

        INSTRUCTIONS:
        1. Act professionally and ask LEADING questions to determine the best tech stack.
        2. IMPORTANT: ADAPT TO THE USER'S LANGUAGE (Swedish/English).
        3. CRITICAL: If requirements context is provided above, DO NOT re-ask about project purpose, features, or stakeholders. Focus ONLY on technology choices.
        4. Ask about:
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
    static createUseCaseExtractionPrompt(chatLog: string, requirements?: string, techStack?: string): string {
        const alreadyDefinedContext = (requirements || techStack)
            ? `
═══════════════════════════════════════════════════════════════
⚠️  ALREADY DEFINED IN PREVIOUS PHASES - DO NOT RE-ASK! ⚠️
═══════════════════════════════════════════════════════════════

${requirements ? `📋 REQUIREMENTS (Phase 0):\n${requirements}\n` : ''}
${techStack ? `🛠️  TECHNOLOGY STACK (Phase 1):\n${techStack}\n` : ''}

❌ DO NOT ask about:
   - Project purpose or business goals (already defined)
   - Functional or quality requirements (already captured)
   - Technology choices or platforms (already selected)
   - Who will use the system (stakeholders already identified)

✅ FOCUS ONLY ON:
   - USE CASES that implement the requirements
   - Actor interactions and scenarios
   - System behavior and workflows
   - Edge cases and alternative paths

═══════════════════════════════════════════════════════════════
`
            : '';

        return `
        Analyze the following conversation about a software system.
        ${alreadyDefinedContext}
        Focus on identifying USE CASES that fulfill the requirements.

        1. Act as an expert software architect. Provide a helpful, concise response.
        2. IMPORTANTE: ADAPT TO THE USER'S LANGUAGE.
        3. CRITICAL: If context is provided above, DO NOT re-ask about requirements, tech stack, or project purpose. Be PROACTIVE and DRIVE the conversation forward with LEADING questions about use cases and interactions (e.g., "Shall we include a dashboard for admins?", "I assume users need a login, correct?").
        4. When you have a solid baseline of use cases, explicitly PROPOSE moving to the 'System Design' phase.
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

    // ==================================================================================
    // TIER 4: FORMAL METHODS & VERIFIED STATE MACHINES (95-100% AI-Generated Code)
    // ==================================================================================

    /**
     * TIER 4: Generate Formal Methods Specification (TLA+, Alloy, Z)
     * Purpose: Enable AI to generate formally verified implementations of critical components
     *
     * This specification provides:
     * 1. Identification of critical components requiring formal verification
     * 2. TLA+ or Alloy specifications for temporal/structural properties
     * 3. Properties to verify (Safety, Liveness, Invariants)
     * 4. Model checking configurations
     *
     * Use cases:
     * - Payment processing (transaction atomicity, double-spending prevention)
     * - Authentication/Authorization (security properties)
     * - Distributed consensus (Raft, Paxos)
     * - Concurrent data structures (race conditions, deadlocks)
     * - State machine correctness
     *
     * Research basis:
     * - AWS uses TLA+ for DynamoDB, S3, EBS (found critical bugs)
     * - Microsoft uses TLA+ for Azure Cosmos DB
     * - TLA+ can verify properties across 35+ step state traces
     * - Alloy good for structural invariants, TLA+ better for concurrency
     *
     * @param requirements - Requirements specification
     * @param useCases - Use cases from analysis
     * @param objectDesign - Class diagrams and contracts
     * @param security - Security specification (threats, controls)
     * @returns Prompt for AI to generate formal methods specification
     */
    static createFormalMethodsPrompt(
        requirements: any,
        useCases: any[],
        objectDesign: any,
        security?: any
    ): string {
        const reqStr = requirements ? JSON.stringify(requirements, null, 2) : 'Not provided';
        const useCasesStr = useCases ? JSON.stringify(useCases, null, 2) : 'Not provided';
        const designStr = objectDesign ? JSON.stringify(objectDesign, null, 2) : 'Not provided';
        const securityStr = security ? JSON.stringify(security, null, 2) : 'Not provided';

        return `
        You are a formal methods expert specializing in TLA+ and Alloy specifications.
        Generate a comprehensive formal methods specification for this system.

        ===============================================================================
        CONTEXT INFORMATION
        ===============================================================================

        REQUIREMENTS:
        ${reqStr}

        USE CASES:
        ${useCasesStr}

        OBJECT DESIGN:
        ${designStr}

        SECURITY SPECIFICATION:
        ${securityStr}

        ===============================================================================
        YOUR TASK: GENERATE FORMAL METHODS SPECIFICATION
        ===============================================================================

        STEP 1: IDENTIFY CRITICAL COMPONENTS
        -------------------------------------
        Analyze the system and identify components that require formal verification:

        Component Types to Look For:
        - CONCURRENCY: Multi-threaded operations, distributed systems, race conditions
        - CONSENSUS: Distributed agreement, leader election, replication
        - TRANSACTIONS: ACID guarantees, two-phase commit, rollback safety
        - AUTHENTICATION: Login flows, token validation, session management
        - AUTHORIZATION: Permission checks, RBAC enforcement, privilege escalation
        - PAYMENT: Balance updates, transaction atomicity, double-spending prevention
        - DATA INTEGRITY: Consistency checks, referential integrity, validation
        - STATE MACHINES: Complex entity state transitions (Order, User, Workflow)
        - WORKFLOW: Business process orchestration, task dependencies
        - REPLICATION: Data synchronization, conflict resolution

        For each critical component, specify:
        {
            "id": "comp-001",
            "name": "Payment Transaction Processing",
            "type": "Payment",
            "description": "Handles financial transactions with atomicity guarantees",
            "criticalityReason": "Financial loss possible if atomicity violated",
            "complexity": "High",
            "requiresFormalVerification": true,
            "verificationMethod": ["TLA+"]
        }

        STEP 2: CHOOSE VERIFICATION METHOD
        -----------------------------------
        For each critical component, select appropriate formal method:

        - TLA+ (Temporal Logic of Actions): Best for concurrent/distributed algorithms, state machines, temporal properties
        - Alloy: Best for structural invariants, data models, relational properties
        - Z: Best for data-centric systems with complex invariants
        - SPIN: Best for protocol verification, message passing
        - Coq/Isabelle: Best for mathematical proof, compiler verification (overkill for most apps)

        Guidelines:
        - Use TLA+ for: Payments, Auth, Consensus, Concurrency, State Machines
        - Use Alloy for: Data integrity, Permissions, Referential constraints
        - For most web applications: TLA+ is recommended (AWS standard)

        STEP 3: WRITE FORMAL SPECIFICATIONS
        ------------------------------------
        For each component requiring formal verification, write specification:

        TLA+ SPECIFICATION STRUCTURE:
        ---- MODULE ComponentName ----
        EXTENDS Naturals, Sequences, FiniteSets

        CONSTANTS
            MaxValue,
            Users,
            Resources

        VARIABLES
            state,
            data,
            history

        TypeInvariant ==
            /\\ state \\in [Users -> {"Active", "Suspended", "Deleted"}]
            /\\ data \\in [Resources -> SUBSET Users]

        Init ==
            /\\ state = [u \\in Users |-> "Active"]
            /\\ data = [r \\in Resources |-> {}]
            /\\ history = <<>>

        Operation(user, resource) ==
            /\\ Preconditions...
            /\\ state' = [state EXCEPT ![user] = NewState]
            /\\ data' = [data EXCEPT ![resource] = @ \\cup {user}]
            /\\ history' = Append(history, <<operation, user, resource>>)

        Next ==
            \\E u \\in Users, r \\in Resources : Operation(u, r)

        Spec == Init /\\ [][Next]_<<state, data, history>>

        (* Properties to verify *)
        SafetyProperty == \\A u \\in Users : state[u] = "Active" => ...
        LivenessProperty == <>[](...) (* Eventually always true *)
        InvariantProperty == []TypeInvariant

        THEOREM Spec => []SafetyProperty
        THEOREM Spec => LivenessProperty
        ====

        ALLOY SPECIFICATION STRUCTURE:
        abstract sig User {}
        sig ActiveUser extends User {}
        sig Resource {
            owner: User,
            permissions: set User
        }

        fact NoSelfOwnership {
            no r: Resource | r.owner in r.permissions
        }

        pred grantPermission[r: Resource, u: User] {
            u not in r.permissions
            r.permissions' = r.permissions + u
        }

        assert OwnerAlwaysHasAccess {
            always (all r: Resource | r.owner in r.permissions)
        }

        check OwnerAlwaysHasAccess for 5

        STEP 4: DEFINE PROPERTIES TO VERIFY
        ------------------------------------
        For each specification, define properties to check:

        Property Types:
        - SAFETY: "Nothing bad ever happens" (e.g., "Balance never goes negative")
        - LIVENESS: "Something good eventually happens" (e.g., "Every request eventually completes")
        - FAIRNESS: "Every process gets a turn" (e.g., "No starvation")
        - INVARIANT: "Always true" (e.g., "Total balance = sum of all accounts")
        - REACHABILITY: "Can reach this state" (e.g., "Order can reach Delivered")
        - DEADLOCK FREEDOM: "No deadlocks" (e.g., "System never stuck")
        - TERMINATION: "Always terminates" (e.g., "Loop always ends")

        Example properties:
        {
            "id": "prop-001",
            "name": "BalanceNonNegative",
            "type": "Safety",
            "formula": "\\\\A account \\\\in Accounts : balance[account] >= 0",
            "description": "Bank account balance must never be negative",
            "critical": true
        }

        STEP 5: DEFINE INVARIANTS
        --------------------------
        System-wide and component-specific invariants:

        {
            "id": "inv-001",
            "name": "MoneyConservation",
            "expression": "SUM(all_balances) = initial_total_balance",
            "description": "Total money in system is conserved",
            "scope": "Global",
            "mustHold": "Always"
        }

        STEP 6: MODEL CHECKING CONFIGURATION
        -------------------------------------
        For TLC model checker (TLA+):
        {
            "tool": "TLC",
            "configuration": {
                "maxStates": 100000000,
                "maxTraceLength": 50,
                "workers": 4,
                "seed": 42,
                "symmetry": true
            },
            "constants": {
                "MaxBalance": 10000,
                "Accounts": ["A", "B", "C"]
            }
        }

        For Alloy Analyzer:
        {
            "tool": "Alloy Analyzer",
            "configuration": {
                "scope": 5,
                "maxSeq": 4,
                "expects": 0  // Number of expected counterexamples
            }
        }

        ===============================================================================
        REAL-WORLD EXAMPLES TO FOLLOW
        ===============================================================================

        EXAMPLE 1: Bank Account (TLA+)
        -------------------------------
        Critical Component: "Account Balance Management"
        Type: Transaction
        Properties:
        - Safety: Balance never negative
        - Safety: Total money conserved
        - Liveness: Transfers eventually complete

        TLA+ Spec:
        ---- MODULE BankAccount ----
        EXTENDS Naturals, TLC

        CONSTANTS MaxBalance, Accounts

        VARIABLES balance, history

        TypeInvariant ==
            /\\ balance \\in [Accounts -> Nat]
            /\\ \\A a \\in Accounts : balance[a] <= MaxBalance

        Init ==
            /\\ balance = [a \\in Accounts |-> 0]
            /\\ history = <<>>

        Deposit(account, amount) ==
            /\\ amount > 0
            /\\ balance[account] + amount <= MaxBalance
            /\\ balance' = [balance EXCEPT ![account] = @ + amount]
            /\\ history' = Append(history, <<"deposit", account, amount>>)

        Withdraw(account, amount) ==
            /\\ amount > 0
            /\\ balance[account] >= amount
            /\\ balance' = [balance EXCEPT ![account] = @ - amount]
            /\\ history' = Append(history, <<"withdraw", account, amount>>)

        Transfer(from, to, amount) ==
            /\\ from /= to
            /\\ amount > 0
            /\\ balance[from] >= amount
            /\\ balance[to] + amount <= MaxBalance
            /\\ balance' = [balance EXCEPT ![from] = @ - amount, ![to] = @ + amount]
            /\\ history' = Append(history, <<"transfer", from, to, amount>>)

        Next ==
            \\/ \\E a \\in Accounts, amt \\in 1..100 : Deposit(a, amt)
            \\/ \\E a \\in Accounts, amt \\in 1..100 : Withdraw(a, amt)
            \\/ \\E a1, a2 \\in Accounts, amt \\in 1..100 : Transfer(a1, a2, amt)

        Spec == Init /\\ [][Next]_<<balance, history>>

        BalanceNonNegative == \\A a \\in Accounts : balance[a] >= 0
        MoneyConservation == LET total == SUM({balance[a] : a \\in Accounts}) IN total <= MaxBalance * Len(Accounts)

        THEOREM Spec => []BalanceNonNegative
        THEOREM Spec => []MoneyConservation
        ====

        EXAMPLE 2: File System (Alloy)
        -------------------------------
        Critical Component: "File System Integrity"
        Type: DataIntegrity
        Properties:
        - Safety: No cycles in directory structure
        - Safety: All objects reachable from root
        - Safety: No orphaned files

        abstract sig Object {}
        sig File extends Object {}
        sig Dir extends Object {
            contents: set Object
        }

        one sig Root extends Dir {}

        fact NoSelfContainment {
            no d: Dir | d in d.^contents
        }

        fact RootHasNoParent {
            no d: Dir | Root in d.contents
        }

        fact AllObjectsReachable {
            Object in Root.*contents
        }

        pred createFile[d: Dir, f: File] {
            f not in d.contents
            d.contents' = d.contents + f
        }

        pred deleteFile[d: Dir, f: File] {
            f in d.contents
            d.contents' = d.contents - f
        }

        assert NoOrphans {
            always (all o: Object | o in Root.*contents)
        }

        assert NoCycles {
            always (no d: Dir | d in d.^contents)
        }

        check NoOrphans for 5
        check NoCycles for 5

        ===============================================================================
        OUTPUT FORMAT (JSON)
        ===============================================================================

        Return a JSON object with this structure:

        {
            "criticalComponents": [
                {
                    "id": "comp-001",
                    "name": "Payment Transaction Processing",
                    "type": "Payment",
                    "description": "...",
                    "criticalityReason": "Financial loss if atomicity violated",
                    "complexity": "High",
                    "requiresFormalVerification": true,
                    "verificationMethod": ["TLA+"]
                }
            ],
            "formalSpecs": [
                {
                    "id": "spec-001",
                    "componentId": "comp-001",
                    "language": "TLA+",
                    "specification": "---- MODULE Payment ----\\n...",
                    "properties": [
                        {
                            "id": "prop-001",
                            "name": "BalanceNonNegative",
                            "type": "Safety",
                            "formula": "\\\\A account : balance[account] >= 0",
                            "description": "Balance never negative",
                            "critical": true
                        }
                    ],
                    "invariants": [
                        {
                            "id": "inv-001",
                            "name": "TypeInvariant",
                            "expression": "balance \\\\in [Accounts -> Nat]",
                            "description": "Balance is natural number",
                            "scope": "Component",
                            "mustHold": "Always"
                        }
                    ],
                    "temporalProperties": [
                        {
                            "id": "temp-001",
                            "name": "EventualCompletion",
                            "operator": "Eventually",
                            "formula": "<>(transaction.status = \\"completed\\")",
                            "description": "Every transaction eventually completes"
                        }
                    ]
                }
            ],
            "propertyVerification": [
                {
                    "specId": "spec-001",
                    "propertyId": "prop-001",
                    "method": "Model Checking",
                    "status": "Pending"
                }
            ],
            "modelCheckingResults": [
                {
                    "specId": "spec-001",
                    "tool": "TLC",
                    "configuration": {
                        "maxStates": 100000000,
                        "maxTraceLength": 50,
                        "workers": 4,
                        "symmetry": true
                    },
                    "results": [],
                    "summary": {
                        "totalProperties": 3,
                        "satisfied": 0,
                        "violated": 0,
                        "unknown": 3,
                        "statesExplored": 0,
                        "distinctStates": 0,
                        "duration": 0,
                        "memoryUsed": "0MB"
                    },
                    "executedAt": "${new Date().toISOString()}"
                }
            ],
            "completed": true
        }

        ===============================================================================
        GUIDELINES
        ===============================================================================

        1. FOCUS ON CRITICAL COMPONENTS: Only apply formal methods where correctness is essential
        2. START SIMPLE: Use TLA+ for most cases (AWS standard)
        3. REALISTIC PROPERTIES: Focus on properties that catch real bugs (e.g., race conditions, atomicity violations)
        4. INCLUDE EXAMPLES: Provide concrete constant values for model checking
        5. DOCUMENTATION: Explain WHY each property matters and WHAT bugs it prevents
        6. EXECUTABLE SPECS: Ensure specifications can run in TLC or Alloy Analyzer
        7. COUNTEREXAMPLES: If a property is violated, the model checker will provide a trace

        Return ONLY valid JSON. No markdown, no explanations outside JSON.
        `;
    }

    /**
     * TIER 4: Generate State Machine Specification with Property Verification
     * Purpose: Enable AI to generate correct state transition implementations
     *
     * This specification provides:
     * 1. Formal state machine definitions for entities with complex lifecycle
     * 2. State transition rules with guards and actions
     * 3. State invariants and properties to verify
     * 4. Mermaid state diagrams for visualization
     * 5. Test cases for state transitions
     *
     * Use cases:
     * - Order lifecycle (Created → Paid → Shipped → Delivered)
     * - User account states (Active → Suspended → Deleted)
     * - Workflow orchestration (Task dependencies, approvals)
     * - Payment processing (Pending → Authorized → Captured → Refunded)
     * - Document review (Draft → Review → Approved → Published)
     *
     * Research basis:
     * - UML State Machines (OMG standard)
     * - Hierarchical state machines (substates, composite states)
     * - Property verification (Safety, Liveness, Reachability, Deadlock Freedom)
     * - Executable state machines (XState, Statecharts)
     *
     * @param useCases - Use cases from analysis
     * @param objectDesign - Class diagrams and contracts
     * @param businessRules - Business rules specification
     * @returns Prompt for AI to generate state machine specification
     */
    static createStateMachinePrompt(
        useCases: any[],
        objectDesign: any,
        businessRules?: any
    ): string {
        const useCasesStr = useCases ? JSON.stringify(useCases, null, 2) : 'Not provided';
        const designStr = objectDesign ? JSON.stringify(objectDesign, null, 2) : 'Not provided';
        const rulesStr = businessRules ? JSON.stringify(businessRules, null, 2) : 'Not provided';

        return `
        You are a state machine modeling expert specializing in UML State Machines and formal verification.
        Generate comprehensive state machine specifications for entities with complex lifecycles.

        ===============================================================================
        CONTEXT INFORMATION
        ===============================================================================

        USE CASES:
        ${useCasesStr}

        OBJECT DESIGN:
        ${designStr}

        BUSINESS RULES:
        ${rulesStr}

        ===============================================================================
        YOUR TASK: GENERATE STATE MACHINE SPECIFICATIONS
        ===============================================================================

        STEP 1: IDENTIFY STATEFUL ENTITIES
        -----------------------------------
        Analyze the system and identify entities that require state machines:

        Look for entities with:
        - Complex lifecycle (multiple states, transitions)
        - State-dependent behavior (operations valid only in certain states)
        - Business workflow (approval chains, order processing)
        - Long-running processes (multi-step workflows)
        - Event-driven behavior (state changes triggered by events)

        Common examples:
        - Order/Purchase (Created → Paid → Shipped → Delivered → Completed)
        - User Account (Active → Suspended → Deleted)
        - Document (Draft → Review → Approved → Published → Archived)
        - Payment (Pending → Authorized → Captured → Refunded)
        - Ticket/Issue (Open → InProgress → Resolved → Closed)
        - Subscription (Trial → Active → Paused → Cancelled → Expired)
        - Workflow Task (Pending → Assigned → InProgress → Completed → Verified)

        For each stateful entity, create a state machine specification.

        STEP 2: DEFINE STATES
        ---------------------
        For each state machine, define all possible states:

        State Types:
        - Initial: Starting state (exactly one)
        - Normal: Regular states
        - Final: End states (can be multiple)
        - Error: Error states
        - Choice: Decision points (conditional transitions)
        - Fork: Split into concurrent substates
        - Join: Merge concurrent substates

        For each state, specify:
        {
            "id": "state-paid",
            "name": "Paid",
            "type": "Normal",
            "entryActions": [
                {
                    "type": "Call",
                    "target": "sendConfirmationEmail",
                    "parameters": {"orderId": "order.id"},
                    "description": "Send payment confirmation to customer"
                }
            ],
            "exitActions": [],
            "doActions": [],
            "allowedOperations": ["ship", "cancel", "refund"],
            "invariants": [
                "order.payment != null",
                "order.payment.status == 'completed'",
                "order.total > 0"
            ],
            "timeout": {
                "duration": 172800000,  // 48 hours in ms
                "targetState": "cancelled",
                "action": {
                    "type": "Call",
                    "target": "refundPayment",
                    "description": "Auto-cancel if not shipped within 48h"
                }
            }
        }

        STEP 3: DEFINE TRANSITIONS
        ---------------------------
        For each transition between states:

        Transition Definition:
        {
            "id": "trans-001",
            "from": "payment-pending",
            "to": "paid",
            "trigger": {
                "type": "Event",
                "event": "payment_success",
                "condition": "payment.amount == order.total"
            },
            "guard": {
                "expression": "order.items.length > 0 && order.total > 0",
                "variables": ["order.items", "order.total"],
                "description": "Order must have items and positive total"
            },
            "actions": [
                {
                    "type": "Assign",
                    "target": "order.paymentId",
                    "parameters": {"value": "payment.id"},
                    "description": "Record payment ID"
                },
                {
                    "type": "Send",
                    "target": "NotificationService",
                    "parameters": {"event": "order_paid", "orderId": "order.id"},
                    "description": "Notify fulfillment service"
                }
            ],
            "priority": 1,
            "description": "Transition from pending to paid when payment succeeds"
        }

        Trigger Types:
        - Event: External event (API call, user action)
        - Completion: State activities completed
        - Time: Timeout or scheduled event
        - Change: Variable value changed
        - Call: Method invocation

        STEP 4: DEFINE STATE INVARIANTS
        --------------------------------
        Conditions that must hold in specific states or globally:

        {
            "id": "inv-001",
            "name": "PaidOrderHasPayment",
            "expression": "state == 'Paid' => payment != null",
            "description": "Paid orders must have payment record",
            "scope": "State",
            "appliesTo": ["paid", "shipped", "delivered"],
            "critical": true
        }

        STEP 5: DEFINE PROPERTIES TO VERIFY
        ------------------------------------
        Properties to check for state machine correctness:

        Property Types:
        - Safety: Bad states never reached (e.g., "Never deliver without payment")
        - Liveness: Good states eventually reached (e.g., "Every order eventually reaches final state")
        - Reachability: All states reachable from initial state
        - Deadlock Freedom: No states where system gets stuck
        - Determinism: At most one transition per event in each state
        - Completeness: All events handled in all states

        {
            "id": "prop-001",
            "name": "NeverDeliverWithoutPayment",
            "type": "Safety",
            "formula": "state == 'Delivered' => payment != null && payment.status == 'completed'",
            "description": "Cannot deliver order without successful payment",
            "verificationMethod": "Model Checking",
            "verificationStatus": "Verified"
        }

        STEP 6: GENERATE MERMAID STATE DIAGRAM
        ---------------------------------------
        Generate Mermaid syntax for UML state diagram:

        stateDiagram-v2
            [*] --> Created
            Created --> PaymentPending : submit
            PaymentPending --> Paid : payment_success
            PaymentPending --> Failed : payment_failed
            PaymentPending --> Cancelled : cancel
            Paid --> Processing : start_processing
            Processing --> Shipped : ship
            Shipped --> Delivered : confirm_delivery
            Delivered --> [*]
            Cancelled --> [*]
            Failed --> [*]

            note right of PaymentPending
                Timeout: 30 minutes
                Auto-cancel if no payment
            end note

            note right of Paid
                Invariant: payment != null
                Actions: sendConfirmationEmail
            end note

        STEP 7: GENERATE TEST CASES
        ----------------------------
        Test cases to verify state machine behavior:

        {
            "id": "test-001",
            "name": "Happy Path - Order Fulfillment",
            "description": "Test successful order flow from creation to delivery",
            "initialState": "created",
            "eventSequence": [
                {
                    "event": "submit",
                    "parameters": {"items": [{"id": 1, "qty": 2}], "total": 100},
                    "expectedState": "payment-pending",
                    "expectedGuard": true
                },
                {
                    "event": "payment_success",
                    "parameters": {"paymentId": "pay_123", "amount": 100},
                    "expectedState": "paid",
                    "expectedGuard": true
                },
                {
                    "event": "start_processing",
                    "parameters": {},
                    "expectedState": "processing",
                    "expectedGuard": true
                },
                {
                    "event": "ship",
                    "parameters": {"trackingNumber": "TRK123"},
                    "expectedState": "shipped",
                    "expectedGuard": true
                },
                {
                    "event": "confirm_delivery",
                    "parameters": {},
                    "expectedState": "delivered",
                    "expectedGuard": true
                }
            ],
            "expectedFinalState": "delivered",
            "expectedActions": [
                "sendConfirmationEmail",
                "notifyFulfillmentService",
                "sendShippingNotification",
                "sendDeliveryConfirmation"
            ],
            "shouldSucceed": true
        }

        ===============================================================================
        REAL-WORLD EXAMPLE: ORDER STATE MACHINE
        ===============================================================================

        {
            "id": "sm-order",
            "name": "Order Lifecycle",
            "entity": "Order",
            "description": "State machine for e-commerce order processing",
            "type": "Simple",
            "states": [
                {
                    "id": "created",
                    "name": "Created",
                    "type": "Initial",
                    "entryActions": [],
                    "exitActions": [],
                    "allowedOperations": ["submit", "cancel"],
                    "invariants": ["order.items.length > 0", "order.total > 0"]
                },
                {
                    "id": "payment-pending",
                    "name": "PaymentPending",
                    "type": "Normal",
                    "entryActions": [
                        {
                            "type": "Call",
                            "target": "initiatePayment",
                            "description": "Start payment processing"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": ["cancel"],
                    "invariants": ["order.total > 0"],
                    "timeout": {
                        "duration": 1800000,  // 30 min
                        "targetState": "cancelled",
                        "action": {
                            "type": "Call",
                            "target": "cancelOrder",
                            "description": "Auto-cancel if payment not completed"
                        }
                    }
                },
                {
                    "id": "paid",
                    "name": "Paid",
                    "type": "Normal",
                    "entryActions": [
                        {
                            "type": "Send",
                            "target": "EmailService",
                            "parameters": {"template": "payment_confirmation"},
                            "description": "Send payment confirmation email"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": ["start_processing", "cancel", "refund"],
                    "invariants": [
                        "order.payment != null",
                        "order.payment.status == 'completed'"
                    ]
                },
                {
                    "id": "processing",
                    "name": "Processing",
                    "type": "Normal",
                    "entryActions": [
                        {
                            "type": "Call",
                            "target": "allocateInventory",
                            "description": "Reserve items from inventory"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": ["ship", "cancel"],
                    "invariants": ["order.inventoryAllocated == true"]
                },
                {
                    "id": "shipped",
                    "name": "Shipped",
                    "type": "Normal",
                    "entryActions": [
                        {
                            "type": "Send",
                            "target": "EmailService",
                            "parameters": {"template": "shipping_notification"},
                            "description": "Send shipping notification"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": ["confirm_delivery"],
                    "invariants": ["order.trackingNumber != null"]
                },
                {
                    "id": "delivered",
                    "name": "Delivered",
                    "type": "Final",
                    "entryActions": [
                        {
                            "type": "Call",
                            "target": "completeOrder",
                            "description": "Mark order as completed"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": [],
                    "invariants": ["order.deliveredAt != null"]
                },
                {
                    "id": "cancelled",
                    "name": "Cancelled",
                    "type": "Final",
                    "entryActions": [
                        {
                            "type": "Call",
                            "target": "refundIfPaid",
                            "description": "Refund payment if order was paid"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": [],
                    "invariants": []
                },
                {
                    "id": "failed",
                    "name": "Failed",
                    "type": "Error",
                    "entryActions": [
                        {
                            "type": "Log",
                            "target": "ErrorLog",
                            "parameters": {"level": "ERROR"},
                            "description": "Log payment failure"
                        }
                    ],
                    "exitActions": [],
                    "allowedOperations": ["retry"],
                    "invariants": []
                }
            ],
            "transitions": [
                {
                    "id": "trans-001",
                    "from": "created",
                    "to": "payment-pending",
                    "trigger": {
                        "type": "Event",
                        "event": "submit"
                    },
                    "guard": {
                        "expression": "order.items.length > 0 && order.total > 0",
                        "variables": ["order.items", "order.total"],
                        "description": "Order must have items and positive total"
                    },
                    "actions": [
                        {
                            "type": "Assign",
                            "target": "order.submittedAt",
                            "parameters": {"value": "Date.now()"},
                            "description": "Record submission time"
                        }
                    ],
                    "priority": 1,
                    "description": "Submit order for payment"
                },
                {
                    "id": "trans-002",
                    "from": "payment-pending",
                    "to": "paid",
                    "trigger": {
                        "type": "Event",
                        "event": "payment_success"
                    },
                    "guard": {
                        "expression": "payment.amount == order.total",
                        "variables": ["payment.amount", "order.total"],
                        "description": "Payment amount must match order total"
                    },
                    "actions": [
                        {
                            "type": "Assign",
                            "target": "order.paymentId",
                            "parameters": {"value": "payment.id"},
                            "description": "Record payment ID"
                        }
                    ],
                    "priority": 1,
                    "description": "Payment completed successfully"
                },
                {
                    "id": "trans-003",
                    "from": "payment-pending",
                    "to": "failed",
                    "trigger": {
                        "type": "Event",
                        "event": "payment_failed"
                    },
                    "actions": [
                        {
                            "type": "Assign",
                            "target": "order.failureReason",
                            "parameters": {"value": "payment.error"},
                            "description": "Record failure reason"
                        }
                    ],
                    "priority": 1,
                    "description": "Payment failed"
                },
                {
                    "id": "trans-004",
                    "from": "paid",
                    "to": "processing",
                    "trigger": {
                        "type": "Event",
                        "event": "start_processing"
                    },
                    "priority": 1,
                    "description": "Start order processing"
                },
                {
                    "id": "trans-005",
                    "from": "processing",
                    "to": "shipped",
                    "trigger": {
                        "type": "Event",
                        "event": "ship"
                    },
                    "guard": {
                        "expression": "trackingNumber != null",
                        "variables": ["trackingNumber"],
                        "description": "Must have tracking number"
                    },
                    "actions": [
                        {
                            "type": "Assign",
                            "target": "order.trackingNumber",
                            "parameters": {"value": "trackingNumber"},
                            "description": "Record tracking number"
                        }
                    ],
                    "priority": 1,
                    "description": "Ship order"
                },
                {
                    "id": "trans-006",
                    "from": "shipped",
                    "to": "delivered",
                    "trigger": {
                        "type": "Event",
                        "event": "confirm_delivery"
                    },
                    "actions": [
                        {
                            "type": "Assign",
                            "target": "order.deliveredAt",
                            "parameters": {"value": "Date.now()"},
                            "description": "Record delivery time"
                        }
                    ],
                    "priority": 1,
                    "description": "Confirm delivery"
                },
                {
                    "id": "trans-cancel",
                    "from": "*",
                    "to": "cancelled",
                    "trigger": {
                        "type": "Event",
                        "event": "cancel"
                    },
                    "guard": {
                        "expression": "state != 'shipped' && state != 'delivered'",
                        "variables": ["state"],
                        "description": "Cannot cancel after shipping"
                    },
                    "actions": [
                        {
                            "type": "Call",
                            "target": "refundIfPaid",
                            "description": "Refund if payment was made"
                        }
                    ],
                    "priority": 10,
                    "description": "Cancel order (from any non-final state)"
                }
            ],
            "initialState": "created",
            "finalStates": ["delivered", "cancelled"],
            "errorStates": ["failed"],
            "invariants": [
                {
                    "id": "inv-global-001",
                    "name": "TotalPositive",
                    "expression": "order.total > 0",
                    "description": "Order total must always be positive",
                    "scope": "Global",
                    "critical": true
                },
                {
                    "id": "inv-state-001",
                    "name": "PaidHasPayment",
                    "expression": "state IN ['paid', 'processing', 'shipped', 'delivered'] => payment != null",
                    "description": "Paid orders must have payment record",
                    "scope": "State",
                    "appliesTo": ["paid", "processing", "shipped", "delivered"],
                    "critical": true
                }
            ],
            "properties": [
                {
                    "id": "prop-safety-001",
                    "name": "NeverDeliverWithoutPayment",
                    "type": "Safety",
                    "formula": "state == 'delivered' => payment != null",
                    "description": "Cannot deliver order without payment",
                    "verificationMethod": "Model Checking",
                    "verificationStatus": "Verified"
                },
                {
                    "id": "prop-liveness-001",
                    "name": "EventuallyFinal",
                    "type": "Liveness",
                    "formula": "<>(state IN finalStates)",
                    "description": "Every order eventually reaches a final state",
                    "verificationMethod": "Model Checking",
                    "verificationStatus": "Verified"
                },
                {
                    "id": "prop-reach-001",
                    "name": "AllStatesReachable",
                    "type": "Reachability",
                    "formula": "ALL states (except error) reachable from initial",
                    "description": "All non-error states should be reachable",
                    "verificationMethod": "Model Checking",
                    "verificationStatus": "Verified"
                }
            ],
            "mermaidDiagram": "stateDiagram-v2\\n    [*] --> Created\\n    Created --> PaymentPending : submit\\n    PaymentPending --> Paid : payment_success\\n    PaymentPending --> Failed : payment_failed\\n    PaymentPending --> Cancelled : cancel\\n    Paid --> Processing : start_processing\\n    Processing --> Shipped : ship\\n    Shipped --> Delivered : confirm_delivery\\n    Delivered --> [*]\\n    Created --> Cancelled : cancel\\n    Paid --> Cancelled : cancel\\n    Processing --> Cancelled : cancel\\n    Cancelled --> [*]\\n    Failed --> [*]\\n\\n    note right of PaymentPending\\n        Timeout: 30 minutes\\n        Auto-cancel if no payment\\n    end note",
            "testCases": [
                {
                    "id": "test-happy-path",
                    "name": "Happy Path - Full Order Fulfillment",
                    "description": "Test successful order flow from creation to delivery",
                    "initialState": "created",
                    "eventSequence": [
                        {
                            "event": "submit",
                            "parameters": {"items": [{"id": 1, "qty": 2}], "total": 100},
                            "expectedState": "payment-pending",
                            "expectedGuard": true
                        },
                        {
                            "event": "payment_success",
                            "parameters": {"paymentId": "pay_123", "amount": 100},
                            "expectedState": "paid",
                            "expectedGuard": true
                        },
                        {
                            "event": "start_processing",
                            "parameters": {},
                            "expectedState": "processing",
                            "expectedGuard": true
                        },
                        {
                            "event": "ship",
                            "parameters": {"trackingNumber": "TRK123"},
                            "expectedState": "shipped",
                            "expectedGuard": true
                        },
                        {
                            "event": "confirm_delivery",
                            "parameters": {},
                            "expectedState": "delivered",
                            "expectedGuard": true
                        }
                    ],
                    "expectedFinalState": "delivered",
                    "expectedActions": ["sendConfirmationEmail", "sendShippingNotification"],
                    "shouldSucceed": true
                },
                {
                    "id": "test-payment-failure",
                    "name": "Payment Failure",
                    "description": "Test payment failure scenario",
                    "initialState": "created",
                    "eventSequence": [
                        {
                            "event": "submit",
                            "parameters": {"items": [{"id": 1, "qty": 1}], "total": 50},
                            "expectedState": "payment-pending",
                            "expectedGuard": true
                        },
                        {
                            "event": "payment_failed",
                            "parameters": {"error": "Insufficient funds"},
                            "expectedState": "failed",
                            "expectedGuard": true
                        }
                    ],
                    "expectedFinalState": "failed",
                    "expectedActions": [],
                    "shouldSucceed": true
                },
                {
                    "id": "test-early-cancellation",
                    "name": "Early Cancellation",
                    "description": "Cancel order before payment",
                    "initialState": "created",
                    "eventSequence": [
                        {
                            "event": "submit",
                            "parameters": {"items": [{"id": 1, "qty": 1}], "total": 50},
                            "expectedState": "payment-pending",
                            "expectedGuard": true
                        },
                        {
                            "event": "cancel",
                            "parameters": {},
                            "expectedState": "cancelled",
                            "expectedGuard": true
                        }
                    ],
                    "expectedFinalState": "cancelled",
                    "expectedActions": [],
                    "shouldSucceed": true
                },
                {
                    "id": "test-late-cancellation",
                    "name": "Late Cancellation (After Payment)",
                    "description": "Cancel order after payment is made",
                    "initialState": "created",
                    "eventSequence": [
                        {
                            "event": "submit",
                            "parameters": {"items": [{"id": 1, "qty": 1}], "total": 50},
                            "expectedState": "payment-pending",
                            "expectedGuard": true
                        },
                        {
                            "event": "payment_success",
                            "parameters": {"paymentId": "pay_456", "amount": 50},
                            "expectedState": "paid",
                            "expectedGuard": true
                        },
                        {
                            "event": "cancel",
                            "parameters": {},
                            "expectedState": "cancelled",
                            "expectedGuard": true
                        }
                    ],
                    "expectedFinalState": "cancelled",
                    "expectedActions": ["refundIfPaid"],
                    "shouldSucceed": true
                },
                {
                    "id": "test-invalid-transition",
                    "name": "Invalid Transition (Safety Violation)",
                    "description": "Attempt to ship without payment",
                    "initialState": "created",
                    "eventSequence": [
                        {
                            "event": "submit",
                            "parameters": {"items": [{"id": 1, "qty": 1}], "total": 50},
                            "expectedState": "payment-pending",
                            "expectedGuard": true
                        },
                        {
                            "event": "ship",
                            "parameters": {"trackingNumber": "TRK999"},
                            "expectedState": "payment-pending",
                            "expectedGuard": false
                        }
                    ],
                    "expectedFinalState": "payment-pending",
                    "expectedActions": [],
                    "shouldSucceed": false,
                    "violatesProperty": "NeverDeliverWithoutPayment"
                }
            ]
        }

        ===============================================================================
        OUTPUT FORMAT (JSON)
        ===============================================================================

        Return a JSON object with this structure:

        {
            "stateMachines": [
                {
                    "id": "sm-order",
                    "name": "Order Lifecycle",
                    "entity": "Order",
                    "description": "...",
                    "type": "Simple",
                    "states": [...],
                    "transitions": [...],
                    "initialState": "created",
                    "finalStates": ["delivered", "cancelled"],
                    "errorStates": ["failed"],
                    "invariants": [...],
                    "properties": [...],
                    "mermaidDiagram": "...",
                    "testCases": [...]
                }
            ],
            "completed": true
        }

        ===============================================================================
        GUIDELINES
        ===============================================================================

        1. IDENTIFY KEY ENTITIES: Focus on entities with complex lifecycles (Order, User, Document, Workflow)
        2. COMPLETE STATE COVERAGE: Include all states (normal, error, final)
        3. GUARD CONDITIONS: Use precise guard conditions to prevent invalid transitions
        4. STATE INVARIANTS: Define conditions that must hold in each state
        5. ENTRY/EXIT ACTIONS: Specify side effects when entering/leaving states
        6. TIMEOUT HANDLING: Include timeout transitions where relevant (payment expiry, session timeout)
        7. ERROR STATES: Model failure scenarios and recovery paths
        8. PROPERTY VERIFICATION: Include safety, liveness, reachability properties
        9. TEST CASES: Generate test cases for happy path, error cases, and property violations
        10. MERMAID DIAGRAMS: Provide visual representation for human review

        Return ONLY valid JSON. No markdown, no explanations outside JSON.
        `;
    }
}
