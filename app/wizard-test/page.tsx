"use client";

import React from 'react';
import ProjectWizard from '@/presentation/components/wizard/ProjectWizard';
import { DesignDocument } from '@/core/models/DesignDocument';

const mockProject: DesignDocument = {
    id: 'test-project-id',
    userId: 'test-user-id',
    projectName: 'Test Project',
    description: 'A test project for wizard verification',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    currentPhase: 'analysis',
    phases: {
        analysis: {
            status: 'active',
            messages: [],
            useCases: [],
            domainModel: { entities: [], relationships: [] }
        },
        systemDesign: {
            status: 'pending',
            architectureType: 'monolithic', // Default or similar
            modules: []
        },
        objectDesign: {
            status: 'pending',
            classes: [],
            patterns: []
        },
        validation: {
            status: 'pending',
            testCases: []
        }
    }
};

export default function WizardTestPage() {
    const handleUpdate = async (project: DesignDocument) => {
        console.log('Project updated:', project);
        // Mock persistence
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Wizard Test Page</h1>
            <ProjectWizard
                initialProject={mockProject}
                userToken="mock-token"
                onUpdate={handleUpdate}
            />
        </div>
    );
}
