'use client';

import { TargetTier } from '@/core/models/DesignDocument';

interface TierOption {
    tier: TargetTier;
    name: string;
    description: string;
    features: string[];
    aiGeneration: string;
    recommended: string;
    color: string;
    icon: string;
}

const tierOptions: TierOption[] = [
    {
        tier: 1,
        name: 'TIER 1 - Basic',
        description: '70-80% AI-generated code - Perfect for prototypes and simple applications',
        features: [
            'Gherkin BDD Scenarios',
            'OpenAPI 3.x Specifications',
            'Structured Operation Contracts',
            'Requirements Traceability Matrix'
        ],
        aiGeneration: '70-80%',
        recommended: 'MVPs, Prototypes, Simple CRUD apps',
        color: 'from-blue-500 to-cyan-500',
        icon: '🚀'
    },
    {
        tier: 2,
        name: 'TIER 2 - Standard',
        description: '85-90% AI-generated code - For business applications with complex logic',
        features: [
            'All TIER 1 features',
            'Algorithm Specifications (pseudocode)',
            'Business Rules (DMN Decision Tables)',
            'Database Schema (DDL + ORM)',
            'Error Taxonomy & Exception Hierarchy'
        ],
        aiGeneration: '85-90%',
        recommended: 'Business apps, E-commerce, SaaS products',
        color: 'from-purple-500 to-pink-500',
        icon: '💼'
    },
    {
        tier: 3,
        name: 'TIER 3 - Professional',
        description: '90-95% AI-generated code - Production-ready with DevOps & Observability',
        features: [
            'All TIER 2 features',
            'Security Specifications (STRIDE, OWASP)',
            'Deployment Specs (Docker, Kubernetes, CI/CD)',
            'Observability (Logging, Metrics, Tracing)',
            'Performance Optimization (Caching, Scaling)'
        ],
        aiGeneration: '90-95%',
        recommended: 'Enterprise apps, Production systems, Cloud-native',
        color: 'from-amber-500 to-orange-500',
        icon: '🏢'
    },
    {
        tier: 4,
        name: 'TIER 4 - Mission Critical',
        description: '95-100% AI-generated code - Formally verified for critical systems',
        features: [
            'All TIER 3 features',
            'Formal Methods (TLA+, Alloy)',
            'Verified State Machines',
            'Model Checking & Property Verification',
            'Correctness Guarantees'
        ],
        aiGeneration: '95-100%',
        recommended: 'Payment systems, Healthcare, Finance, Blockchain',
        color: 'from-red-500 to-rose-500',
        icon: '🔒'
    }
];

interface TierSelectorProps {
    selectedTier: TargetTier;
    onTierChange: (tier: TargetTier) => void;
    className?: string;
}

export const TierSelector = ({ selectedTier, onTierChange, className = '' }: TierSelectorProps) => {
    return (
        <div className={`space-y-4 ${className}`}>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Select Specification Tier
                </h3>
                <p className="text-sm text-gray-600">
                    Choose how detailed you want your design specifications. Higher tiers generate more complete code with stronger guarantees.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tierOptions.map((option) => (
                    <button
                        key={option.tier}
                        onClick={() => onTierChange(option.tier)}
                        className={`
                            relative p-6 rounded-lg border-2 transition-all duration-200 text-left
                            ${selectedTier === option.tier
                                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }
                        `}
                    >
                        {/* Badge showing AI generation percentage */}
                        <div className="absolute top-4 right-4">
                            <div className={`
                                px-3 py-1 rounded-full text-xs font-bold text-white
                                bg-gradient-to-r ${option.color}
                            `}>
                                {option.aiGeneration} AI
                            </div>
                        </div>

                        {/* Tier header */}
                        <div className="flex items-start gap-3 mb-3">
                            <span className="text-3xl">{option.icon}</span>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    {option.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {option.description}
                                </p>
                            </div>
                        </div>

                        {/* Features list */}
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">INCLUDES:</p>
                            <ul className="space-y-1">
                                {option.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                                {option.features.length > 3 && (
                                    <li className="text-xs text-gray-500 pl-5">
                                        +{option.features.length - 3} more features
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Recommended for */}
                        <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1">BEST FOR:</p>
                            <p className="text-xs text-gray-600">{option.recommended}</p>
                        </div>

                        {/* Selected indicator */}
                        {selectedTier === option.tier && (
                            <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-1">Choosing the Right Tier</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Start with <strong>TIER 1 or 2</strong> for most projects. Use <strong>TIER 3</strong> when you need
                            production deployment specs and observability. Choose <strong>TIER 4</strong> only for mission-critical
                            systems requiring formal verification (payment processing, healthcare, finance).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
