'use client';

import { DesignDocument } from '@/core/models/DesignDocument';
import { useState, useEffect } from 'react';
import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';
import { generateSingleProjectZip, downloadBlob } from '@/utils/zipGenerator';

interface PhaseProps {
    document: DesignDocument;
    onUpdate: (doc: DesignDocument) => void;
}

export const CompletedPhase = ({ document: designDoc, onUpdate }: PhaseProps) => {
    const [isGeneratingZip, setIsGeneratingZip] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { generateReport } = useDesignArchitect();

    const report = designDoc.validation?.generatedReport;

    // Fallback: Auto-generate report if missing
    useEffect(() => {
        if (!report && !isGeneratingReport) {
            setIsGeneratingReport(true);
            generateReport(designDoc)
                .then(generatedReport => {
                    onUpdate({
                        ...designDoc,
                        validation: {
                            ...designDoc.validation!,
                            generatedReport,
                            reportGeneratedAt: new Date()
                        }
                    });
                })
                .catch(err => {
                    console.error('Failed to generate report:', err);
                    setError(err instanceof Error ? err.message : 'Failed to generate report');
                })
                .finally(() => setIsGeneratingReport(false));
        }
    }, [report, designDoc, onUpdate, generateReport, isGeneratingReport]);

    const handleDownloadProjectZip = async () => {
        if (!report) {
            setError('Report not available. Please wait for generation to complete.');
            return;
        }

        setIsGeneratingZip(true);
        setError(null);

        try {
            // Generate ZIP with all project documents
            const zipBlob = await generateSingleProjectZip(designDoc, report);

            // Create safe filename from project name
            const safeFilename = designDoc.projectName
                ? `${designDoc.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`
                : `${designDoc.id}.zip`;

            downloadBlob(zipBlob, safeFilename);
        } catch (err) {
            console.error('Failed to generate ZIP:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate ZIP file');
        } finally {
            setIsGeneratingZip(false);
        }
    };

    const useCaseCount = designDoc.analysis?.useCases.length || 0;
    const isApproved = designDoc.validation?.isApproved || false;
    const reportDate = designDoc.validation?.reportGeneratedAt
        ? new Date(designDoc.validation.reportGeneratedAt).toLocaleString()
        : 'Just now';

    return (
        <div className="grid grid-cols-1 gap-6 p-6 max-w-7xl mx-auto">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h2 className="text-3xl font-bold">Design Complete!</h2>
                        <p className="text-lg mt-1 opacity-90">
                            Your <span className="font-semibold">{designDoc.projectName}</span> design document is ready
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Use Cases</div>
                    <div className="text-3xl font-bold text-blue-600">{useCaseCount}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Validation Status</div>
                    <div className={`text-3xl font-bold ${isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isApproved ? 'Approved' : 'Pending'}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Generated</div>
                    <div className="text-lg font-semibold text-gray-700">{reportDate}</div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Report Preview */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Final Design Document</h3>
                {isGeneratingReport ? (
                    <div className="flex items-center justify-center p-12">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Generating report...</span>
                    </div>
                ) : report ? (
                    <textarea
                        readOnly
                        value={report}
                        className="w-full h-96 p-4 border rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    />
                ) : (
                    <p className="text-gray-400 text-center py-12">Report not available</p>
                )}
            </div>

            {/* Download Button */}
            <div className="flex flex-col items-center gap-3">
                <button
                    onClick={handleDownloadProjectZip}
                    disabled={!report || isGeneratingReport || isGeneratingZip}
                    className={`px-8 py-4 rounded-lg text-white text-lg font-semibold flex items-center gap-3 ${
                        !report || isGeneratingReport || isGeneratingZip
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105'
                    }`}
                >
                    {isGeneratingZip ? (
                        <>
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating ZIP...
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Download Project Documents (ZIP)
                        </>
                    )}
                </button>
                <p className="text-sm text-gray-600 text-center max-w-md">
                    Includes complete design document, all diagrams, and specifications for this project
                </p>
            </div>

            {/* Diagram Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {designDoc.analysis?.domainModelMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Domain Model</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.analysis.domainModelMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.systemDesign?.architectureDiagramMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">System Architecture</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.systemDesign.architectureDiagramMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.objectDesign?.classDiagramMermaid && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Class Diagram</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.objectDesign.classDiagramMermaid}
                        </pre>
                    </div>
                )}

                {designDoc.validation?.reviews && designDoc.validation.reviews.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Validation Report</h4>
                        <div className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                            {designDoc.validation.reviews[0]?.content || 'No validation report available'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
