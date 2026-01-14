import { DesignDocument, UseCase, GherkinScenario } from "@/core/models/DesignDocument";
import { IVertexAIRepository } from "@/repositories/interfaces/IVertexAIRepository";
import { PromptFactory } from "./PromptFactory";
import { ValidationError } from "@/core/errors/ApplicationErrors";
import { handleError } from "@/core/utils/errorHandler";
import { ChatAnalysisResponseSchema, MermaidCodeSchema, RequirementsAnalysisResponseSchema } from "@/core/schemas/AIResponseSchemas";
import { z } from 'zod';

export interface IDesignArchitectService {
    startAnalysis(projectId: string, initialDescription: string): Promise<DesignDocument>;
    analyzeRequirementsChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }>;
    analyzeTechStackChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }>;
    analyzeChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }>;
    generateDomainModel(document: DesignDocument): Promise<DesignDocument>;
    startSystemDesign(document: DesignDocument): Promise<DesignDocument>;
    generateSystemArchitecture(document: DesignDocument): Promise<DesignDocument>;
    generateObjectDesign(document: DesignDocument): Promise<DesignDocument>;
    validateDesign(document: DesignDocument): Promise<DesignDocument>;
    generateFinalReport(document: DesignDocument): Promise<string>;
    // TIER 1 Improvements
    generateGherkinScenarios(useCase: UseCase, requirements?: any): Promise<GherkinScenario[]>;
    generateApiSpecification(document: DesignDocument): Promise<DesignDocument>;
    generateTraceabilityMatrix(document: DesignDocument): Promise<DesignDocument>;
    // TIER 2 Improvements
    generateAlgorithmSpecs(document: DesignDocument): Promise<DesignDocument>;
    generateBusinessRules(document: DesignDocument): Promise<DesignDocument>;
    generateDatabaseSchema(document: DesignDocument): Promise<DesignDocument>;
    generateErrorTaxonomy(document: DesignDocument): Promise<DesignDocument>;
    // TIER 3 Improvements
    generateSecuritySpec(document: DesignDocument): Promise<DesignDocument>;
    generateDeploymentSpec(document: DesignDocument): Promise<DesignDocument>;
    generateObservabilitySpec(document: DesignDocument): Promise<DesignDocument>;
    generatePerformanceSpec(document: DesignDocument): Promise<DesignDocument>;
    // TIER 4 Improvements
    generateFormalMethodsSpec(document: DesignDocument): Promise<DesignDocument>;
    generateStateMachineSpec(document: DesignDocument): Promise<DesignDocument>;
}

export class DesignArchitectService implements IDesignArchitectService {
    constructor(private vertexRepo: IVertexAIRepository) { }

    async startAnalysis(projectId: string, initialDescription: string): Promise<DesignDocument> {
        // Create initial document structure
        const doc: DesignDocument = {
            id: crypto.randomUUID(), // Or generate from DB
            userId: 'current-user-id', // Should be injected or passed
            projectName: projectId,
            description: initialDescription,
            currentPhase: 'requirementsSpec',
            targetTier: 1,  // Default to TIER 1 (Basic)
            requirementsSpec: {
                projectPurpose: '',
                stakeholders: [],
                constraints: [],
                functionalRequirements: [],
                qualityRequirements: [],
                completed: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return doc;
    }

    async analyzeRequirementsChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }> {
        if (!document.requirementsSpec) {
            throw new ValidationError("Requirements phase not initialized", {
                documentId: document.id,
                currentPhase: document.currentPhase
            });
        }

        const prompt = PromptFactory.createRequirementsExtractionPrompt(chatLog);
        const result = await this.vertexRepo.generateText(prompt);

        let reply = "I've updated the requirements specification.";

        try {
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            const validated = RequirementsAnalysisResponseSchema.parse(parsed);

            // Merge/update requirements data
            document.requirementsSpec.projectPurpose = validated.projectPurpose || document.requirementsSpec.projectPurpose;
            document.requirementsSpec.stakeholders = validated.stakeholders || document.requirementsSpec.stakeholders;
            document.requirementsSpec.constraints = validated.constraints || document.requirementsSpec.constraints;
            document.requirementsSpec.functionalRequirements = validated.functionalRequirements || document.requirementsSpec.functionalRequirements;
            document.requirementsSpec.qualityRequirements = validated.qualityRequirements || document.requirementsSpec.qualityRequirements;

            reply = validated.reply;
            document.updatedAt = new Date();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const zodError = error as any;
                const errors = zodError.errors.map((e: any) => e.message).join(", ");
                throw new ValidationError(`Requirements are invalid: ${errors}`);
            }
            const appError = handleError(error);
            console.error("Failed to parse AI response", appError);
            reply = "I had trouble processing the requirements, but I'm still listening.";
        }

        return { document, reply };
    }

