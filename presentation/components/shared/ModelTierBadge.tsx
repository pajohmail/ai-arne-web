'use client';

import { useDesignArchitect } from '@/presentation/hooks/useDesignArchitect';

export const ModelTierBadge = () => {
    const { currentModel, isPro } = useDesignArchitect();

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isPro
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700'
        }`}>
            {isPro ? (
                <>
                    <span className="text-yellow-300">✨</span>
                    <span>Pro: {currentModel}</span>
                </>
            ) : (
                <>
                    <span>🆓</span>
                    <span>Free: {currentModel}</span>
                </>
            )}
        </div>
    );
};
