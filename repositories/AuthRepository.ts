import {
    Auth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth';
import { IAuthRepository } from './interfaces/IAuthRepository';
import { User } from '@/core/models/User';

export class AuthRepository implements IAuthRepository {
    private provider: GoogleAuthProvider;

    constructor(private auth: Auth) {
        this.provider = new GoogleAuthProvider();
        this.configureProvider();
    }

    private configureProvider(): void {
        // CRITICAL: Add scopes for Drive and Vertex AI access
        this.provider.addScope('https://www.googleapis.com/auth/userinfo.email');
        this.provider.addScope('https://www.googleapis.com/auth/drive.file');
        this.provider.addScope('https://www.googleapis.com/auth/cloud-platform');

        // Request access token for API calls
        this.provider.setCustomParameters({
            access_type: 'offline',
            prompt: 'consent',
        });
    }

    async signInWithGoogle(): Promise<User> {
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);

            return this.mapFirebaseUserToUser(result.user, credential?.accessToken);
        } catch (error: any) {
            throw new Error(`Google sign-in failed: ${error.message}`);
        }
    }

    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(this.auth);
        } catch (error: any) {
            throw new Error(`Sign out failed: ${error.message}`);
        }
    }

    getCurrentUser(): User | null {
        const firebaseUser = this.auth.currentUser;
        if (!firebaseUser) return null;

        return this.mapFirebaseUserToUser(firebaseUser);
    }

    async getUserToken(): Promise<string> {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('No authenticated user');
        }

        try {
            // Force refresh to ensure token is valid and has all scopes
            const token = await user.getIdToken(true);
            return token;
        } catch (error: any) {
            throw new Error(`Failed to get user token: ${error.message}`);
        }
    }

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        return firebaseOnAuthStateChanged(this.auth, (firebaseUser) => {
            if (firebaseUser) {
                callback(this.mapFirebaseUserToUser(firebaseUser));
            } else {
                callback(null);
            }
        });
    }

    private mapFirebaseUserToUser(
        firebaseUser: FirebaseUser,
        accessToken?: string
    ): User {
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            accessToken,
        };
    }
}
