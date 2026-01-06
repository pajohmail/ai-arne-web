export type AuthProvider = 'google';

export interface FirebaseError {
    code: string;
    message: string;
}

export interface DriveFile {
    id: string;
    name: string;
    webViewLink: string;
    mimeType: string;
}
