export interface DesignDocument {
    id: string;
    userId: string;
    projectName: string;
    description: string;
    classDiagram: string; // Mermaid syntax
    sequenceDiagram: string; // Mermaid syntax
    architectureOverview: string; // Markdown
    agentPrompt: string;
    createdAt: Date;
    updatedAt: Date;
    driveUrl?: string;
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
