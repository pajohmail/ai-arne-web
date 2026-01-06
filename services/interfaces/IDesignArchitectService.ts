import { Question, Answer, DesignDocument } from '@/core/models/DesignDocument';

/**
 * Service for orchestrating the design generation workflow.
 *
 * NOTE: This interface defines the contract but is NOT implemented
 * in this phase. Another AI agent will later implement the business logic.
 */
export interface IDesignArchitectService {
    generateQuestions(description: string): Promise<Question[]>;
    generateDesignDocuments(
        description: string,
        answers: Answer[]
    ): Promise<DesignDocument>;
    saveToGoogleDrive(document: DesignDocument): Promise<string>;
}
