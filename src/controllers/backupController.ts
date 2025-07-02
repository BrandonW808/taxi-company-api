import { Request, Response } from 'express';
import {
    createBackup,
    listBackups,
    getBackupDetails,
    restoreFromBackup,
    deleteBackup,
    formatFileSize
} from '../utils/backup';

// Create a new backup
export const createBackupHandler = async (req: Request, res: Response) => {
    try {
        const { description } = req.body;

        console.log('Starting backup creation...');
        const metadata = await createBackup(description);

        res.json({
            success: true,
            message: 'Backup created successfully',
            backup: {
                ...metadata,
                formattedSize: formatFileSize(metadata.totalSize)
            }
        });
    } catch (error: any) {
        console.error('Backup creation failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            error: error.message
        });
    }
};

// List all available backups
export const listBackupsHandler = async (req: Request, res: Response) => {
    try {
        const backups = await listBackups();

        res.json({
            success: true,
            backups: backups.map(backup => ({
                ...backup,
                collectionsCount: backup.collections.length
            }))
        });
    } catch (error: any) {
        console.error('Failed to list backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list backups',
            error: error.message
        });
    }
};

// Get detailed backup information
export const getBackupDetailsHandler = async (req: Request, res: Response) => {
    try {
        const { backupId } = req.params;
        const details = await getBackupDetails(backupId);

        if (!details) {
            res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
            return;
        }

        res.json({
            success: true,
            backup: {
                ...details,
                formattedSize: formatFileSize(details.totalSize),
                collections: details.collections.map(col => ({
                    ...col,
                    formattedSize: formatFileSize(col.fileSize)
                }))
            }
        });
    } catch (error: any) {
        console.error('Failed to get backup details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup details',
            error: error.message
        });
    }
};

// Restore from backup
export const restoreBackupHandler = async (req: Request, res: Response) => {
    try {
        const { backupId } = req.params;
        const { collections } = req.body;

        console.log(`Starting restore from backup: ${backupId}`);
        await restoreFromBackup(backupId, collections);

        res.json({
            success: true,
            message: 'Database restored successfully',
            backupId
        });
    } catch (error: any) {
        console.error('Restore failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore database',
            error: error.message
        });
    }
};

// Delete backup
export const deleteBackupHandler = async (req: Request, res: Response) => {
    try {
        const { backupId } = req.params;

        await deleteBackup(backupId);

        res.json({
            success: true,
            message: 'Backup deleted successfully',
            backupId
        });
    } catch (error: any) {
        console.error('Failed to delete backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete backup',
            error: error.message
        });
    }
};
