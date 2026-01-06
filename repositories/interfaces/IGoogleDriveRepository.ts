import { DriveFile } from '@/core/types';

export interface IGoogleDriveRepository {
    createFolder(folderName: string, parentId?: string): Promise<string>;
    uploadFile(
        folderId: string,
        fileName: string,
        content: string,
        mimeType?: string
    ): Promise<DriveFile>;
    listFiles(folderId?: string): Promise<DriveFile[]>;
}
