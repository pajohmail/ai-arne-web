'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/presentation/hooks/useAuth';

export const ApiKeySettings = () => {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            loadApiKey();
        }
    }, [user]);

    const loadApiKey = async () => {
        try {
            const { db } = await import('@/config/firebase');
            const { doc, getDoc } = await import('firebase/firestore');
            const userDoc = await getDoc(doc(db, 'users', user!.uid));
            const data = userDoc.data();
            if (data?.geminiApiKey) {
                setSavedKey(maskApiKey(data.geminiApiKey));
                setApiKey(''); // Don't show the actual key
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
        }
    };

    const maskApiKey = (key: string) => {
        if (!key) return '';
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: 'error', text: 'Please enter an API key' });
            return;
        }

        if (!apiKey.startsWith('AIzaSy')) {
            setMessage({ type: 'error', text: 'Invalid Gemini API key format' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            const { db } = await import('@/config/firebase');
            const { doc, setDoc } = await import('firebase/firestore');

            await setDoc(doc(db, 'users', user!.uid), {
                geminiApiKey: apiKey.trim(),
                updatedAt: new Date()
            }, { merge: true });

            setSavedKey(maskApiKey(apiKey));
            setApiKey('');
            setMessage({ type: 'success', text: '✓ API key saved! You\'re now using Gemini 3.0 Flash' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save API key' });
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remove your API key and switch back to Free tier (Gemini 1.5 Flash)?')) {
            return;
        }

        setIsSaving(true);
        try {
            const { db } = await import('@/config/firebase');
            const { doc, updateDoc, deleteField } = await import('firebase/firestore');

            await updateDoc(doc(db, 'users', user!.uid), {
                geminiApiKey: deleteField()
            });

            setSavedKey('');
            setMessage({ type: 'success', text: 'Switched back to Free tier (Gemini 1.5 Flash)' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove API key' });
            console.error('Remove error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">AI Model Settings</h2>
            <p className="text-sm text-gray-600 mb-6">
                Use your own Gemini API key for unlimited quota
            </p>

            {/* Current Tier */}
            <div className={`p-4 rounded-lg mb-6 ${savedKey ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {savedKey ? '✨ Pro Tier' : '🆓 Free Tier'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Model: <span className="font-mono font-semibold">
                                gemini-2.0-flash
                            </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {savedKey ? 'Unlimited requests with your quota' : 'Shared quota - 1500 requests/day'}
                        </p>
                    </div>
                    {savedKey && (
                        <span className="text-green-600 text-2xl">✓</span>
                    )}
                </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gemini API Key
                        {savedKey && (
                            <span className="ml-2 text-xs text-green-600">
                                Current: {savedKey}
                            </span>
                        )}
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Get your free API key from{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !apiKey.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'Saving...' : savedKey ? 'Update Key' : 'Save & Upgrade to Pro'}
                    </button>

                    {savedKey && (
                        <button
                            onClick={handleRemove}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                        >
                            Remove Key
                        </button>
                    )}
                </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                    Why upgrade to Gemini 3.0?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Latest Gemini 3 technology</li>
                    <li>✓ Better AI responses and accuracy</li>
                    <li>✓ No shared quota limits</li>
                    <li>✓ You control your own usage and billing</li>
                </ul>
            </div>
        </div>
    );
};
