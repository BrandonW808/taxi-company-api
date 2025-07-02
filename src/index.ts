// src/index.ts
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import customerRoutes from './routes/customerRoutes';
import backupRoutes from './routes/backupRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Static files for backup UI
app.use('/backup-ui', express.static(path.join(__dirname, '../src/public')));

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/backups', backupRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Taxi Company API',
        endpoints: {
            customers: '/api/customers',
            backups: '/api/backups',
            backupUI: '/backup-ui'
        }
    });
});

mongoose.connect(process.env.MONGO_URI!)
    .then(() => app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Backup UI available at: http://localhost:${PORT}/backup-ui`);
    }))
    .catch(error => console.log(error));
