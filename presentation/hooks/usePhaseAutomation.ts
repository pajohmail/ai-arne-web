import { useState } from 'react';
import { DesignDocument, TargetTier } from '@/core/models/DesignDocument';
import { useDesignArchitect } from './useDesignArchitect';

export interface AutomationState {
    isRunning: boolean;
    currentAutoPhase: string | null;
    error: Error | null;
    progress?: {
        current: number;
        total: number;
        message: string;
    };
}

/**
 * Determines which specifications to generate based on selected TIER
 *
 * TIER 1 (70-80% AI): Basic specs - Gherkin, OpenAPI, Contracts, Traceability
 * TIER 2 (85-90% AI): + Algorithms, Business Rules, Data Model, Error Taxonomy
 * TIER 3 (90-95% AI): + Security, Deployment, Observability, Performance
 * TIER 4 (95-100% AI): + Formal Methods, Verified State Machines
 */
interface TierSpecifications {
    // Core design (all tiers)
    domainModel: boolean;
    systemArchitecture: boolean;
    objectDesign: boolean;

    // TIER 1: Basic specifications
    gherkinScenarios: boolean;
    apiSpecification: boolean;
    traceabilityMatrix: boolean;

    // TIER 2: Business logic & data
    algorithmSpecs: boolean;
    businessRules: boolean;
    databaseSchema: boolean;
    errorTaxonomy: boolean;

    // TIER 3: Infrastructure & operations
    securitySpec: boolean;
    deploymentSpec: boolean;
    observabilitySpec: boolean;
    performanceSpec: boolean;

    // TIER 4: Formal verification
    formalMethods: boolean;
    stateMachines: boolean;

    // Always last
    validation: boolean;
    report: boolean;
}

function getTierSpecifications(tier: TargetTier): TierSpecifications {
    const base: TierSpecifications = {
        // Core design (always included)
        domainModel: true,
        systemArchitecture: true,
        objectDesign: true,

        // TIER 1
        gherkinScenarios: false,
        apiSpecification: false,
        traceabilityMatrix: false,

        // TIER 2
        algorithmSpecs: false,
        businessRules: false,
        databaseSchema: false,
        errorTaxonomy: false,

        // TIER 3
        securitySpec: false,
        deploymentSpec: false,
        observabilitySpec: false,
        performanceSpec: false,

        // TIER 4
        formalMethods: false,
        stateMachines: false,

        // Always included
        validation: true,
        report: true
    };

    // Enable specs based on tier
    if (tier >= 1) {
        base.gherkinScenarios = true;
        base.apiSpecification = true;
        base.traceabilityMatrix = true;
    }

    if (tier >= 2) {
        base.algorithmSpecs = true;
        base.businessRules = true;
        base.databaseSchema = true;
        base.errorTaxonomy = true;
    }

    if (tier >= 3) {
        base.securitySpec = true;
        base.deploymentSpec = true;
        base.observabilitySpec = true;
        base.performanceSpec = true;
    }

    if (tier >= 4) {
        base.formalMethods = true;
        base.stateMachines = true;
    }

    return base;
}

