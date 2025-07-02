# 🚖 Taxi Company API - Improved Backup System

A comprehensive taxi company management API with an advanced backup and restore system.

## ✨ New Features

### 🔄 Enhanced Backup System
- **Metadata Tracking**: Each backup includes detailed metadata about collections, record counts, and file sizes
- **Status Monitoring**: Track backup status (completed, partial, failed)
- **Selective Restore**: Choose specific collections to restore
- **Web UI**: Beautiful web interface for backup management
- **CLI Tools**: Command-line interface for automation
- **Cloud Storage**: Automatic upload to Google Cloud Storage

### 🎯 Key Improvements
- **Better Organization**: Backups are organized with unique IDs and timestamps
- **Error Handling**: Graceful handling of collection backup failures
- **Size Tracking**: Monitor backup sizes and storage usage
- **Description Support**: Add descriptions to backups for better organization
- **Batch Operations**: Create and restore multiple collections efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Cloud Storage account

### Installation

1. Clone and setup:
```bash
cd taxi-company-api
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start the server:
```bash
npm run dev
```

### Access Points
- **API**: http://localhost:3000
- **Backup UI**: http://localhost:3000/backup-ui
- **CLI**: `npm run backup help`

## 🔧 Backup Management

### Web Interface
Visit `http://localhost:3000/backup-ui` for the graphical interface where you can:

- ✅ Create new backups with descriptions
- 📋 View all available backups
- 🔍 Examine detailed backup information
- 🔧 Restore specific collections
- 🗑️ Delete old backups
- 📊 Monitor backup status and sizes

### CLI Usage

Create a backup:
```bash
npm run backup create "Daily backup before maintenance"
```

List all backups:
```bash
npm run backup list
```

View backup details:
```bash
npm run backup details backup-2023-12-07-10-30-00
```

Restore entire backup:
```bash
npm run backup restore backup-2023-12-07-10-30-00
```

Restore specific collections:
```bash
npm run backup restore backup-2023-12-07-10-30-00 "Customer,Driver"
```

Delete a backup:
```bash
npm run backup delete backup-2023-12-07-10-30-00
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/backups/create` | Create new backup |
| GET | `/api/backups/list` | List all backups |
| GET | `/api/backups/:id` | Get backup details |
| POST | `/api/backups/:id/restore` | Restore from backup |
| DELETE | `/api/backups/:id` | Delete backup |

## 📊 Backup Structure

### Backup Metadata
```json
{
  "id": "backup-2023-12-07-10-30-00",
  "date": "2023-12-07-10-30-00",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "collections": [
    {
      "name": "Customer",
      "recordCount": 150,
      "fileSize": 45678,
      "status": "success"
    }
  ],
  "totalSize": 123456,
  "status": "completed",
  "description": "Daily backup before maintenance"
}
```

### Collections Backed Up
- **Customer** - Customer accounts and profiles
- **Driver** - Driver information and credentials  
- **Cab** - Vehicle information and status
- **Ride** - Trip history and details

## 🛡️ Safety Features

### Data Protection
- **Confirmation Prompts**: All destructive operations require confirmation
- **Selective Restore**: Choose which collections to restore
- **Status Validation**: Check backup integrity before restore
- **Error Recovery**: Graceful handling of partial failures

### Monitoring
- **Real-time Status**: Live updates during backup/restore operations
- **Progress Tracking**: Visual indicators for long-running operations
- **Error Reporting**: Detailed error messages and logging
- **Size Monitoring**: Track storage usage and growth

## 🔧 Configuration

### Environment Variables

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/taxi-company

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Google Cloud Storage
GCS_BUCKET_NAME=your-backup-bucket
GCP_PROJECT_ID=your-gcp-project-id  
GCS_KEYFILE_PATH=path/to/service-account.json

# Server
PORT=3000
NODE_ENV=development
```

### Google Cloud Storage Setup

1. Create a GCS bucket for backups
2. Create a service account with Storage Admin permissions
3. Download the service account key file
4. Set the path in `GCS_KEYFILE_PATH`

## 📱 Web UI Features

### Dashboard
- 📊 Backup overview and statistics
- 🕐 Recent backup activity
- ⚡ Quick action buttons
- 📈 Storage usage trends

### Backup Management
- 🎯 One-click backup creation
- 📋 Sortable backup list
- 🔍 Detailed backup inspection
- 🎨 Status indicators and badges

### Restore Operations
- 🛡️ Safety confirmations
- ✅ Collection selection
- 📊 Progress monitoring
- 🔄 Real-time status updates

## 🚨 Migration from Old System

The new system is backward compatible with existing backups. Legacy functions are still available:

```typescript
import { backupCollections, restoreCollections } from './src/utils/backup';

// Legacy usage (still works)
await backupCollections();
await restoreCollections(new Date());
```

## 🧪 Testing

Run tests (when implemented):
```bash
npm test
```

API testing with curl:
```bash
# Create backup
curl -X POST http://localhost:3000/api/backups/create \
  -H "Content-Type: application/json" \
  -d '{"description":"Test backup"}'

# List backups
curl http://localhost:3000/api/backups/list
```

## 📚 API Documentation

### Create Backup
```
POST /api/backups/create
Content-Type: application/json

{
  "description": "Optional backup description"
}
```

### Response
```json
{
  "success": true,
  "message": "Backup created successfully",
  "backup": {
    "id": "backup-2023-12-07-10-30-00",
    "status": "completed",
    "formattedSize": "1.2 MB"
  }
}
```

## 🎉 Future Enhancements

- 📅 Scheduled backups
- 📧 Email notifications
- 🔄 Incremental backups
- 📊 Analytics dashboard
- 🔐 Encryption support
- ☁️ Multi-cloud support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the console logs for detailed error messages
2. Verify your GCS credentials and permissions
3. Ensure MongoDB is running and accessible
4. Check the backup UI for status indicators

## 🎯 What's New vs Old System

### Before 😞
- Manual date handling for restores
- No backup listing or management
- Limited error handling
- No web interface
- Hardcoded restore logic
- No metadata tracking

### After 😍
- ✨ Beautiful web interface
- 📋 Complete backup management
- 🔧 Selective restore options
- 🛡️ Safety confirmations
- 📊 Detailed metadata tracking
- 🚀 CLI automation tools
- 📱 Mobile-responsive design
- ⚡ Real-time status updates

The new backup system transforms a basic utility into a full-featured backup management solution!
