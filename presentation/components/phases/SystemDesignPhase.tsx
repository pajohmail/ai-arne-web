'use client';

import { DesignDocument } from '@/core/models/DesignDocument';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const SystemDesignPhase = ({ document }: PhaseProps) => {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-700">Phase 2: System Design</h2>
            <p className="text-gray-500 mt-2">Architecture and Subsystem definition coming soon.</p>
        </div>
    );
};
