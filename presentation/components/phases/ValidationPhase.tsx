'use client';

import { DesignDocument } from '@/core/models/DesignDocument';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const ValidationPhase = ({ document }: PhaseProps) => {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-700">Phase 4: Validation</h2>
            <p className="text-gray-500 mt-2">Review requirements and export documentation.</p>

            <button className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">
                Export to Google Drive
            </button>
        </div>
    );
};
