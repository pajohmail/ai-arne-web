import JSZip from 'jszip';
import { DesignDocument } from '@/core/models/DesignDocument';
import { DesignArchitectService } from '@/services/DesignArchitectService';

/**
 * Generates a ZIP file containing design documents for multiple projects
 * @param documents Array of design documents to include in ZIP
 * @param service DesignArchitectService instance for generating reports
 * @returns Blob containing the ZIP file
 */
export async function generateProjectsZip(
    documents: DesignDocument[],
    service: DesignArchitectService
): Promise<Blob> {
    const zip = new JSZip();

    for (const doc of documents) {
        // Use cached report if available, otherwise generate on-the-fly
        let report: string;
        if (doc.validation?.generatedReport) {
            report = doc.validation.generatedReport;
        } else {
            // Fallback: generate report on-the-fly
            try {
                report = await service.generateFinalReport(doc);
            } catch (error) {
                console.error(`Failed to generate report for ${doc.projectName}:`, error);
                report = `# ${doc.projectName}\n\nError: Failed to generate report`;
            }
        }

        // Create safe filename
        const filename = doc.projectName
            ? `${doc.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
            : `${doc.id}.md`;

        zip.file(filename, report);
    }

    // Add a README with metadata
    const readme = `# SirenOOP Design Documents
Generated: ${new Date().toISOString()}
Total Projects: ${documents.length}

## Projects Included:
${documents.map((d, i) => `${i + 1}. ${d.projectName} (ID: ${d.id})`).join('\n')}

---
Generated with SirenOOP - Object-Oriented Design Documentation Tool
`;
    zip.file('README.md', readme);

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates a ZIP file containing all documents for a single project
 * @param document The design document to package
 * @param report The generated report (markdown)
 * @returns Blob containing the ZIP file
 */
export async function generateSingleProjectZip(
    document: DesignDocument,
    report: string
): Promise<Blob> {
    const zip = new JSZip();

    // Add main design document
    zip.file('design-document.md', report);

    // Add README with project metadata
    const readme = generateProjectReadme(document);
    zip.file('README.md', readme);

    // Create diagrams folder
    const diagramsFolder = zip.folder('diagrams');
    if (diagramsFolder) {
        // Add domain model if available
        if (document.analysis?.domainModelMermaid) {
            diagramsFolder.file('domain-model.mmd', document.analysis.domainModelMermaid);
        }

        // Add architecture diagram if available
        if (document.systemDesign?.architectureDiagramMermaid) {
            diagramsFolder.file('architecture.mmd', document.systemDesign.architectureDiagramMermaid);
        }

        // Add class diagram if available
        if (document.objectDesign?.classDiagramMermaid) {
            diagramsFolder.file('class-diagram.mmd', document.objectDesign.classDiagramMermaid);
        }

        // Add sequence diagrams if available
        if (document.objectDesign?.sequenceDiagramsMermaid && document.objectDesign.sequenceDiagramsMermaid.length > 0) {
            document.objectDesign.sequenceDiagramsMermaid.forEach((diagram, index) => {
                diagramsFolder.file(`sequence-diagram-${index + 1}.mmd`, diagram);
            });
        }

        // Add deployment diagram if available
        if (document.systemDesign?.deploymentDiagramMermaid) {
            diagramsFolder.file('deployment.mmd', document.systemDesign.deploymentDiagramMermaid);
        }
    }

    // Create specs folder
    const specsFolder = zip.folder('specs');
    if (specsFolder) {
        // TIER 1: Gherkin scenarios
        if (document.tier1?.gherkinScenarios) {
            specsFolder.file('scenarios.feature', document.tier1.gherkinScenarios);
        }

        // TIER 1: API specifications
        if (document.tier1?.apiSpecification) {
            specsFolder.file('api-spec.yaml', document.tier1.apiSpecification);
        }

        // TIER 1: Traceability matrix
        if (document.tier1?.traceabilityMatrix) {
            specsFolder.file('traceability-matrix.md', document.tier1.traceabilityMatrix);
        }

        // TIER 2: Algorithm specifications
        if (document.tier2?.algorithmSpecifications) {
            const algos = Object.entries(document.tier2.algorithmSpecifications)
                .map(([name, spec]) => `## ${name}\n\n${JSON.stringify(spec, null, 2)}`)
                .join('\n\n---\n\n');
            specsFolder.file('algorithms.md', algos);
        }

        // TIER 2: Business rules
        if (document.tier2?.businessRules) {
            specsFolder.file('business-rules.dmn',
                typeof document.tier2.businessRules === 'string'
                    ? document.tier2.businessRules
                    : JSON.stringify(document.tier2.businessRules, null, 2)
            );
        }

        // TIER 2: Database schema
        if (document.tier2?.databaseSchema) {
            specsFolder.file('database-schema.sql', document.tier2.databaseSchema);
        }

        // TIER 3: Security specification
        if (document.tier3?.security) {
            specsFolder.file('security-spec.md', JSON.stringify(document.tier3.security, null, 2));
        }

        // TIER 3: Deployment specification
        if (document.tier3?.deployment) {
            specsFolder.file('deployment-spec.yaml',
                typeof document.tier3.deployment === 'string'
                    ? document.tier3.deployment
                    : JSON.stringify(document.tier3.deployment, null, 2)
            );
        }

        // TIER 4: Formal methods
        if (document.tier4?.formalMethods) {
            specsFolder.file('formal-methods.tla',
                typeof document.tier4.formalMethods === 'string'
                    ? document.tier4.formalMethods
                    : JSON.stringify(document.tier4.formalMethods, null, 2)
            );
        }

        // TIER 4: State machines
        if (document.tier4?.stateMachines) {
            specsFolder.file('state-machines.md', JSON.stringify(document.tier4.stateMachines, null, 2));
        }
    }

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates a README file for a project
 * @param document The design document
 * @returns README content as markdown string
 */
