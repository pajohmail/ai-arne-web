export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    accessToken?: string;
}
