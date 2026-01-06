'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { DesignPatternAdvisor, DesignPattern } from '@/services/DesignPatternAdvisor';
import { useState, useMemo } from 'react';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const ObjectDesignPhase = ({ document }: PhaseProps) => {
    // Lazily initialize the advisor to ensure it's client-side only if needed
    const [advisor] = useState(() => new DesignPatternAdvisor());

    const suggestions = useMemo(() => {
        return advisor.suggestPatterns(document);
    }, [document.analysis?.useCases]); // Re-run if use cases change

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-2 text-center py-20">
                <h2 className="text-2xl font-bold text-gray-700">Phase 3: Object Design</h2>
                <p className="text-sm text-gray-400 mb-4">Project: {document.projectName}</p>
                <p className="text-gray-500 mt-2">Class Diagrams and Sequence Diagrams with SOLID/GRASP principles.</p>
            </div>

            {/* Pattern Suggestions Sidebar */}
            <div className="border rounded-lg p-4 bg-gray-50 overflow-y-auto h-[600px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Pattern AI Advisor
                </h3>

                {suggestions.length > 0 ? (
                    <div className="space-y-4">
                        {suggestions.map(pattern => (
                            <div key={pattern.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800">{pattern.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${pattern.usageProbability === 'High' ? 'bg-green-100 text-green-800' :
                                            pattern.usageProbability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {pattern.usageProbability}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 italic">{pattern.reason}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <span className="font-medium">Why?</span> {pattern.applicability}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No specific patterns detected yet based on current Use Cases.</p>
                )}
            </div>
        </div>
    );
};
