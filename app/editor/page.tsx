'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FirestoreRepository } from '@/repositories/FirestoreRepository';
import { db } from '@/config/firebase';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

type DocumentSection =
    | 'requirements'
    | 'techStack'
    | 'useCases'
    | 'domainModel'
    | 'apiSpec'
    | 'architecture'
    | 'classDiagram'
    | 'contracts';

export default function EditorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<DesignDocument[]>([]);
    const [selectedProject, setSelectedProject] = useState<DesignDocument | null>(null);
    const [selectedSection, setSelectedSection] = useState<DocumentSection | null>(null);
    const [editContent, setEditContent] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const { isLoading: aiLoading } = useDesignArchitect();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Load user's projects
    useEffect(() => {
        const loadProjects = async () => {
            if (!user) return;

            try {
                const repo = new FirestoreRepository(db);
                const userProjects = await repo.getUserDesignDocuments(user.uid);
                setProjects(userProjects);
                if (userProjects.length > 0) {
                    setSelectedProject(userProjects[0]);
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
            }
        };

        loadProjects();
    }, [user]);

    // Extract content for selected section
    const getSectionContent = (section: DocumentSection): string => {
        if (!selectedProject) return '';

        switch (section) {
            case 'requirements':
                return JSON.stringify(selectedProject.requirementsSpec, null, 2);
            case 'techStack':
                return JSON.stringify(selectedProject.techStack, null, 2);
            case 'useCases':
                return JSON.stringify(selectedProject.analysis?.useCases, null, 2);
            case 'domainModel':
                return selectedProject.analysis?.domainModelMermaid || '';
            case 'apiSpec':
                return selectedProject.apiDesign?.openApiSpec || '';
            case 'architecture':
                return selectedProject.systemDesign?.architectureDiagramMermaid || '';
            case 'classDiagram':
                return selectedProject.objectDesign?.classDiagramMermaid || '';
            case 'contracts':
                return JSON.stringify(selectedProject.objectDesign?.contracts, null, 2);
            default:
                return '';
        }
    };

    // Load section content when selection changes
    useEffect(() => {
        if (selectedSection) {
            setEditContent(getSectionContent(selectedSection));
        }
    }, [selectedSection, selectedProject]);

    // AI-assisted editing
    const handleAiEdit = async () => {
        if (!aiPrompt.trim() || !editContent) return;

        setLoading(true);
        try {
            // Create prompt for AI to edit the content
            const fullPrompt = `
Current content:
\`\`\`
${editContent}
\`\`\`

User request: ${aiPrompt}

Please update the content according to the user's request. Return ONLY the updated content in the same format as the input.
`;

            // Use Gemini to edit content
            const { GeminiRepository } = await import('@/repositories/GeminiRepository');
            const { config } = await import('@/config/appConfig');

            const geminiRepo = new GeminiRepository(config.gemini.apiKey, config.gemini.model);
            const updatedContent = await geminiRepo.generateText(fullPrompt);

            // Clean up code blocks if present
            let cleaned = updatedContent;
            if (cleaned.includes('```')) {
                const match = cleaned.match(/```(?:json|yaml|mermaid)?\s*([\s\S]*?)```/);
                if (match) {
                    cleaned = match[1].trim();
                }
            }

            setEditContent(cleaned);
            setAiPrompt('');
        } catch (error) {
            console.error('AI editing failed:', error);
            alert('Failed to process AI request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Save edited content back to document
    const handleSave = async () => {
        if (!selectedProject || !selectedSection) return;

        setLoading(true);
        try {
            const repo = new FirestoreRepository(db);
            const updatedDoc = { ...selectedProject };

            // Parse and update the appropriate section
            switch (selectedSection) {
                case 'requirements':
                    updatedDoc.requirementsSpec = JSON.parse(editContent);
                    break;
                case 'techStack':
                    updatedDoc.techStack = JSON.parse(editContent);
                    break;
                case 'useCases':
                    if (updatedDoc.analysis) {
                        updatedDoc.analysis.useCases = JSON.parse(editContent);
                    }
                    break;
                case 'domainModel':
                    if (updatedDoc.analysis) {
                        updatedDoc.analysis.domainModelMermaid = editContent;
                    }
                    break;
                case 'apiSpec':
                    if (updatedDoc.apiDesign) {
                        updatedDoc.apiDesign.openApiSpec = editContent;
                    }
                    break;
                case 'architecture':
                    if (updatedDoc.systemDesign) {
                        updatedDoc.systemDesign.architectureDiagramMermaid = editContent;
                    }
                    break;
                case 'classDiagram':
                    if (updatedDoc.objectDesign) {
                        updatedDoc.objectDesign.classDiagramMermaid = editContent;
                    }
                    break;
                case 'contracts':
                    if (updatedDoc.objectDesign) {
                        updatedDoc.objectDesign.contracts = JSON.parse(editContent);
                    }
                    break;
            }

            updatedDoc.updatedAt = new Date();
            await repo.saveDesignDocument(updatedDoc);

            setSelectedProject(updatedDoc);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save changes. Please check the format and try again.');
        } finally {
            setLoading(false);
        }
    };

    const sections: { id: DocumentSection; label: string; icon: string }[] = [
        { id: 'requirements', label: 'Requirements Specification', icon: '📋' },
        { id: 'techStack', label: 'Technology Stack', icon: '🔧' },
        { id: 'useCases', label: 'Use Cases', icon: '📝' },
        { id: 'domainModel', label: 'Domain Model (Mermaid)', icon: '🎨' },
        { id: 'apiSpec', label: 'API Specification (OpenAPI)', icon: '🔌' },
        { id: 'architecture', label: 'System Architecture', icon: '🏗️' },
        { id: 'classDiagram', label: 'Class Diagram', icon: '📊' },
        { id: 'contracts', label: 'Operation Contracts', icon: '📜' },
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📝 Manual Document Editor</h1>
                        <p className="text-gray-600 mt-1">Edit design documentation with AI assistance</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Project & Section Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Project Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Project</h3>
                            <select
                                value={selectedProject?.id || ''}
                                onChange={(e) => {
                                    const project = projects.find(p => p.id === e.target.value);
                                    setSelectedProject(project || null);
                                    setSelectedSection(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose a project...</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.projectName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Selection */}
                        {selectedProject && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Select Section</h3>
                                <div className="space-y-2">
                                    {sections.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => setSelectedSection(section.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                                selectedSection === section.id
                                                    ? 'bg-blue-100 text-blue-900 border-2 border-blue-500'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                                            }`}
                                        >
                                            <span className="mr-2">{section.icon}</span>
                                            {section.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        {!selectedSection ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="text-6xl mb-4">📄</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Section Selected</h3>
                                <p className="text-gray-500">Select a project and section to start editing</p>
                            </div>
                        ) : (
                            <>
                                {/* Content Editor */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Content Editor</h3>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Content will appear here..."
                                    />
                                </div>

                                {/* AI Assistant */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">🤖 AI Assistant</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAiEdit()}
                                            placeholder="Describe how you want to modify the content..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={loading || aiLoading}
                                        />
                                        <button
                                            onClick={handleAiEdit}
                                            disabled={loading || aiLoading || !aiPrompt.trim()}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processing...' : 'Edit with AI'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Examples: "Add a new requirement for user authentication", "Refactor to use factory pattern", "Add error handling scenarios"
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setEditContent(getSectionContent(selectedSection))}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Reset Changes
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
