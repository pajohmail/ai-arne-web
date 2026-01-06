import { DesignDocument, UseCase } from "@/core/models/DesignDocument";
import { IVertexAIRepository } from "@/repositories/interfaces/IVertexAIRepository";
import { PromptFactory } from "./PromptFactory";

export interface IDesignArchitectService {
    startAnalysis(projectId: string, initialDescription: string): Promise<DesignDocument>;
    analyzeChat(document: DesignDocument, chatLog: string): Promise<DesignDocument>;
    generateDomainModel(document: DesignDocument): Promise<DesignDocument>;
    startSystemDesign(document: DesignDocument): Promise<DesignDocument>;
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
            currentPhase: 'analysis',
            analysis: {
                useCases: [],
                domainModelMermaid: '',
                glossary: [],
                completed: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return doc;
    }

    async analyzeChat(document: DesignDocument, chatLog: string): Promise<DesignDocument> {
        if (!document.analysis) throw new Error("Analysis phase not initialized");

        const prompt = PromptFactory.createUseCaseExtractionPrompt(chatLog);
        const result = await this.vertexRepo.generateText(prompt);

        // Parse JSON result (Basic implementation, needs robust error handling)
        try {
            // Clean up code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const useCases: UseCase[] = JSON.parse(cleanJson);

            document.analysis.useCases = useCases;
            document.updatedAt = new Date();
        } catch (e) {
            console.error("Failed to parse AI response", e);
        }

        return document;
    }

    async generateDomainModel(document: DesignDocument): Promise<DesignDocument> {
        if (!document.analysis || document.analysis.useCases.length === 0) {
            throw new Error("No Use Cases available for Domain Model generation");
        }

        const prompt = PromptFactory.createDomainModelPrompt(document.analysis.useCases);
        const result = await this.vertexRepo.generateText(prompt);

        // Extract Mermaid code
        const mermaidMatch = result.match(/```mermaid([\s\S]*?)```/);
        const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : result;

        document.analysis.domainModelMermaid = mermaidCode;
        document.updatedAt = new Date();
        return document;
    }

    async startSystemDesign(document: DesignDocument): Promise<DesignDocument> {
        document.currentPhase = 'systemDesign';
        document.systemDesign = {
            architectureDiagramMermaid: '',
            subsystems: [],
            completed: false
        };
        return document;
    }
}
