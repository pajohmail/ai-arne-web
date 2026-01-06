/**
 * Service for generating Mermaid diagrams from design specifications.
 *
 * NOTE: Interface only - implementation pending.
 */
export interface IMermaidGeneratorService {
    generateClassDiagram(specification: any): Promise<string>;
    generateSequenceDiagram(specification: any): Promise<string>;
    validateMermaidSyntax(mermaidCode: string): boolean;
}
