import { DesignDocument } from '@/core/models/DesignDocument';

export interface IFirestoreRepository {
    saveDesignDocument(doc: DesignDocument): Promise<string>;
    getDesignDocument(id: string): Promise<DesignDocument | null>;
    getUserDesignDocuments(userId: string): Promise<DesignDocument[]>;
    updateDesignDocument(id: string, updates: Partial<DesignDocument>): Promise<void>;
    deleteDesignDocument(id: string): Promise<void>;
}
