import { z } from 'zod';
import { UseCaseSchema } from './DesignDocumentSchemas';

/**
 * Schema for chat analysis AI response
 * Expected format from AI when analyzing user chat and extracting use cases
 */
export const ChatAnalysisResponseSchema = z.object({
    reply: z.string().min(1, 'AI reply is required'),
    useCases: z.array(UseCaseSchema).default([]),
});

export type ValidatedChatAnalysisResponse = z.infer<typeof ChatAnalysisResponseSchema>;

/**
 * Schema for requirements specification AI response
 */
export const RequirementsAnalysisResponseSchema = z.object({
    reply: z.string().min(1, 'AI reply is required'),
    projectPurpose: z.string().optional(),
    stakeholders: z.array(z.object({
        id: z.string(),
        name: z.string(),
        role: z.string(),
        interests: z.array(z.string())
    })).optional(),
    constraints: z.array(z.object({
        id: z.string(),
        type: z.enum(['technical', 'business', 'regulatory', 'schedule']),
        description: z.string()
    })).optional(),
    functionalRequirements: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })).optional(),
    qualityRequirements: z.array(z.object({
        id: z.string(),
        category: z.enum(['performance', 'security', 'usability', 'maintainability', 'reliability']),
        description: z.string(),
        metric: z.string().optional()
    })).optional()
});

export type ValidatedRequirementsAnalysisResponse = z.infer<typeof RequirementsAnalysisResponseSchema>;

/**
 * Schema for Mermaid diagram responses
 * Validates that the response starts with a valid Mermaid diagram type
 */
export const MermaidResponseSchema = z.object({
    mermaidCode: z.string()
        .min(1, 'Mermaid code is required')
        .regex(
            /^(graph|classDiagram|sequenceDiagram|flowchart|stateDiagram|erDiagram)/,
            'Invalid Mermaid diagram type. Must start with a valid diagram declaration.'
        ),
});

export type ValidatedMermaidResponse = z.infer<typeof MermaidResponseSchema>;

/**
 * Alternative: Direct Mermaid code validation (when AI returns just the code without wrapper)
 */
export const MermaidCodeSchema = z.string()
    .min(1, 'Mermaid code is required')
    .refine(
        (val) => /^(graph|classDiagram|sequenceDiagram|flowchart|stateDiagram|erDiagram)/.test(val.trim()),
        'Invalid Mermaid diagram type'
    );

/**
 * Schema for validation/review AI response
 */
export const ValidationResponseSchema = z.object({
    reviews: z.array(z.object({
        id: z.string(),
        author: z.string().default('AI Validator'),
        content: z.string().min(1),
        timestamp: z.date().default(() => new Date()),
        resolved: z.boolean().default(false),
    })),
    isApproved: z.boolean(),
    summary: z.string().optional(),
});

export type ValidatedValidationResponse = z.infer<typeof ValidationResponseSchema>;

/**
 * Generic AI text response (fallback)
 */
export const GenericAIResponseSchema = z.object({
    text: z.string().min(1, 'Response text is required'),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ValidatedGenericAIResponse = z.infer<typeof GenericAIResponseSchema>;