export function usePhaseAutomation() {
    const [automationState, setAutomationState] = useState<AutomationState>({
        isRunning: false,
        currentAutoPhase: null,
        error: null
    });

    const architect = useDesignArchitect();

    const runAutomatedPhases = async (
        document: DesignDocument,
        onUpdate: (doc: DesignDocument) => void
    ): Promise<DesignDocument> => {
        const specs = getTierSpecifications(document.targetTier);
        const totalSteps = Object.values(specs).filter(v => v === true).length;
        let currentStep = 0;

        const updateProgress = (message: string) => {
            currentStep++;
            setAutomationState({
                isRunning: true,
                currentAutoPhase: message,
                error: null,
                progress: { current: currentStep, total: totalSteps, message }
            });
        };

        try {
            let updatedDoc = { ...document };

            // ========================================================================
            // CORE DESIGN (Always generated)
            // ========================================================================

            // Step: Domain Model
            if (specs.domainModel && !updatedDoc.analysis?.domainModelMermaid) {
                updateProgress('Generating domain model...');
                const docWithDomain = await architect.generateDomainModel(updatedDoc);
                updatedDoc = { ...docWithDomain };
                onUpdate(updatedDoc);
            }

            // Step: System Architecture
            if (specs.systemArchitecture) {
                updateProgress('Designing system architecture...');
                const systemDesignDoc = await architect.generateSystemArchitecture(updatedDoc);
                updatedDoc = {
                    ...systemDesignDoc,
                    systemDesign: { ...systemDesignDoc.systemDesign!, completed: true }
                };
                onUpdate(updatedDoc);
            }

            // Step: Object Design
            if (specs.objectDesign) {
                updateProgress('Creating class diagrams and contracts...');
                const objectDesignDoc = await architect.generateObjectDesign(updatedDoc);
                updatedDoc = {
                    ...objectDesignDoc,
                    objectDesign: { ...objectDesignDoc.objectDesign!, completed: true }
                };
                onUpdate(updatedDoc);
            }

            // ========================================================================
            // TIER 1: Basic Specifications (70-80% AI)
            // ========================================================================

            if (specs.gherkinScenarios && updatedDoc.analysis?.useCases) {
                updateProgress('Generating Gherkin BDD scenarios...');
                // Generate Gherkin for each use case
                for (const useCase of updatedDoc.analysis.useCases) {
                    if (!useCase.gherkinScenarios || useCase.gherkinScenarios.length === 0) {
                        const gherkinScenarios = await architect.generateGherkinScenarios(
                            useCase,
                            updatedDoc.requirementsSpec
                        );
                        useCase.gherkinScenarios = gherkinScenarios;
                    }
                }
                onUpdate(updatedDoc);
            }

            if (specs.apiSpecification) {
                updateProgress('Generating OpenAPI 3.x specification...');
                updatedDoc = await architect.generateApiSpecification(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.traceabilityMatrix) {
                updateProgress('Building requirements traceability matrix...');
                updatedDoc = await architect.generateTraceabilityMatrix(updatedDoc);
                onUpdate(updatedDoc);
            }

            // ========================================================================
            // TIER 2: Business Logic & Data (85-90% AI)
            // ========================================================================

            if (specs.algorithmSpecs) {
                updateProgress('Generating algorithm specifications (pseudocode)...');
                updatedDoc = await architect.generateAlgorithmSpecs(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.businessRules) {
                updateProgress('Generating business rules (DMN decision tables)...');
                updatedDoc = await architect.generateBusinessRules(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.databaseSchema) {
                updateProgress('Generating database schema (DDL + ORM)...');
                updatedDoc = await architect.generateDatabaseSchema(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.errorTaxonomy) {
                updateProgress('Generating error taxonomy and exception hierarchy...');
                updatedDoc = await architect.generateErrorTaxonomy(updatedDoc);
                onUpdate(updatedDoc);
            }

            // ========================================================================
            // TIER 3: Infrastructure & Operations (90-95% AI)
            // ========================================================================

            if (specs.securitySpec) {
                updateProgress('Generating security specification (STRIDE, OWASP)...');
                updatedDoc = await architect.generateSecuritySpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.deploymentSpec) {
                updateProgress('Generating deployment specifications (Docker, K8s, CI/CD)...');
                updatedDoc = await architect.generateDeploymentSpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.observabilitySpec) {
                updateProgress('Generating observability specifications (logs, metrics, traces)...');
                updatedDoc = await architect.generateObservabilitySpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.performanceSpec) {
                updateProgress('Generating performance specifications (caching, scaling)...');
                updatedDoc = await architect.generatePerformanceSpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            // ========================================================================
            // TIER 4: Formal Verification (95-100% AI)
            // ========================================================================

            if (specs.formalMethods) {
                updateProgress('Generating formal methods specifications (TLA+, Alloy)...');
                updatedDoc = await architect.generateFormalMethodsSpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.stateMachines) {
                updateProgress('Generating verified state machines...');
                updatedDoc = await architect.generateStateMachineSpec(updatedDoc);
                onUpdate(updatedDoc);
            }

            // ========================================================================
            // VALIDATION & REPORT (Always generated)
            // ========================================================================

            if (specs.validation) {
                updateProgress('Validating design consistency...');
                updatedDoc = await architect.validateDesign(updatedDoc);
                onUpdate(updatedDoc);
            }

            if (specs.report) {
                updateProgress('Generating final design report...');
                const report = await architect.generateReport(updatedDoc);

                updatedDoc = {
                    ...updatedDoc,
                    currentPhase: 'completed' as const,
                    validation: {
                        ...updatedDoc.validation!,
                        generatedReport: report,
                        reportGeneratedAt: new Date()
                    }
                };
                onUpdate(updatedDoc);
            }

            // Complete
            setAutomationState({ isRunning: false, currentAutoPhase: null, error: null });
            return updatedDoc;

        } catch (error) {
            const err = error instanceof Error ? error : new Error('Automation failed');
            setAutomationState({ isRunning: false, currentAutoPhase: null, error: err });
            throw err;
        }
    };

    const resetAutomation = () => {
        setAutomationState({ isRunning: false, currentAutoPhase: null, error: null });
    };

    return {
        automationState,
        runAutomatedPhases,
        resetAutomation
    };
}
