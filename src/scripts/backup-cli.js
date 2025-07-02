#!/usr/bin/env ts-node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const backup_1 = require("../src/utils/backup");
dotenv_1.default.config();
// Connect to MongoDB
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is required');
        }
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    });
}
// Command handlers
const commands = {
    create(description) {
        return __awaiter(this, void 0, void 0, function* () {
            yield connectDB();
            console.log('📦 Creating backup...');
            const backup = yield (0, backup_1.createBackup)(description);
            console.log('✅ Backup created successfully!');
            console.log(`📋 Backup ID: ${backup.id}`);
            console.log(`📊 Status: ${backup.status}`);
            console.log(`💾 Size: ${(0, backup_1.formatFileSize)(backup.totalSize)}`);
            console.log(`📁 Collections: ${backup.collections.map(c => c.name).join(', ')}`);
            process.exit(0);
        });
    },
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            yield connectDB();
            console.log('📋 Loading backups...');
            const backups = yield (0, backup_1.listBackups)();
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
        });
    },
    details(backupId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!backupId) {
                console.error('❌ Backup ID is required');
                process.exit(1);
            }
            yield connectDB();
            console.log(`🔍 Getting details for backup: ${backupId}`);
            const details = yield (0, backup_1.getBackupDetails)(backupId);
            if (!details) {
                console.error('❌ Backup not found');
                process.exit(1);
            }
            console.log(`\n📦 Backup Details:\n`);
            console.log(`ID: ${details.id}`);
            console.log(`Created: ${new Date(details.timestamp).toLocaleString()}`);
            console.log(`Status: ${details.status}`);
            console.log(`Total Size: ${(0, backup_1.formatFileSize)(details.totalSize)}`);
            if (details.description) {
                console.log(`Description: ${details.description}`);
            }
            console.log('\n📁 Collections:');
            for (const collection of details.collections) {
                console.log(`  ${collection.name}: ${collection.recordCount} records (${(0, backup_1.formatFileSize)(collection.fileSize)}) - ${collection.status}`);
                if (collection.error) {
                    console.log(`    Error: ${collection.error}`);
                }
            }
            process.exit(0);
        });
    },
    restore(backupId, collectionsArg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!backupId) {
                console.error('❌ Backup ID is required');
                process.exit(1);
            }
            yield connectDB();
            const collections = collectionsArg ? collectionsArg.split(',').map(c => c.trim()) : undefined;
            console.log('🔧 Starting restore operation...');
            console.log(`📦 Backup ID: ${backupId}`);
            if (collections) {
                console.log(`📁 Collections: ${collections.join(', ')}`);
            }
            else {
                console.log('📁 Collections: All available');
            }
            console.log('⚠️  WARNING: This will replace existing data!');
            yield (0, backup_1.restoreFromBackup)(backupId, collections);
            console.log('✅ Restore completed successfully!');
            process.exit(0);
        });
    },
    delete(backupId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!backupId) {
                console.error('❌ Backup ID is required');
                process.exit(1);
            }
            yield connectDB();
            console.log(`🗑️ Deleting backup: ${backupId}`);
            console.log('⚠️  WARNING: This action cannot be undone!');
            yield (0, backup_1.deleteBackup)(backupId);
            console.log('✅ Backup deleted successfully!');
            process.exit(0);
        });
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield commands[command](...args.slice(1));
        }
        catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error.message);
    process.exit(1);
});
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});
main();
