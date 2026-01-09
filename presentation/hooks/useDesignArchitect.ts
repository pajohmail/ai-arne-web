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

    return {
        isLoading,
        error,
        currentModel,
        isPro: !!userApiKey,
        analyzeRequirementsChat,
        analyzeChat,
        generateDomainModel,
        generateSystemArchitecture,
        generateObjectDesign,
        validateDesign,
        generateReport,
    };
}
