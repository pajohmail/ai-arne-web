'use client';

import { AuthGuard } from '@/presentation/components/auth/AuthGuard';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ProjectWizard } from '@/presentation/components/wizard/ProjectWizard';
import { ApiKeySettings } from '@/presentation/components/settings/ApiKeySettings';
import { DesignDocument } from '@/core/models/DesignDocument';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-gray-900">SirenOOP Dashboard</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/editor')}
                                    className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                                >
                                    📝 Manual Editor
                                </button>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    ⚙️ Settings
                                </button>
                                <span className="text-sm text-gray-600">
                                    {user?.displayName}
                                </span>
                                {user?.photoURL && (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="h-8 w-8 rounded-full"
                                    />
                                )}
                                <button
                                    onClick={signOut}
                                    className="ml-4 px-4 py-2 text-sm text-red-600 hover:text-red-800"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {showSettings ? (
                            <div className="max-w-2xl mx-auto">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                                >
                                    ← Back to Dashboard
                                </button>
                                <ApiKeySettings />
                            </div>
                        ) : (
                            <ProjectDemoWrapper userId={user?.uid || 'anon'} />
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}

const ProjectDemoWrapper = ({ userId }: { userId: string }) => {
    const [projects, setProjects] = useState<DesignDocument[]>([]);
    const [selectedProject, setSelectedProject] = useState<DesignDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Load all projects on mount
    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const loadProjects = async () => {
        if (userId === 'anon') {
            setIsLoading(false);
            return;
        }

        try {
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            const repo = new FirestoreRepository(db);

            const docs = await repo.getUserDesignDocuments(userId);
            if (docs.length > 0) {
                const sortedDocs = docs.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                setProjects(sortedDocs);
                // Removed auto-select - user should see project list and choose
                console.log(`Loaded ${docs.length} projects`);
            }
        } catch (error) {
            console.error("Failed to load projects", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewProject = () => {
        const newProject: DesignDocument = {
            id: crypto.randomUUID(),
            userId,
            projectName: `New Project ${new Date().toLocaleDateString()}`,
            description: 'Describe your system here...',
            currentPhase: 'requirementsSpec',
            targetTier: 1,  // Default to TIER 1 (Basic)
            requirementsSpec: {
                projectPurpose: '',
                stakeholders: [],
                constraints: [],
                functionalRequirements: [],
                qualityRequirements: [],
                completed: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setProjects([newProject, ...projects]);
        setSelectedProject(newProject);
    };

    const handleUpdate = async (newDoc: DesignDocument) => {
        setSelectedProject(newDoc);

        // Update in local state
        setProjects(prev => prev.map(p => p.id === newDoc.id ? newDoc : p));

        try {
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            const repo = new FirestoreRepository(db);

            await repo.saveDesignDocument(newDoc);
            console.log("Document persisted successfully", newDoc.id);
        } catch (e) {
            console.error("Failed to persist document", e);
        }
    };

    const handleDelete = async (projectId: string) => {
        try {
            const { db } = await import('@/config/firebase');
            const { FirestoreRepository } = await import('@/repositories/FirestoreRepository');
            const repo = new FirestoreRepository(db);

            await repo.deleteDesignDocument(projectId);

            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);

            // Select another project or null
            if (selectedProject?.id === projectId) {
                setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
            }

            setShowDeleteConfirm(null);
            console.log("Project deleted successfully", projectId);
        } catch (error) {
            console.error("Failed to delete project", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    // Show project list if no project selected
    if (!selectedProject) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Your Projects</h2>
                        <button
                            onClick={createNewProject}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
                            <button
                                onClick={createNewProject}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create First Project
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-gray-800">{project.projectName}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                            <div className="flex gap-4 mt-2">
                                                <span className="text-xs text-gray-400">
                                                    Phase: {project.currentPhase === 'requirementsSpec' ? 'Requirements' :
                                                           project.currentPhase === 'analysis' ? 'Analysis' : 'Completed'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeleteConfirm(project.id);
                                            }}
                                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Radera projekt?</h3>
                            <p className="text-gray-600 mb-6">
                                Är du säker på att du vill radera detta projekt? Detta går inte att ångra.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Avbryt
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Radera
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setSelectedProject(null)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Alla projekt
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={createNewProject}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nytt projekt
                        </button>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(selectedProject.id)}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Radera projekt
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-gray-500 font-medium text-sm">Aktuellt projekt:</label>
                    <select
                        value={selectedProject.id}
                        onChange={(e) => {
                            const project = projects.find(p => p.id === e.target.value);
                            if (project) setSelectedProject(project);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-colors"
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.projectName}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={selectedProject.projectName}
                        onChange={(e) => {
                            const updated = { ...selectedProject, projectName: e.target.value };
                            setSelectedProject(updated);
                            handleUpdate(updated);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-colors"
                        placeholder="Projektnamn..."
                    />
                </div>
            </div>

            <ProjectWizard document={selectedProject} onUpdate={handleUpdate} />

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Radera projekt?</h3>
                        <p className="text-gray-600 mb-6">
                            Är du säker på att du vill radera <strong>{selectedProject.projectName}</strong>? Detta går inte att ångra.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Radera
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
