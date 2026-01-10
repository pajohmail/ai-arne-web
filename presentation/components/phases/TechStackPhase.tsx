'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

interface TechStackPhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const TechStackPhase = ({ document, onUpdate }: TechStackPhaseProps) => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        {
            role: 'ai',
            content: 'Hej! Låt oss hitta den bästa teknologistacken för ditt projekt. Berätta om:\n\n• Hur många användare förväntar du?\n• Vilken typ av applikation (webb, mobil, desktop)?\n• Finns det särskilda prestandakrav?\n• Vilket team/vilka kompetenser finns tillgängliga?\n• Budget och tidsramar?'
        }
    ]);
    const { analyzeTechStackChat } = useDesignArchitect();

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: chatInput }];
        setMessages(newMessages);
        const userMessage = chatInput;
        setChatInput('');

        try {
            setMessages(prev => [...prev, { role: 'ai', content: 'Analyserar tekniska behov...' }]);

            const { document: updatedDoc, reply } = await analyzeTechStackChat(document, userMessage);

            onUpdate(updatedDoc);

            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyserar tekniska behov...'),
                { role: 'ai', content: reply }
            ]);

        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analyserar tekniska behov...'),
                { role: 'ai', content: `Fel: ${errorMessage}` }
            ]);
        }
    };

    const handleFinalize = () => {
        if (!document.techStack) {
            alert('Vänligen diskutera teknisk stack med AI först.');
            return;
        }

        const updatedDoc = {
            ...document,
            techStack: { ...document.techStack, completed: true },
            currentPhase: 'analysis' as const
        };
        onUpdate(updatedDoc);
    };

    const techStack = document.techStack;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-[600px] border rounded-lg bg-white shadow-sm">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t flex gap-2 bg-gray-50">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Beskriv användarantal, applikationstyp, kompetens..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tech Stack Sidebar */}
            <div className="border rounded-lg p-4 bg-white shadow-sm overflow-y-auto h-[600px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Rekommenderad Stack
                </h3>

                {!techStack ? (
                    <p className="text-sm text-gray-500 italic">Chatta med AI för att få rekommendationer...</p>
                ) : (
                    <div className="space-y-4">
                        {techStack.frontend && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-sm text-blue-900 mb-1">Frontend</h4>
                                <p className="text-sm text-blue-800 font-medium">{techStack.frontend.name}</p>
                                <p className="text-xs text-blue-600 mt-1">{techStack.frontend.reasoning}</p>
                            </div>
                        )}

                        {techStack.backend && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-sm text-green-900 mb-1">Backend</h4>
                                <p className="text-sm text-green-800 font-medium">{techStack.backend.name}</p>
                                <p className="text-xs text-green-600 mt-1">{techStack.backend.reasoning}</p>
                            </div>
                        )}

                        {techStack.database && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <h4 className="font-semibold text-sm text-purple-900 mb-1">Databas</h4>
                                <p className="text-sm text-purple-800 font-medium">{techStack.database.name}</p>
                                <p className="text-xs text-purple-600 mt-1">{techStack.database.reasoning}</p>
                            </div>
                        )}

                        {techStack.hosting && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <h4 className="font-semibold text-sm text-orange-900 mb-1">Hosting</h4>
                                <p className="text-sm text-orange-800 font-medium">{techStack.hosting.name}</p>
                                <p className="text-xs text-orange-600 mt-1">{techStack.hosting.reasoning}</p>
                            </div>
                        )}

                        {techStack.additionalTools && techStack.additionalTools.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Ytterligare verktyg</h4>
                                <div className="space-y-2">
                                    {techStack.additionalTools.map((tool, idx) => (
                                        <div key={idx} className="text-xs">
                                            <p className="font-medium text-gray-800">{tool.name}</p>
                                            <p className="text-gray-600">{tool.reasoning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {techStack.reasoning && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <h4 className="font-semibold text-sm text-indigo-900 mb-1">Övergripande motivering</h4>
                                <p className="text-xs text-indigo-700 whitespace-pre-wrap">{techStack.reasoning}</p>
                            </div>
                        )}

                        <button
                            onClick={handleFinalize}
                            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Slutför & Fortsätt till Analys →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
