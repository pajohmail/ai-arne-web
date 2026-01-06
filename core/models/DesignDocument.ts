export type ProjectPhase =
    | 'analysis'
    | 'systemDesign'
    | 'objectDesign'
    | 'validation';

export interface DesignDocument {
    id: string;
    userId: string;
    projectName: string;
    description: string;
    currentPhase: ProjectPhase;

    // Phase 1: Analysis
    analysis?: {
        useCases: UseCase[];
        domainModelMermaid: string;
        glossary: GlossaryTerm[];
        completed: boolean;
    };

    // Phase 2: System Design
    systemDesign?: {
        architectureDiagramMermaid: string; // e.g., Package diagram
        subsystems: string[];
        deploymentDiagramMermaid?: string;
        completed: boolean;
    };

    // Phase 3: Object Design
    objectDesign?: {
        classDiagramMermaid: string;
        sequenceDiagramsMermaid: string[];
        contracts: OperationContract[];
        completed: boolean;
    };

    // Phase 4: Validation
    validation?: {
        reviews: ReviewComment[];
        isApproved: boolean;
        exportUrl?: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface UseCase {
    id: string;
    title: string;
    narrative: string; // Textual description
    actors: string[];
}

export interface GlossaryTerm {
    term: string;
    definition: string;
}

export interface OperationContract {
    operation: string;
    preConditions: string[];
    postConditions: string[];
}

export interface ReviewComment {
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    resolved: boolean;
}

export interface Question {
    id: number;
    text: string;
    options: string[];
    allowMultiple: boolean;
}

export interface Answer {
    questionId: number;
    selectedOptions: string[];
}
