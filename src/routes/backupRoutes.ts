import express from 'express';
import {
    createBackupHandler,
    listBackupsHandler,
    getBackupDetailsHandler,
    restoreBackupHandler,
    deleteBackupHandler
} from '../controllers/backupController';

const router = express.Router();

// Routes for backup management
router.post('/create', createBackupHandler);
router.get('/list', listBackupsHandler);
router.get('/:backupId', getBackupDetailsHandler);
router.post('/:backupId/restore', restoreBackupHandler);
router.delete('/:backupId', deleteBackupHandler);

export default router;
