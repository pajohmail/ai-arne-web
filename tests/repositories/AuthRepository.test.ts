import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRepository } from '@/repositories/AuthRepository';
import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

// Mock Firebase auth
vi.mock('firebase/auth', () => {
    const GoogleAuthProviderMock = vi.fn();
    (GoogleAuthProviderMock as any).credentialFromResult = vi.fn();
    return {
        GoogleAuthProvider: GoogleAuthProviderMock,
        signInWithPopup: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: vi.fn(() => vi.fn()),
    };
});

describe('AuthRepository', () => {
    let authRepository: AuthRepository;
    let mockAuth: Auth;

    beforeEach(() => {
        mockAuth = {} as Auth;
        // Reset mocks
        vi.clearAllMocks();

        // Setup GoogleAuthProvider mock default behavior
        (GoogleAuthProvider as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
            return {
                addScope: vi.fn(),
                setCustomParameters: vi.fn(),
            };
        });

        authRepository = new AuthRepository(mockAuth);
    });

    it('should be defined', () => {
        expect(authRepository).toBeDefined();
    });

    it('should sign in with Google and return user with required fields', async () => {
        // Mock signInWithPopup result
        const mockUser = {
            uid: '123',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: 'http://example.com/photo.jpg',
            getIdToken: vi.fn().mockResolvedValue('mock-token'),
        };
        (signInWithPopup as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });

        // Mock credential result
        (GoogleAuthProvider.credentialFromResult as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ accessToken: 'access-token' });

        const user = await authRepository.signInWithGoogle();

        expect(user).toHaveProperty('uid', '123');
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).toHaveProperty('accessToken', 'access-token');
    });

    it('should include Drive and Cloud Platform scopes in Google provider', async () => {
        expect(GoogleAuthProvider).toHaveBeenCalled();
        // Retrieve the instance created
        const instance = (GoogleAuthProvider as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;

        expect(instance.addScope).toHaveBeenCalledWith(
            'https://www.googleapis.com/auth/drive.file'
        );
        expect(instance.addScope).toHaveBeenCalledWith(
            'https://www.googleapis.com/auth/cloud-platform'
        );
    });

    it('should get current user token', async () => {
        // We need to mock auth.currentUser
        const mockUser = {
            getIdToken: vi.fn().mockResolvedValue('mock-token'),
        };
        // Re-instantiate with mocked current user support
        const mockAuthWithUser = {
            currentUser: mockUser
        } as unknown as Auth;

        const repo = new AuthRepository(mockAuthWithUser);

        const token = await repo.getUserToken();
        expect(token).toBe('mock-token');
        expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });

    it('should handle auth state changes', () => {
        const callback = vi.fn();
        const unsubscribe = authRepository.onAuthStateChanged(callback);

        expect(onAuthStateChanged).toHaveBeenCalled();
        expect(typeof unsubscribe).toBe('function');
    });
    // Manually update mock for onAuthStateChanged to return unsubscribe function
});
