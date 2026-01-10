import {
    Firestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { IFirestoreRepository } from './interfaces/IFirestoreRepository';
import { DesignDocument } from '@/core/models/DesignDocument';

export class FirestoreRepository implements IFirestoreRepository {
    constructor(private db: Firestore) { }

    async saveDesignDocument(documentData: DesignDocument): Promise<string> {
        try {
            const { id, ...data } = documentData;
            const docRef = doc(this.db, 'designDocuments', id);

            // Use setDoc with merge to create or update
            await setDoc(docRef, data, { merge: true });
            return id;
        } catch (error: any) {
            throw new Error(`Failed to save document: ${error.message}`);
        }
    }

    async getDesignDocument(id: string): Promise<DesignDocument | null> {
        try {
            const docRef = doc(this.db, 'designDocuments', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as DesignDocument;
            } else {
                return null;
            }
        } catch (error: any) {
            throw new Error(`Failed to get document: ${error.message}`);
        }
    }

    async updateDesignDocument(
        id: string,
        updates: Partial<DesignDocument>
    ): Promise<void> {
        try {
            const docRef = doc(this.db, 'designDocuments', id);
            await updateDoc(docRef, updates);
        } catch (error: any) {
            throw new Error(`Failed to update document: ${error.message}`);
        }
    }

    async deleteDesignDocument(id: string): Promise<void> {
        try {
            const docRef = doc(this.db, 'designDocuments', id);
            await deleteDoc(docRef);
        } catch (error: any) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    async getUserDesignDocuments(userId: string): Promise<DesignDocument[]> {
        try {
            const q = query(
                collection(this.db, 'designDocuments'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const documents: DesignDocument[] = [];

            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() } as DesignDocument);
            });

            return documents;
        } catch (error: any) {
            throw new Error(`Failed to get user documents: ${error.message}`);
        }
    }
}
