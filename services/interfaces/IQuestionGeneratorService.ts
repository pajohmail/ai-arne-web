import { Question, Answer } from '@/core/models/DesignDocument';

/**
 * Service for generating discovery questions using LLM.
 *
 * NOTE: Interface only - implementation pending.
 */
export interface IQuestionGeneratorService {
    generate(description: string): Promise<Question[]>;
    validateAnswers(answers: Answer[]): boolean;
}
