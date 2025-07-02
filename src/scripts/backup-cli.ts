#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    createBackup,
    listBackups,
    getBackupDetails,
    restoreFromBackup,
    deleteBackup,
    formatFileSize,
    CollectionBackupInfo
} from '../utils/backup';

dotenv.config();

// Connect to MongoDB
async function connectDB() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is required');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
}

// Command handlers
const commands = {
    async create(description?: string) {
        await connectDB();
        console.log('📦 Creating backup...');
        const backup = await createBackup(description);
        console.log('✅ Backup created successfully!');
        console.log(`📋 Backup ID: ${backup.id}`);
        console.log(`📊 Status: ${backup.status}`);
        console.log(`💾 Size: ${formatFileSize(backup.totalSize)}`);
        console.log(`📁 Collections: ${backup.collections.map((c: CollectionBackupInfo) => c.name).join(', ')}`);
        process.exit(0);
    },

    async list() {
        await connectDB();
        console.log('📋 Loading backups...');
        const backups = await listBackups();

        if (backups.length === 0) {
            console.log('📭 No backups found.');
            process.exit(0);
        }

        console.log(`\n📦 Found ${backups.length} backup(s):\n`);

        for (const backup of backups) {
            console.log(`ID: ${backup.id}`);
            console.log(`Date: ${new Date(backup.timestamp).toLocaleString()}`);
            console.log(`Status: ${backup.status}`);
            console.log(`Collections: ${backup.collections.join(', ')}`);
            console.log('─'.repeat(50));
        }
        process.exit(0);
    },

    async details(backupId: string) {
        if (!backupId) {
            console.error('❌ Backup ID is required');
            process.exit(1);
        }

        await connectDB();
        console.log(`🔍 Getting details for backup: ${backupId}`);

        const details = await getBackupDetails(backupId);
        if (!details) {
            console.error('❌ Backup not found');
            process.exit(1);
        }

        console.log(`\n📦 Backup Details:\n`);
        console.log(`ID: ${details.id}`);
        console.log(`Created: ${new Date(details.timestamp).toLocaleString()}`);
        console.log(`Status: ${details.status}`);
        console.log(`Total Size: ${formatFileSize(details.totalSize)}`);
        if (details.description) {
            console.log(`Description: ${details.description}`);
        }

        console.log('\n📁 Collections:');
        for (const collection of details.collections) {
            console.log(`  ${collection.name}: ${collection.recordCount} records (${formatFileSize(collection.fileSize)}) - ${collection.status}`);
            if (collection.error) {
                console.log(`    Error: ${collection.error}`);
            }
        }
        process.exit(0);
    },

    async restore(backupId: string, collectionsArg?: string) {
        if (!backupId) {
            console.error('❌ Backup ID is required');
            process.exit(1);
        }

        await connectDB();

        const collections = collectionsArg ? collectionsArg.split(',').map(c => c.trim()) : undefined;

        console.log('🔧 Starting restore operation...');
        console.log(`📦 Backup ID: ${backupId}`);

        if (collections) {
            console.log(`📁 Collections: ${collections.join(', ')}`);
        } else {
            console.log('📁 Collections: All available');
        }

        console.log('⚠️  WARNING: This will replace existing data!');

        await restoreFromBackup(backupId, collections);
        console.log('✅ Restore completed successfully!');
        process.exit(0);
    },

    async delete(backupId: string) {
        if (!backupId) {
            console.error('❌ Backup ID is required');
            process.exit(1);
        }

        await connectDB();
        console.log(`🗑️ Deleting backup: ${backupId}`);
        console.log('⚠️  WARNING: This action cannot be undone!');

        await deleteBackup(backupId);
        console.log('✅ Backup deleted successfully!');
        process.exit(0);
    },

    help() {
        console.log(`
🚖 Taxi Company Backup CLI

Usage:
  npm run backup <command> [options]

Commands:
  create [description]              Create a new backup
  list                             List all available backups
  details <backup-id>              Show detailed backup information
  restore <backup-id> [collections] Restore from backup (optional: comma-separated collection names)
  delete <backup-id>               Delete a backup
  help                            Show this help message

Examples:
  npm run backup create "Daily backup"
  npm run backup list
  npm run backup details backup-2023-12-07-10-30-00
  npm run backup restore backup-2023-12-07-10-30-00
  npm run backup restore backup-2023-12-07-10-30-00 "Customer,Driver"
  npm run backup delete backup-2023-12-07-10-30-00

Environment Variables Required:
  MONGO_URI                        MongoDB connection string
  GCS_BUCKET_NAME                  Google Cloud Storage bucket name
  GCP_PROJECT_ID                   Google Cloud Project ID
  GCS_KEYFILE_PATH                 Path to GCS service account key file
        `);
        process.exit(0);
    }
};

// Main CLI handler
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        commands.help();
        return;
    }

    if (!(command in commands)) {
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run "npm run backup help" for available commands');
        process.exit(1);
    }

    try {
        await (commands as any)[command](...args.slice(1));
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error: any) => {
    console.error('❌ Unhandled rejection:', error.message);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});

main();
