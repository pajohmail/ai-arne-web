import { describe, it, expect, beforeEach } from 'vitest';
import { DesignPatternAdvisor } from '@/services/DesignPatternAdvisor';
import { DesignDocument } from '@/core/models/DesignDocument';

describe('DesignPatternAdvisor', () => {
    let advisor: DesignPatternAdvisor;
    let mockDoc: DesignDocument;

    beforeEach(() => {
        advisor = new DesignPatternAdvisor();
        mockDoc = {
            id: 'test',
            currentPhase: 'analysis',
            userId: 'user',
            projectName: 'test',
            description: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
            analysis: {
                useCases: [],
                domainModelMermaid: '',
                glossary: [],
                completed: true
            }
        };
    });

    it('should suggest Observer for notification scenarios', () => {
        mockDoc.analysis!.useCases = [{
            id: '1',
            title: 'Receive Notifications',
            narrative: 'The user subscribes to alerts and is notified when price changes.',
            actors: ['User']
        }];

        const patterns = advisor.suggestPatterns(mockDoc);
        const observer = patterns.find(p => p.id === 'observer');

        expect(observer).toBeDefined();
        expect(observer?.usageProbability).toBe('High');
    });

    it('should suggest Strategy for algorithm variations', () => {
        mockDoc.analysis!.useCases = [{
            id: '2',
            title: 'Calculate Payment',
            narrative: 'The system supports different payment methods like Credit Card and PayPal.'
            , actors: ['User']
        }];

        const patterns = advisor.suggestPatterns(mockDoc);
        const strategy = patterns.find(p => p.id === 'strategy');

        expect(strategy).toBeDefined();
        expect(strategy?.usageProbability).toBe('High');
    });

    it('should suggest specific patterns for keywords like "create"', () => {
        mockDoc.analysis!.useCases = [{
            id: '3',
            title: 'Create Documents',
            narrative: 'The system must create various kinds of documents based on user input.',
            actors: ['User']
        }];

        const patterns = advisor.suggestPatterns(mockDoc);
        const factory = patterns.find(p => p.id === 'factory-method');

        expect(factory).toBeDefined();
    });
});
