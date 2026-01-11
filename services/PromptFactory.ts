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
}
