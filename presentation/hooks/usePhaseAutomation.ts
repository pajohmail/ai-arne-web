import { useState } from 'react';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useDesignArchitect } from './useDesignArchitect';

export interface AutomationState {
    isRunning: boolean;
    currentAutoPhase: 'systemDesign' | 'objectDesign' | 'validation' | null;
    error: Error | null;
}

export function usePhaseAutomation() {
    const [automationState, setAutomationState] = useState<AutomationState>({
        isRunning: false,
        currentAutoPhase: null,
        error: null
    });

    const {
        generateSystemArchitecture,
        generateObjectDesign,
        validateDesign
    } = useDesignArchitect();

    const runAutomatedPhases = async (
        document: DesignDocument,
        onUpdate: (doc: DesignDocument) => void
    ): Promise<DesignDocument> => {
        setAutomationState({ isRunning: true, currentAutoPhase: 'systemDesign', error: null });

        try {
            // Phase 2: System Design
            let updatedDoc = { ...document, currentPhase: 'systemDesign' as const };
            onUpdate(updatedDoc);

            updatedDoc = await generateSystemArchitecture(updatedDoc);
            updatedDoc.systemDesign!.completed = true;
            onUpdate(updatedDoc);

            // Phase 3: Object Design
            setAutomationState({ isRunning: true, currentAutoPhase: 'objectDesign', error: null });
            updatedDoc = { ...updatedDoc, currentPhase: 'objectDesign' as const };
            onUpdate(updatedDoc);

            updatedDoc = await generateObjectDesign(updatedDoc);
            updatedDoc.objectDesign!.completed = true;
            onUpdate(updatedDoc);

            // Phase 4: Validation
            setAutomationState({ isRunning: true, currentAutoPhase: 'validation', error: null });
            updatedDoc = { ...updatedDoc, currentPhase: 'validation' as const };
            onUpdate(updatedDoc);

            updatedDoc = await validateDesign(updatedDoc);
            onUpdate(updatedDoc);

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
