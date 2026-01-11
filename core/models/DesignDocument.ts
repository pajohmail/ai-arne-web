import type { AlgorithmSpecification } from './AlgorithmSpecification';
import type { BusinessRulesSpecification } from './BusinessRules';
import type { DataModelSpecification } from './DataModel';
import type { ErrorHandlingSpecification } from './ErrorModel';
import type { SecuritySpecification } from './SecurityModel';
import type { DeploymentSpecification } from './DeploymentModel';
import type { ObservabilitySpecification } from './ObservabilityModel';
import type { PerformanceSpecification } from './PerformanceModel';
import type { FormalMethodsSpecification } from './FormalMethodsModel';
import type { StateMachineSpecification } from './StateMachineModel';

export type ProjectPhase =
    | 'requirementsSpec'
    | 'techStack'
    | 'analysis'
    | 'completed';

export type TargetTier = 1 | 2 | 3 | 4;

export interface DesignDocument {
    id: string;
    userId: string;
    projectName: string;
    description: string;
    currentPhase: ProjectPhase;
    targetTier: TargetTier;        // Which TIER to generate specs for (1-4)

    // Phase 0: Requirements Specification
    requirementsSpec?: RequirementsSpecification;

    // Phase 1: Technology Stack
    techStack?: TechnologyStack;

    // Phase 2: Analysis
    analysis?: {
        useCases: UseCase[];
        domainModelMermaid: string;
        glossary: GlossaryTerm[];
        completed: boolean;
    };

    // Phase 2.5: API Design
    apiDesign?: {
        openApiSpec: string; // YAML/JSON OpenAPI 3.x specification
        asyncApiSpec?: string; // Optional AsyncAPI specification
        apiDocumentation: string; // Generated API documentation
        completed: boolean;
    };

    // Phase 3: System Design
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

    // Phase 3.5: Business Rules (TIER 2)
    businessRules?: BusinessRulesSpecification;

    // Phase 3.6: Data Model (TIER 2 Fas 2)
    dataModel?: DataModelSpecification;

    // Phase 3.7: Error Handling (TIER 2 Fas 2)
    errorHandling?: ErrorHandlingSpecification;

    // Phase 3.8: Security (TIER 3)
    security?: SecuritySpecification;

    // Phase 3.9: Deployment (TIER 3)
    deployment?: DeploymentSpecification;

    // Phase 3.10: Observability (TIER 3)
    observability?: ObservabilitySpecification;

    // Phase 3.11: Performance (TIER 3)
    performance?: PerformanceSpecification;

    // Phase 3.12: Formal Methods (TIER 4)
    formalMethods?: FormalMethodsSpecification;

    // Phase 3.13: State Machines (TIER 4)
    stateMachines?: StateMachineSpecification;

    // Phase 4: Validation
    validation?: {
        reviews: ReviewComment[];
        isApproved: boolean;
        exportUrl?: string;
        generatedReport?: string;
        reportGeneratedAt?: Date;
        traceabilityMatrix?: TraceabilityMatrix;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface UseCase {
    id: string;
    title: string;
    narrative: string; // Textual description
    actors: string[];
    gherkinScenarios?: GherkinScenario[];
}

export interface GherkinScenario {
    feature: string;
    scenario: string;
    steps: string; // Full Gherkin text (Given-When-Then)
}

export interface GlossaryTerm {
    term: string;
    definition: string;
}

export interface OperationContract {
    operation: string;
    preConditions: Condition[];
    postConditions: Condition[];
    invariants?: Condition[];
    exceptions?: ExceptionSpec[];
    algorithmSpec?: AlgorithmSpecification;  // TIER 2: Detailed algorithm specification
}

export interface Condition {
    type: 'state' | 'authentication' | 'authorization' | 'validation' | 'business_rule';
    description: string;
    expression?: string; // Pseudo-code or expression
    severity: 'MUST' | 'SHOULD' | 'MAY';
}

export interface ExceptionSpec {
    name: string;
    condition: string;
    httpStatus?: number;
    errorCode?: string;
    message: string;
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

export interface RequirementsSpecification {
    projectPurpose: string;
    stakeholders: Stakeholder[];
    constraints: Constraint[];
    functionalRequirements: FunctionalRequirement[];
    qualityRequirements: QualityRequirement[];
    completed: boolean;
}

export interface Stakeholder {
    id: string;
    name: string;
    role: string;
    interests: string[];
}

export interface Constraint {
    id: string;
    type: 'technical' | 'business' | 'regulatory' | 'schedule';
    description: string;
}

export interface FunctionalRequirement {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface QualityRequirement {
    id: string;
    category: 'performance' | 'security' | 'usability' | 'maintainability' | 'reliability';
    description: string;
    metric?: string;
}

export interface TechnologyStack {
    frontend?: TechChoice;
    backend?: TechChoice;
    database?: TechChoice;
    hosting?: TechChoice;
    additionalTools?: TechChoice[];
    reasoning: string;
    completed: boolean;
}

export interface TechChoice {
    name: string;
    category: string;
    reasoning: string;
}

// Requirements Traceability Matrix (RTM)
export interface TraceabilityMatrix {
    requirements: RequirementTrace[];
    coverage: CoverageStats;
}

export interface RequirementTrace {
    requirementId: string;
    requirementType: 'functional' | 'quality' | 'constraint';
    description: string;
    useCases: string[]; // Use Case IDs
    designElements: DesignElementMap;
    testScenarios?: string[]; // Gherkin scenario IDs
    status: 'covered' | 'partial' | 'missing';
}

export interface DesignElementMap {
    classes: string[];
    methods: string[];
    interfaces?: string[];
    apiEndpoints?: string[];
}

export interface CoverageStats {
    totalRequirements: number;
    implementedRequirements: number;
    coveragePercentage: number;
    untracedRequirements: string[];
    unnecessaryComponents: string[];
}
