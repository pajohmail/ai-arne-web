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

    // Phase 1: Analysis
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
}
