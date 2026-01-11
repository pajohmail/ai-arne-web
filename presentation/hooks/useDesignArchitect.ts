import { useState, useEffect } from 'react';
import { DesignDocument } from '@/core/models/DesignDocument';
import { GeminiRepository } from '@/repositories/GeminiRepository';
import { DesignArchitectService } from '@/services/DesignArchitectService';
import { config } from '@/config/appConfig';
import { useAuth } from './useAuth';

export function useDesignArchitect() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [userApiKey, setUserApiKey] = useState<string | null>(null);
    const [currentModel, setCurrentModel] = useState<string>(config.gemini.model);
    const { user } = useAuth();

    // Load user's API key from Firestore
    useEffect(() => {
        if (user) {
            loadUserApiKey();
        }
    }, [user]);

    const loadUserApiKey = async () => {
        try {
            const { db } = await import('@/config/firebase');
            const { doc, getDoc } = await import('firebase/firestore');
            const userDoc = await getDoc(doc(db, 'users', user!.uid));
            const data = userDoc.data();

            if (data?.geminiApiKey) {
                setUserApiKey(data.geminiApiKey);
                setCurrentModel('gemini-3-flash-preview'); // Pro tier uses Gemini 3 Flash
            } else {
                setUserApiKey(null);
                setCurrentModel('gemini-1.5-flash'); // Free tier uses Gemini 1.5 Flash
            }
        } catch (error) {
            console.error('Failed to load user API key:', error);
        }
    };

    const getService = () => {
        // Use user's key if available (Pro tier), otherwise use default key (Free tier)
        const apiKey = userApiKey || config.gemini.apiKey;
        const model = userApiKey ? 'gemini-3-flash-preview' : 'gemini-1.5-flash';

        const geminiRepo = new GeminiRepository(apiKey, model);
        return new DesignArchitectService(geminiRepo);
    };

    const analyzeRequirementsChat = async (
        document: DesignDocument,
        chatLog: string
    ): Promise<{ document: DesignDocument; reply: string }> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            const result = await service.analyzeRequirementsChat(document, chatLog);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to analyze requirements chat');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeTechStackChat = async (
        document: DesignDocument,
        chatLog: string
    ): Promise<{ document: DesignDocument; reply: string }> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            const result = await service.analyzeTechStackChat(document, chatLog);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to analyze tech stack chat');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeChat = async (
        document: DesignDocument,
        chatLog: string
    ): Promise<{ document: DesignDocument; reply: string }> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            const result = await service.analyzeChat(document, chatLog);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to analyze chat');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateDomainModel = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateDomainModel(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate domain model');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateSystemArchitecture = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateSystemArchitecture(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate system architecture');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateObjectDesign = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateObjectDesign(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate object design');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const validateDesign = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.validateDesign(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to validate design');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateReport = async (
        document: DesignDocument
    ): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateFinalReport(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate report');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 1 Improvements
    const generateGherkinScenarios = async (
        useCase: any,
        requirements?: any
    ): Promise<any[]> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateGherkinScenarios(useCase, requirements);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Gherkin scenarios');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateApiSpecification = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateApiSpecification(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate API specification');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const generateTraceabilityMatrix = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateTraceabilityMatrix(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Traceability Matrix');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 2: Algorithm Specifications
    const generateAlgorithmSpecs = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateAlgorithmSpecs(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Algorithm Specifications');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 2: Business Rules (DMN Decision Tables)
    const generateBusinessRules = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateBusinessRules(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Business Rules');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 2 Fas 2: Database Schema (DDL + ORM)
    const generateDatabaseSchema = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateDatabaseSchema(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Database Schema');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 2 Fas 2: Error Taxonomy
    const generateErrorTaxonomy = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateErrorTaxonomy(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Error Taxonomy');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 3: Security Specification
    const generateSecuritySpec = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateSecuritySpec(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Security Specification');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 3: Deployment Specification
    const generateDeploymentSpec = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateDeploymentSpec(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Deployment Specification');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 3: Observability Specification
    const generateObservabilitySpec = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generateObservabilitySpec(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Observability Specification');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // TIER 3: Performance Specification
    const generatePerformanceSpec = async (
        document: DesignDocument
    ): Promise<DesignDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const service = getService();
            return await service.generatePerformanceSpec(document);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to generate Performance Specification');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        currentModel,
        isPro: !!userApiKey,
        analyzeRequirementsChat,
        analyzeTechStackChat,
        analyzeChat,
        generateDomainModel,
        generateSystemArchitecture,
        generateObjectDesign,
        validateDesign,
        generateReport,
        // TIER 1 Improvements
        generateGherkinScenarios,
        generateApiSpecification,
        generateTraceabilityMatrix,
        // TIER 2 Improvements
        generateAlgorithmSpecs,
        generateBusinessRules,
        // TIER 2 Fas 2 Improvements
        generateDatabaseSchema,
        generateErrorTaxonomy,
        // TIER 3 Improvements
        generateSecuritySpec,
        generateDeploymentSpec,
        generateObservabilitySpec,
        generatePerformanceSpec,
    };
}