    async analyzeTechStackChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }> {
        if (!document.techStack) {
            document.techStack = {
                reasoning: '',
                completed: false
            };
        }

        // Build requirements context
        let requirementsContext = '';
        if (document.requirementsSpec) {
            const req = document.requirementsSpec;
            requirementsContext = `
Project Purpose: ${req.projectPurpose}

Functional Requirements:
${req.functionalRequirements?.map(fr => `- ${fr.title} (${fr.priority}): ${fr.description}`).join('\n')}

Quality Requirements:
${req.qualityRequirements?.map(qr => `- ${qr.category}: ${qr.description}`).join('\n')}

Constraints:
${req.constraints?.map(c => `- ${c.type}: ${c.description}`).join('\n')}
            `.trim();
        }

        const prompt = PromptFactory.createTechStackPrompt(chatLog, requirementsContext);
        const result = await this.vertexRepo.generateText(prompt);

        let reply = "Jag har uppdaterat teknologistacken.";

        try {
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Update tech stack from AI response
            if (parsed.frontend) document.techStack.frontend = parsed.frontend;
            if (parsed.backend) document.techStack.backend = parsed.backend;
            if (parsed.database) document.techStack.database = parsed.database;
            if (parsed.hosting) document.techStack.hosting = parsed.hosting;
            if (parsed.additionalTools) document.techStack.additionalTools = parsed.additionalTools;
            if (parsed.reasoning) document.techStack.reasoning = parsed.reasoning;

            reply = parsed.reply || reply;
            document.updatedAt = new Date();
        } catch (error) {
            const appError = handleError(error);
            console.error("Failed to parse tech stack AI response", appError);
            reply = "Jag hade problem att bearbeta informationen, men jag lyssnar fortfarande.";
        }

        return { document, reply };
    }

    async analyzeChat(document: DesignDocument, chatLog: string): Promise<{ document: DesignDocument, reply: string }> {
        if (!document.analysis) {
            throw new ValidationError("Analysis phase not initialized", {
                documentId: document.id,
                currentPhase: document.currentPhase
            });
        }

        // Build requirements context string
        let requirementsContext = '';
        if (document.requirementsSpec) {
            const req = document.requirementsSpec;
            requirementsContext = `
Purpose: ${req.projectPurpose}

Functional Requirements:
${req.functionalRequirements?.map(fr => `- ${fr.title} (${fr.priority}): ${fr.description}`).join('\n')}

Quality Requirements:
${req.qualityRequirements?.map(qr => `- ${qr.category}: ${qr.description}`).join('\n')}
            `.trim();
        }

        let techStackContext = '';
        if (document.techStack) {
            const ts = document.techStack;
            techStackContext = `
Frontend: ${ts.frontend?.name || 'Not specified'}
Backend: ${ts.backend?.name || 'Not specified'}
Database: ${ts.database?.name || 'Not specified'}
Hosting: ${ts.hosting?.name || 'Not specified'}
Additional Tools: ${ts.additionalTools?.map(t => t.name).join(', ') || 'None'}
            `.trim();
        }

        const prompt = PromptFactory.createUseCaseExtractionPrompt(chatLog, requirementsContext, techStackContext);
        const result = await this.vertexRepo.generateText(prompt);

        let reply = "I've updated the analysis.";

        // Parse JSON result with Zod validation
        try {
            // Clean up code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Validate with Zod schema
            const validated = ChatAnalysisResponseSchema.parse(parsed);

            document.analysis.useCases = validated.useCases;
            reply = validated.reply;
            document.updatedAt = new Date();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const zodError = error as any;
                const errors = zodError.errors.map((e: any) => e.message).join(", ");
                throw new ValidationError(`Use cases are invalid: ${errors}`);
            }

            const appError = handleError(error);
            console.error("Failed to parse AI response", appError);

            // Return graceful fallback for non-validation errors
            reply = "I had trouble processing the design updates, but I'm still listening.";
        }

        return { document, reply };
    }

    async generateDomainModel(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || document.analysis.useCases.length === 0) {
            throw new ValidationError("No Use Cases available for Domain Model generation", {
                documentId: document.id,
                useCaseCount: document.analysis?.useCases.length || 0
            });
        }

        const prompt = PromptFactory.createDomainModelPrompt(document.analysis.useCases);
        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result.trim();

        // Validate Mermaid code with Zod
        try {
            const validated = MermaidCodeSchema.parse(mermaidCode);
            document.analysis.domainModelMermaid = validated;
        } catch (error) {
            if (error instanceof z.ZodError) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const zodError = error as any;
                throw new ValidationError('Invalid Mermaid diagram generated', {
                    zodErrors: zodError.errors,
                    generatedCode: mermaidCode.substring(0, 200),
                });
            }
            throw error;
        }

        document.updatedAt = new Date();
        return document;
    }

    async startSystemDesign(document: DesignDocument): Promise<DesignDocument> {
        // Note: currentPhase is managed by usePhaseAutomation, not individual methods
        document.systemDesign = {
            architectureDiagramMermaid: '',
            subsystems: [],
            completed: false
        };
        return document;
    }

    async generateSystemArchitecture(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || !document.analysis.domainModelMermaid) {
            throw new Error("Domain Model is required for System Design");
        }

        const prompt = PromptFactory.createArchitecturePrompt(
            document.analysis.domainModelMermaid,
            document.description || "No specific non-functional requirements provided." // Fallback
        );

        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result;

        if (!document.systemDesign) {
            await this.startSystemDesign(document);
        }

        // We know systemDesign exists because of startSystemDesign above, but TS might complain
        if (document.systemDesign) {
            document.systemDesign.architectureDiagramMermaid = mermaidCode;
            document.updatedAt = new Date();
        }

        return document;
    }

    async generateObjectDesign(document: DesignDocument): Promise<DesignDocument> {
        if (!document.systemDesign || !document.systemDesign.architectureDiagramMermaid) {
            throw new Error("System Architecture is required for Object Design");
        }

        const prompt = PromptFactory.createClassDiagramPrompt(
            document.analysis?.domainModelMermaid || '',
            document.systemDesign.architectureDiagramMermaid
        );

        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result;

        if (!document.objectDesign) {
            document.objectDesign = {
                classDiagramMermaid: '',
                sequenceDiagramsMermaid: [],
                contracts: [],
                completed: false
            };
        }

        document.objectDesign.classDiagramMermaid = mermaidCode;
        document.updatedAt = new Date();

        return document;
    }

    async validateDesign(document: DesignDocument): Promise<DesignDocument> {
        if (!document.objectDesign?.classDiagramMermaid) {
            throw new Error("Object Design is required for Validation");
        }
        if (!document.analysis?.useCases) {
            throw new Error("Use Cases are required for Validation");
        }

        const prompt = PromptFactory.createValidationPrompt(
            document.analysis.useCases,
            document.objectDesign.classDiagramMermaid
        );

        const result = await this.vertexRepo.generateText(prompt);

        if (!document.validation) {
            document.validation = {
                reviews: [],
                isApproved: false
            };
        }

        // Add the AI report as a review comment for now, or just store it.
        // For this MVP, let's append it to reviews or store in detailed field if we had one.
        // We'll create a system review comment.
        document.validation.reviews.push({
            id: crypto.randomUUID(),
            author: 'AI Validator',
            content: result,
            timestamp: new Date(),
            resolved: false
        });

        document.updatedAt = new Date();
        return document;
    }

    private getMermaidImageUrl(mermaidCode: string): string {
        const encoded = Buffer.from(mermaidCode).toString('base64');
        return `https://mermaid.ink/img/${encoded}`;
    }

    async generateFinalReport(document: DesignDocument): Promise<string> {
        // Deterministic generation of Markdown report
        let report = `# Design Document: ${document.projectName}\n\n`;
        report += `**Description:** ${document.description}\n\n`;

        // Requirements Specification
        if (document.requirementsSpec) {
            report += `## Phase 0: Requirements Specification\n\n`;
            report += `**Project Purpose:** ${document.requirementsSpec.projectPurpose}\n\n`;

            if (document.requirementsSpec.stakeholders.length > 0) {
                report += `### Stakeholders\n`;
                document.requirementsSpec.stakeholders.forEach(sh => {
                    report += `- **${sh.name}** (${sh.role}): ${sh.interests.join(', ')}\n`;
                });
                report += `\n`;
            }

            if (document.requirementsSpec.functionalRequirements.length > 0) {
                report += `### Functional Requirements\n`;
                document.requirementsSpec.functionalRequirements.forEach(fr => {
                    report += `- **${fr.title}** (${fr.priority}): ${fr.description}\n`;
                });
                report += `\n`;
            }

            if (document.requirementsSpec.qualityRequirements.length > 0) {
                report += `### Quality Requirements\n`;
                document.requirementsSpec.qualityRequirements.forEach(qr => {
                    report += `- **${qr.category}**: ${qr.description}${qr.metric ? ` (${qr.metric})` : ''}\n`;
                });
                report += `\n`;
            }

            if (document.requirementsSpec.constraints.length > 0) {
                report += `### Constraints\n`;
                document.requirementsSpec.constraints.forEach(c => {
                    report += `- **${c.type}**: ${c.description}\n`;
                });
                report += `\n`;
            }
        }

        // Technology Stack
        if (document.techStack) {
            report += `## Phase 1: Technology Stack\n\n`;
            report += `**Overall Reasoning:** ${document.techStack.reasoning}\n\n`;

            if (document.techStack.frontend) {
                report += `### Frontend\n`;
                report += `- **Technology:** ${document.techStack.frontend.name}\n`;
                report += `- **Category:** ${document.techStack.frontend.category}\n`;
                report += `- **Reasoning:** ${document.techStack.frontend.reasoning}\n\n`;
            }

            if (document.techStack.backend) {
                report += `### Backend\n`;
                report += `- **Technology:** ${document.techStack.backend.name}\n`;
                report += `- **Category:** ${document.techStack.backend.category}\n`;
                report += `- **Reasoning:** ${document.techStack.backend.reasoning}\n\n`;
            }

            if (document.techStack.database) {
                report += `### Database\n`;
                report += `- **Technology:** ${document.techStack.database.name}\n`;
                report += `- **Category:** ${document.techStack.database.category}\n`;
                report += `- **Reasoning:** ${document.techStack.database.reasoning}\n\n`;
            }

            if (document.techStack.hosting) {
                report += `### Hosting\n`;
                report += `- **Platform:** ${document.techStack.hosting.name}\n`;
                report += `- **Category:** ${document.techStack.hosting.category}\n`;
                report += `- **Reasoning:** ${document.techStack.hosting.reasoning}\n\n`;
            }

            if (document.techStack.additionalTools && document.techStack.additionalTools.length > 0) {
                report += `### Additional Tools & Services\n`;
                document.techStack.additionalTools.forEach(tool => {
                    report += `- **${tool.name}** (${tool.category}): ${tool.reasoning}\n`;
                });
                report += `\n`;
            }
        }

        report += `## Phase 2: Analysis\n\n`;
        report += `### Use Cases\n`;
        document.analysis?.useCases.forEach(uc => {
            report += `- **${uc.title}**: ${uc.narrative}\n`;
        });

        if (document.analysis?.domainModelMermaid) {
            report += `\n### Domain Model\n\n`;
            report += `**Diagram:**\n![Domain Model](${this.getMermaidImageUrl(document.analysis.domainModelMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.analysis.domainModelMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 3: System Design\n\n`;
        if (document.systemDesign?.architectureDiagramMermaid) {
            report += `### Architecture\n\n`;
            report += `**Diagram:**\n![Architecture](${this.getMermaidImageUrl(document.systemDesign.architectureDiagramMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.systemDesign.architectureDiagramMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 4: Object Design\n\n`;
        if (document.objectDesign?.classDiagramMermaid) {
            report += `### Class Diagram\n\n`;
            report += `**Diagram:**\n![Class Diagram](${this.getMermaidImageUrl(document.objectDesign.classDiagramMermaid)})\n\n`;
            report += `**Mermaid Code:**\n\`\`\`mermaid\n${document.objectDesign.classDiagramMermaid}\n\`\`\`\n\n`;
        }

        report += `## Phase 5: Validation\n\n`;
        const aiReview = document.validation?.reviews.find(r => r.author === 'AI Validator');
        if (aiReview) {
            report += `### AI Traceability Report\n${aiReview.content}\n\n`;
        }

        return report;
    }

    // Generate Gherkin BDD scenarios for use cases
    async generateGherkinScenarios(
        useCase: UseCase,
        requirements?: any
    ): Promise<GherkinScenario[]> {
        const prompt = PromptFactory.createGherkinPrompt(useCase, requirements);
        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Clean up code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Validate that it's an array
            if (!Array.isArray(parsed)) {
                throw new Error('Expected array of Gherkin scenarios');
            }

            return parsed as GherkinScenario[];
        } catch (error) {
            console.error('Failed to parse Gherkin scenarios:', error);
            // Return empty array on failure
            return [];
        }
    }

    // Generate OpenAPI specification
    async generateApiSpecification(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || !document.analysis.useCases || document.analysis.useCases.length === 0) {
            throw new ValidationError('Use cases are required for API specification generation', {
                documentId: document.id,
            });
        }

        const prompt = PromptFactory.createApiSpecPrompt(
            document.analysis.useCases,
            document.analysis.domainModelMermaid || '',
            document.techStack
        );

        const result = await this.vertexRepo.generateText(prompt);

        // Extract YAML from code blocks
        const yamlMatch = result.match(/```yaml([\s\S]*?)```/);
        const openApiSpec = yamlMatch ? yamlMatch[1].trim() : result.trim();

        // Initialize apiDesign if not exists
        if (!document.apiDesign) {
            document.apiDesign = {
                openApiSpec: '',
                apiDocumentation: '',
                completed: false
            };
        }

        document.apiDesign.openApiSpec = openApiSpec;
        document.apiDesign.apiDocumentation = `OpenAPI 3.0 specification with ${document.analysis.useCases.length} endpoints`;
        document.apiDesign.completed = true;
        document.updatedAt = new Date();

        return document;
    }

    // Generate Requirements Traceability Matrix
    async generateTraceabilityMatrix(document: DesignDocument): Promise<DesignDocument> {
        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for RTM generation', {
                documentId: document.id,
            });
        }

        if (!document.analysis || !document.objectDesign) {
            throw new ValidationError('Analysis and Object Design are required for RTM generation', {
                documentId: document.id,
            });
        }

        const prompt = PromptFactory.createTraceabilityPrompt(
            document.requirementsSpec,
            document.analysis.useCases,
            document.objectDesign.classDiagramMermaid,
            document.apiDesign?.openApiSpec
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Clean up code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Validate structure
            if (!parsed.requirements || !parsed.coverage) {
                throw new Error('Invalid RTM structure');
            }

            // Initialize validation if not exists
            if (!document.validation) {
                document.validation = {
                    reviews: [],
                    isApproved: false
                };
            }

            document.validation.traceabilityMatrix = parsed;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to parse Traceability Matrix:', error);
            throw new ValidationError('Failed to generate valid Traceability Matrix', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // TIER 2: Generate Algorithm Specifications for all operations
    async generateAlgorithmSpecs(document: DesignDocument): Promise<DesignDocument> {
        if (!document.objectDesign || !document.objectDesign.contracts) {
            throw new ValidationError('Object Design with contracts is required for algorithm spec generation', {
                documentId: document.id
            });
        }

        const context = `
        Domain Model: ${document.analysis?.domainModelMermaid || 'Not available'}
        Class Diagram: ${document.objectDesign.classDiagramMermaid}
        Requirements: ${JSON.stringify(document.requirementsSpec)}
        `;

        // Generate algorithm specs for each contract
        const updatedContracts = await Promise.all(
            document.objectDesign.contracts.map(async (contract) => {
                try {
                    const prompt = PromptFactory.createAlgorithmSpecPrompt(
                        contract.operation,
                        contract,
                        context
                    );

                    const result = await this.vertexRepo.generateText(prompt);

                    // Parse JSON response
                    const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
                    const algorithmSpec = JSON.parse(cleanJson);

                    return {
                        ...contract,
                        algorithmSpec
                    };
                } catch (error) {
                    console.error(`Failed to generate algorithm spec for ${contract.operation}:`, error);
                    // Return contract without algorithm spec if generation fails
                    return contract;
                }
            })
        );

        document.objectDesign.contracts = updatedContracts;
        document.updatedAt = new Date();

        return document;
    }

    // TIER 2: Generate Business Rules (DMN Decision Tables)
    async generateBusinessRules(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || !document.analysis.useCases || document.analysis.useCases.length === 0) {
            throw new ValidationError('Use cases are required for business rules generation', {
                documentId: document.id
            });
        }

        const decisionTables: any[] = [];

        // Generate decision tables for each use case
        for (const useCase of document.analysis.useCases) {
            try {
                const prompt = PromptFactory.createDecisionTablePrompt(
                    useCase,
                    document.requirementsSpec,
                    document.analysis.domainModelMermaid || ''
                );

                const result = await this.vertexRepo.generateText(prompt);

                // Parse JSON response
                const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
                const tables = JSON.parse(cleanJson);

                if (Array.isArray(tables) && tables.length > 0) {
                    decisionTables.push(...tables);
                }
            } catch (error) {
                console.error(`Failed to generate decision tables for use case ${useCase.title}:`, error);
                // Continue with other use cases
            }
        }

        // Only update if we generated at least one decision table
        if (decisionTables.length > 0) {
            document.businessRules = {
                decisionTables,
                completed: true
            };
        }

        document.updatedAt = new Date();

        return document;
    }

    // TIER 2 Fas 2: Generate Database Schema (DDL + ORM Mappings)
    async generateDatabaseSchema(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis?.domainModelMermaid) {
            throw new ValidationError('Domain model is required for database schema generation', {
                documentId: document.id
            });
        }

        if (!document.objectDesign?.classDiagramMermaid) {
            throw new ValidationError('Class diagram is required for database schema generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createDatabaseSchemaPrompt(
            document.analysis.domainModelMermaid,
            document.objectDesign.classDiagramMermaid,
            document.techStack
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const databaseSchema = JSON.parse(cleanJson);

            // Generate ER diagram (optional, AI might include it)
            let erDiagram = databaseSchema.erDiagram;
            if (!erDiagram && databaseSchema.tables) {
                // Generate simple ER diagram from tables
                erDiagram = this.generateERDiagram(databaseSchema.tables, databaseSchema.relationships);
            }

            // Generate DDL script
            const ddlScript = this.generateDDLScript(databaseSchema.tables, databaseSchema.indexes);

            document.dataModel = {
                databaseSchema,
                erDiagram,
                ddlScript,
                completed: true
            };

            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate database schema:', error);
            throw new ValidationError('Failed to generate valid database schema', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Helper: Generate ER diagram from database schema
    private generateERDiagram(tables: any[], relationships: any[]): string {
        let mermaid = 'erDiagram\n';

        // Add tables with columns
        tables.forEach(table => {
            mermaid += `  ${table.name} {\n`;
            table.columns.forEach((col: any) => {
                const pk = table.primaryKey?.includes(col.name) ? ' PK' : '';
                const fk = col.foreignKey ? ' FK' : '';
                mermaid += `    ${col.type} ${col.name}${pk}${fk}\n`;
            });
            mermaid += `  }\n`;
        });

        // Add relationships
        relationships?.forEach(rel => {
            const card = rel.type === 'OneToMany' ? '||--o{' :
                        rel.type === 'ManyToMany' ? '}o--o{' :
                        rel.type === 'OneToOne' ? '||--||' : '||--o{';
            mermaid += `  ${rel.sourceTable} ${card} ${rel.targetTable} : "${rel.name}"\n`;
        });

        return mermaid;
    }

    // Helper: Generate DDL SQL script
    private generateDDLScript(tables: any[], indexes?: any[]): string {
        let sql = '-- Database Schema DDL\n\n';

        tables.forEach(table => {
            sql += `CREATE TABLE ${table.name} (\n`;
            const columnDefs = table.columns.map((col: any) => {
                let def = `  ${col.name} ${col.type}`;
                if (col.length) def += `(${col.length})`;
                if (col.precision && col.scale) def += `(${col.precision},${col.scale})`;
                if (!col.nullable) def += ' NOT NULL';
                if (col.defaultValue !== undefined) def += ` DEFAULT ${col.defaultValue}`;
                if (col.autoIncrement) def += ' AUTO_INCREMENT';
                if (col.unique) def += ' UNIQUE';
                return def;
            });

            sql += columnDefs.join(',\n');

            // Primary key
            if (table.primaryKey && table.primaryKey.length > 0) {
                sql += `,\n  PRIMARY KEY (${table.primaryKey.join(', ')})`;
            }

            // Foreign keys
            table.columns.forEach((col: any) => {
                if (col.foreignKey) {
                    sql += `,\n  FOREIGN KEY (${col.name}) REFERENCES ${col.foreignKey.table}(${col.foreignKey.column})`;
                    sql += ` ON DELETE ${col.foreignKey.onDelete} ON UPDATE ${col.foreignKey.onUpdate}`;
                }
            });

            sql += '\n);\n\n';
        });

        // Indexes
        indexes?.forEach(idx => {
            const unique = idx.unique ? 'UNIQUE ' : '';
            sql += `CREATE ${unique}INDEX ${idx.name} ON ${idx.table} (${idx.columns.join(', ')});\n`;
        });

        return sql;
    }

    // TIER 2 Fas 2: Generate Error Taxonomy & Exception Hierarchy
    async generateErrorTaxonomy(document: DesignDocument): Promise<DesignDocument> {
        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for error taxonomy generation', {
                documentId: document.id
            });
        }

        if (!document.analysis || !document.analysis.useCases) {
            throw new ValidationError('Use cases are required for error taxonomy generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createErrorTaxonomyPrompt(
            document.requirementsSpec,
            document.analysis.useCases,
            document.apiDesign?.openApiSpec
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const taxonomy = JSON.parse(cleanJson);

            // Generate exception hierarchy diagram
            let exceptionHierarchy = taxonomy.exceptionHierarchy;
            if (!exceptionHierarchy && taxonomy.categories) {
                exceptionHierarchy = this.generateExceptionHierarchyDiagram(taxonomy);
            }

            // Generate error flow diagram (optional)
            let errorFlowDiagram = taxonomy.errorFlowDiagram;
            if (!errorFlowDiagram) {
                errorFlowDiagram = this.generateErrorFlowDiagram(taxonomy);
            }

            document.errorHandling = {
                taxonomy,
                exceptionHierarchy,
                errorFlowDiagram,
                completed: true
            };

            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate error taxonomy:', error);
            throw new ValidationError('Failed to generate valid error taxonomy', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Helper: Generate exception hierarchy class diagram
    private generateExceptionHierarchyDiagram(taxonomy: any): string {
        let mermaid = 'classDiagram\n';
        mermaid += `  class ${taxonomy.baseExceptionClass} {\n`;
        mermaid += `    +message: string\n`;
        mermaid += `    +stack: string\n`;
        mermaid += `  }\n\n`;

        // Generate categories as classes
        taxonomy.categories?.forEach((cat: any) => {
            mermaid += `  class ${cat.exceptionClass} {\n`;
            mermaid += `    +httpStatus: ${cat.httpStatus}\n`;
            mermaid += `    +errorCode: string\n`;
            mermaid += `    +recoverable: boolean\n`;
            mermaid += `  }\n`;

            // Inheritance relationship
            const parent = cat.parentCategory ?
                taxonomy.categories.find((c: any) => c.name === cat.parentCategory)?.exceptionClass :
                taxonomy.baseExceptionClass;
            mermaid += `  ${parent} <|-- ${cat.exceptionClass}\n\n`;
        });

        return mermaid;
    }

    // Helper: Generate error handling flow diagram
    private generateErrorFlowDiagram(taxonomy: any): string {
        let mermaid = 'flowchart TD\n';
        mermaid += '  Start([Error Occurs]) --> Catch{Catch Exception}\n';

        taxonomy.categories?.forEach((cat: any, idx: number) => {
            const nodeId = `Cat${idx}`;
            mermaid += `  Catch -->|${cat.exceptionClass}| ${nodeId}[Handle ${cat.name}]\n`;

            if (cat.handlingStrategy === 'Retry') {
                mermaid += `  ${nodeId} --> Retry${idx}{Retry?}\n`;
                mermaid += `  Retry${idx} -->|Yes| Start\n`;
                mermaid += `  Retry${idx} -->|Max Attempts| Log${idx}[Log Error]\n`;
            } else if (cat.handlingStrategy === 'Fallback') {
                mermaid += `  ${nodeId} --> Fallback${idx}[Execute Fallback]\n`;
                mermaid += `  Fallback${idx} --> Log${idx}[Log Warning]\n`;
            } else if (cat.handlingStrategy === 'FailFast') {
                mermaid += `  ${nodeId} --> Log${idx}[Log Error]\n`;
                mermaid += `  Log${idx} --> Return${idx}[Return Error Response]\n`;
            }
        });

        mermaid += '  Catch -->|Unknown| Unknown[Log Unknown Error]\n';
        mermaid += '  Unknown --> Return500[Return 500]\n';

        return mermaid;
    }

    // TIER 3: Generate Security Specification (Threat Model + Auth/Authz)
    async generateSecuritySpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for security spec generation', {
                documentId: document.id
            });
        }

        if (!document.analysis || !document.analysis.useCases) {
            throw new ValidationError('Use cases are required for security spec generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createSecuritySpecPrompt(
            document.requirementsSpec,
            document.analysis.useCases,
            document.apiDesign?.openApiSpec,
            document.dataModel?.databaseSchema
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const securitySpec = JSON.parse(cleanJson);

            document.security = securitySpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate security specification:', error);
            throw new ValidationError('Failed to generate valid security specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // TIER 3: Generate Deployment Specification (Docker + K8s + CI/CD)
    async generateDeploymentSpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.techStack) {
            throw new ValidationError('Tech stack is required for deployment spec generation', {
                documentId: document.id
            });
        }

        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for deployment spec generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createDeploymentSpecPrompt(
            document.techStack,
            document.requirementsSpec,
            document.systemDesign?.architectureDiagramMermaid
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const deploymentSpec = JSON.parse(cleanJson);

            document.deployment = deploymentSpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate deployment specification:', error);
            throw new ValidationError('Failed to generate valid deployment specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // TIER 3: Generate Observability Specification (Logging + Metrics + Tracing)
    async generateObservabilitySpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.techStack) {
            throw new ValidationError('Tech stack is required for observability spec generation', {
                documentId: document.id
            });
        }

        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for observability spec generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createObservabilitySpecPrompt(
            document.techStack,
            document.requirementsSpec,
            document.apiDesign?.openApiSpec
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const observabilitySpec = JSON.parse(cleanJson);

            document.observability = observabilitySpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate observability specification:', error);
            throw new ValidationError('Failed to generate valid observability specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // TIER 3: Generate Performance Specification (Caching + Optimization + Scaling)
    async generatePerformanceSpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for performance spec generation', {
                documentId: document.id
            });
        }

        if (!document.techStack) {
            throw new ValidationError('Tech stack is required for performance spec generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createPerformanceSpecPrompt(
            document.requirementsSpec,
            document.techStack,
            document.dataModel?.databaseSchema,
            document.apiDesign?.openApiSpec
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const performanceSpec = JSON.parse(cleanJson);

            document.performance = performanceSpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate performance specification:', error);
            throw new ValidationError('Failed to generate valid performance specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ==================================================================================
    // TIER 4: FORMAL METHODS & VERIFIED STATE MACHINES (95-100% AI-Generated Code)
    // ==================================================================================

    /**
     * TIER 4: Generate Formal Methods Specification
     *
     * Creates TLA+/Alloy specifications for critical components requiring formal verification.
     * This includes:
     * - Identification of critical components (payment, auth, concurrency, consensus)
     * - TLA+ or Alloy specifications with temporal/structural properties
     * - Properties to verify (Safety, Liveness, Invariants)
     * - Model checking configurations
     *
     * Use cases:
     * - Payment processing (transaction atomicity)
     * - Authentication/Authorization (security properties)
     * - Distributed systems (consensus, replication)
     * - Concurrent operations (race conditions, deadlocks)
     */
    async generateFormalMethodsSpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.requirementsSpec) {
            throw new ValidationError('Requirements specification is required for formal methods generation', {
                documentId: document.id
            });
        }

        if (!document.analysis?.useCases || document.analysis.useCases.length === 0) {
            throw new ValidationError('Use cases are required for formal methods generation', {
                documentId: document.id
            });
        }

        if (!document.objectDesign) {
            throw new ValidationError('Object design is required for formal methods generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createFormalMethodsPrompt(
            document.requirementsSpec,
            document.analysis.useCases,
            document.objectDesign,
            document.security
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const formalMethodsSpec = JSON.parse(cleanJson);

            document.formalMethods = formalMethodsSpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate formal methods specification:', error);
            throw new ValidationError('Failed to generate valid formal methods specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * TIER 4: Generate State Machine Specification
     *
     * Creates formal state machine specifications for entities with complex lifecycles.
     * This includes:
     * - State definitions with entry/exit actions
     * - Transition definitions with guards and triggers
     * - State invariants and properties to verify
     * - Mermaid state diagrams
     * - Test cases for state transitions
     *
     * Use cases:
     * - Order lifecycle (Created → Paid → Shipped → Delivered)
     * - User account states (Active → Suspended → Deleted)
     * - Payment processing (Pending → Authorized → Captured → Refunded)
     * - Workflow orchestration (Task dependencies, approvals)
     * - Document review (Draft → Review → Approved → Published)
     */
    async generateStateMachineSpec(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis?.useCases || document.analysis.useCases.length === 0) {
            throw new ValidationError('Use cases are required for state machine generation', {
                documentId: document.id
            });
        }

        if (!document.objectDesign) {
            throw new ValidationError('Object design is required for state machine generation', {
                documentId: document.id
            });
        }

        const prompt = PromptFactory.createStateMachinePrompt(
            document.analysis.useCases,
            document.objectDesign,
            document.businessRules
        );

        const result = await this.vertexRepo.generateText(prompt);

        try {
            // Parse JSON response
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const stateMachineSpec = JSON.parse(cleanJson);

            document.stateMachines = stateMachineSpec;
            document.updatedAt = new Date();

            return document;
        } catch (error) {
            console.error('Failed to generate state machine specification:', error);
            throw new ValidationError('Failed to generate valid state machine specification', {
                documentId: document.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
