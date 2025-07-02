import { promises as fs } from 'fs';
import mongoose from 'mongoose';
import * as gcs from './gcs.js';
import { format } from 'date-fns';
import 'dotenv/config';
import path from 'path';

const collections = [
    'Cab',
    'Customer',
    'Driver',
    'Ride'
];

const backupDir = './backups';

export interface BackupInfo {
    id: string;
    date: string;
    timestamp: Date;
    collections: string[];
    size?: string;
    status: 'completed' | 'partial' | 'failed';
    description?: string;
}

export interface BackupMetadata {
    id: string;
    date: string;
    timestamp: Date;
    collections: CollectionBackupInfo[];
    totalSize: number;
    status: 'completed' | 'partial' | 'failed';
    description?: string;
}

export interface CollectionBackupInfo {
    name: string;
    recordCount: number;
    fileSize: number;
    status: 'success' | 'failed';
    error?: string;
}

// Create backup with metadata
export const createBackup = async (description?: string): Promise<BackupMetadata> => {
    await fs.mkdir(backupDir, { recursive: true });

    const date = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const backupId = `backup-${date}`;
    const backupDirPath = `${backupDir}/${backupId}`;
    
    await fs.mkdir(backupDirPath, { recursive: true });

    const collectionResults: CollectionBackupInfo[] = [];
    let totalSize = 0;
    let hasFailures = false;

    for (const collectionName of collections) {
        try {
            const collection = mongoose.connection.collection(collectionName);
            const data = await collection.find({}).toArray();
            
            const filePath = `${backupDirPath}/${collectionName}.json`;
            const jsonData = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, jsonData);
            
            const fileSize = Buffer.byteLength(jsonData, 'utf8');
            totalSize += fileSize;

            // Upload to GCS
            const gcsDestination = `backups/${backupId}/${collectionName}.json`;
            await gcs.uploadFileToGCS(filePath, gcsDestination);

            collectionResults.push({
                name: collectionName,
                recordCount: data.length,
                fileSize,
                status: 'success'
            });

            console.log(`✓ Backed up ${collectionName}: ${data.length} records`);
        } catch (error: any) {
            hasFailures = true;
            collectionResults.push({
                name: collectionName,
                recordCount: 0,
                fileSize: 0,
                status: 'failed',
                error: error.message
            });
            console.error(`✗ Failed to backup ${collectionName}:`, error.message);
        }
    }

    const metadata: BackupMetadata = {
        id: backupId,
        date,
        timestamp: new Date(),
        collections: collectionResults,
        totalSize,
        status: hasFailures ? (collectionResults.some(c => c.status === 'success') ? 'partial' : 'failed') : 'completed',
        description
    };

    // Save metadata
    const metadataPath = `${backupDirPath}/metadata.json`;
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Upload metadata to GCS
    const gcsMetadataDestination = `backups/${backupId}/metadata.json`;
    await gcs.uploadFileToGCS(metadataPath, gcsMetadataDestination);

    return metadata;
};

// List available backups
export const listBackups = async (): Promise<BackupInfo[]> => {
    try {
        const files = await gcs.listFilesFromGCS('backups/');
        const backupMap = new Map<string, BackupInfo>();

        for (const file of files) {
            const pathParts = file.name.split('/');
            if (pathParts.length >= 2 && pathParts[0] === 'backups') {
                const backupId = pathParts[1];
                
                if (!backupMap.has(backupId)) {
                    backupMap.set(backupId, {
                        id: backupId,
                        date: backupId.replace('backup-', ''),
                        timestamp: new Date(file.timeCreated || ''),
                        collections: [],
                        status: 'completed'
                    });
                }

                const backup = backupMap.get(backupId)!;
                
                if (pathParts[2] && pathParts[2] !== 'metadata.json') {
                    const collectionName = pathParts[2].replace('.json', '');
                    if (collections.includes(collectionName)) {
                        backup.collections.push(collectionName);
                    }
                }
            }
        }

        return Array.from(backupMap.values()).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    } catch (error) {
        console.error('Error listing backups:', error);
        return [];
    }
};

// Get detailed backup information
export const getBackupDetails = async (backupId: string): Promise<BackupMetadata | null> => {
    try {
        const tempDir = `${backupDir}/temp-${Date.now()}`;
        await fs.mkdir(tempDir, { recursive: true });
        
        const metadataPath = `${tempDir}/metadata.json`;
        const gcsPath = `backups/${backupId}/metadata.json`;
        
        await gcs.downloadFileFromGCS(gcsPath, metadataPath);
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent) as BackupMetadata;
        
        // Clean up temp file
        await fs.rm(tempDir, { recursive: true });
        
        return metadata;
    } catch (error) {
        console.error(`Error getting backup details for ${backupId}:`, error);
        return null;
    }
};

// Restore from backup
export const restoreFromBackup = async (backupId: string, selectedCollections?: string[]): Promise<void> => {
    const tempDir = `${backupDir}/restore-${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    try {
        const metadata = await getBackupDetails(backupId);
        if (!metadata) {
            throw new Error(`Backup ${backupId} not found or corrupted`);
        }

        const collectionsToRestore = selectedCollections || collections;
        
        console.log(`Starting restore from backup: ${backupId}`);
        console.log(`Collections to restore: ${collectionsToRestore.join(', ')}`);

        for (const collectionName of collectionsToRestore) {
            if (!collections.includes(collectionName)) {
                console.warn(`Skipping unknown collection: ${collectionName}`);
                continue;
            }

            try {
                const gcsSource = `backups/${backupId}/${collectionName}.json`;
                const localPath = `${tempDir}/${collectionName}.json`;

                console.log(`Downloading ${collectionName} from GCS...`);
                await gcs.downloadFileFromGCS(gcsSource, localPath);

                const data = JSON.parse(await fs.readFile(localPath, 'utf8'));
                const collection = mongoose.connection.collection(collectionName);

                console.log(`Restoring ${collectionName} (${data.length} records)...`);
                
                // Clear existing data
                await collection.deleteMany({});
                
                // Insert backup data
                if (data.length > 0) {
                    await collection.insertMany(data);
                }

                console.log(`✓ Restored ${collectionName}: ${data.length} records`);
            } catch (error: any) {
                console.error(`✗ Failed to restore ${collectionName}:`, error.message);
                throw error;
            }
        }

        console.log('✓ Restore completed successfully');
    } catch (error) {
        console.error('Restore failed:', error);
        throw error;
    } finally {
        // Clean up temp directory
        try {
            await fs.rm(tempDir, { recursive: true });
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary directory:', cleanupError);
        }
    }
};

// Delete backup
export const deleteBackup = async (backupId: string): Promise<void> => {
    try {
        const files = await gcs.listFilesFromGCS(`backups/${backupId}/`);
        
        for (const file of files) {
            await gcs.deleteFileFromGCS(file.name);
        }
        
        console.log(`✓ Deleted backup: ${backupId}`);
    } catch (error) {
        console.error(`Failed to delete backup ${backupId}:`, error);
        throw error;
    }
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Legacy function for backward compatibility
export const backupCollections = createBackup;

// Legacy function for backward compatibility  
export const restoreCollections = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd-HH-mm-ss');
    const backupId = `backup-${dateStr}`;
    return restoreFromBackup(backupId);
};
