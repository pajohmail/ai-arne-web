'use server';

import { DesignDocument, UseCase } from '@/core/models/DesignDocument';
import { VertexAIRepository } from '@/repositories/VertexAIRepository';
import { DesignArchitectService } from '@/services/DesignArchitectService';

// Helper to init service with user token
const getService = (userToken: string) => {
    const projectId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID!;
    const location = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION || 'us-central1';

    const vertexRepo = new VertexAIRepository(projectId, location, userToken);
    return new DesignArchitectService(vertexRepo);
};

export async function analyzeChatAction(document: DesignDocument, chatLog: string, userToken: string): Promise<DesignDocument> {
    try {
        const service = getService(userToken);
        const updatedDoc = await service.analyzeChat(document, chatLog);
        return updatedDoc;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to analyze chat: ${error.message}`);
    }
}

export async function generateDomainModelAction(document: DesignDocument, userToken: string): Promise<DesignDocument> {
    try {
        const service = getService(userToken);
        const updatedDoc = await service.generateDomainModel(document);
        return updatedDoc;
    } catch (error: any) {
        console.error("AI Action Error:", error);
        throw new Error(`Failed to generate domain model: ${error.message}`);
    }
}