function generateProjectReadme(document: DesignDocument): string {
    const tierNames = {
        1: 'TIER 1 - Basic (70-80% AI)',
        2: 'TIER 2 - Standard (85-90% AI)',
        3: 'TIER 3 - Professional (90-95% AI)',
        4: 'TIER 4 - Mission Critical (95-100% AI)'
    };

    return `# ${document.projectName}

**Project ID:** ${document.id}
**Specification Level:** ${tierNames[document.targetTier]}
**Current Phase:** ${document.currentPhase}
**Created:** ${new Date(document.createdAt).toLocaleDateString()}
**Last Updated:** ${new Date(document.updatedAt).toLocaleDateString()}

## Description
${document.description}

## Contents

### Main Document
- \`design-document.md\` - Complete design documentation with all phases

### Diagrams
${document.analysis?.domainModelMermaid ? '- `diagrams/domain-model.mmd` - Domain model (Mermaid format)\n' : ''}${document.systemDesign?.architectureDiagramMermaid ? '- `diagrams/architecture.mmd` - System architecture diagram\n' : ''}${document.objectDesign?.classDiagramMermaid ? '- `diagrams/class-diagram.mmd` - Class diagram\n' : ''}${document.objectDesign?.sequenceDiagramsMermaid?.length ? `- \`diagrams/sequence-diagram-*.mmd\` - ${document.objectDesign.sequenceDiagramsMermaid.length} sequence diagram(s)\n` : ''}${document.systemDesign?.deploymentDiagramMermaid ? '- `diagrams/deployment.mmd` - Deployment diagram\n' : ''}

### Specifications
${document.tier1?.gherkinScenarios ? '- `specs/scenarios.feature` - Gherkin test scenarios\n' : ''}${document.tier1?.apiSpecification ? '- `specs/api-spec.yaml` - API specifications (OpenAPI format)\n' : ''}${document.tier1?.traceabilityMatrix ? '- `specs/traceability-matrix.md` - Requirements traceability\n' : ''}${document.tier2?.algorithmSpecifications ? '- `specs/algorithms.md` - Algorithm specifications\n' : ''}${document.tier2?.businessRules ? '- `specs/business-rules.dmn` - Business rules (DMN format)\n' : ''}${document.tier2?.databaseSchema ? '- `specs/database-schema.sql` - Database schema\n' : ''}${document.tier3?.security ? '- `specs/security-spec.md` - Security specifications\n' : ''}${document.tier3?.deployment ? '- `specs/deployment-spec.yaml` - Deployment configuration\n' : ''}${document.tier4?.formalMethods ? '- `specs/formal-methods.tla` - Formal methods (TLA+ format)\n' : ''}${document.tier4?.stateMachines ? '- `specs/state-machines.md` - State machine specifications\n' : ''}

## How to Use

1. **View Documentation**: Open \`design-document.md\` in any markdown viewer
2. **View Diagrams**: Use Mermaid Live Editor (https://mermaid.live) to visualize .mmd files
3. **API Specs**: Import \`api-spec.yaml\` into Swagger Editor or Postman
4. **Test Scenarios**: Use \`scenarios.feature\` with Cucumber or similar BDD framework

---
Generated with **SirenOOP** - AI-Powered Object-Oriented Design Documentation
Generated on: ${new Date().toISOString()}
`;
}

/**
 * Downloads a blob as a file
 * @param blob The blob to download
 * @param filename The filename to save as
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
