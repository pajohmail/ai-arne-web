import { User } from '@/core/models/User';

export interface IAuthRepository {
    signInWithGoogle(): Promise<User>;
    signOut(): Promise<void>;
    getCurrentUser(): User | null;
    getUserToken(): Promise<string>;
    onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
