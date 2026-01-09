'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

interface RequirementsSpecPhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const RequirementsSpecPhase = ({ document, onUpdate }: RequirementsSpecPhaseProps) => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        {
            role: 'ai',
            content: 'Hello! Let\'s define the requirements for your project. What is the main purpose of this system? Who will use it?'
        }
    ]);
    const { analyzeRequirementsChat } = useDesignArchitect();

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: chatInput }];
        setMessages(newMessages);
        const userMessage = chatInput;
        setChatInput('');

        try {
            setMessages(prev => [...prev, { role: 'ai', content: 'Analyzing...' }]);

            const { document: updatedDoc, reply } = await analyzeRequirementsChat(document, userMessage);

            onUpdate(updatedDoc);

            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyzing...'),
                { role: 'ai', content: reply }
            ]);

        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyzing...'),
                { role: 'ai', content: `Error: ${errorMessage}` }
            ]);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-[600px] border rounded-lg">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Describe project purpose, users, constraints..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Requirements Sidebar */}
            <div className="border rounded-lg p-4 bg-gray-50 overflow-y-auto h-[600px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Requirements Captured
                </h3>

                <div className="space-y-4">
                    {/* Project Purpose */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Purpose</h4>
                        {document.requirementsSpec?.projectPurpose ? (
                            <p className="bg-white p-3 rounded shadow-sm border text-sm text-gray-700">
                                {document.requirementsSpec.projectPurpose}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Not defined yet.</p>
                        )}
                    </div>

                    {/* Stakeholders */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Stakeholders</h4>
                        {document.requirementsSpec?.stakeholders && document.requirementsSpec.stakeholders.length > 0 ? (
                            <ul className="space-y-2">
                                {document.requirementsSpec.stakeholders.map(sh => (
                                    <li key={sh.id} className="bg-white p-3 rounded shadow-sm border text-sm">
                                        <span className="font-medium text-gray-800">{sh.name}</span>
                                        <span className="text-gray-500 text-xs block">{sh.role}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No stakeholders identified.</p>
                        )}
                    </div>

                    {/* Functional Requirements */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Functional Requirements</h4>
                        {document.requirementsSpec?.functionalRequirements && document.requirementsSpec.functionalRequirements.length > 0 ? (
                            <ul className="space-y-2">
                                {document.requirementsSpec.functionalRequirements.map(req => (
                                    <li key={req.id} className="bg-white p-3 rounded shadow-sm border text-sm">
                                        <span className="font-medium text-gray-800">{req.title}</span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${req.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {req.priority}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No requirements defined.</p>
                        )}
                    </div>

                    {/* Quality Requirements */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Quality Requirements</h4>
                        {document.requirementsSpec?.qualityRequirements && document.requirementsSpec.qualityRequirements.length > 0 ? (
                            <ul className="space-y-2">
                                {document.requirementsSpec.qualityRequirements.map(qr => (
                                    <li key={qr.id} className="bg-white p-3 rounded shadow-sm border text-sm">
                                        <span className="font-medium text-gray-800 capitalize">{qr.category}</span>
                                        <p className="text-gray-600 text-xs mt-1">{qr.description}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No quality requirements defined.</p>
                        )}
                    </div>
                </div>

                {/* Continue Button */}
                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={async () => {
                            if (document.requirementsSpec?.functionalRequirements &&
                                document.requirementsSpec.functionalRequirements.length > 0) {
                                onUpdate({
                                    ...document,
                                    currentPhase: 'analysis',
                                    requirementsSpec: { ...document.requirementsSpec, completed: true },
                                    analysis: {
                                        useCases: [],
                                        domainModelMermaid: '',
                                        glossary: [],
                                        completed: false
                                    }
                                });
                            } else {
                                const { document: updated } = await analyzeRequirementsChat(
                                    document,
                                    "Please finalize the requirements based on our discussion so far."
                                );

                                onUpdate({
                                    ...updated,
                                    currentPhase: 'analysis',
                                    requirementsSpec: { ...updated.requirementsSpec!, completed: true },
                                    analysis: {
                                        useCases: [],
                                        domainModelMermaid: '',
                                        glossary: [],
                                        completed: false
                                    }
                                });
                            }
                        }}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors"
                    >
                        <span>Finalize & Continue to Analysis</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Proceed to analyze use cases based on these requirements.
                    </p>
                </div>
            </div>
        </div>
    );
};
