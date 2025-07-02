import { Storage } from '@google-cloud/storage';
import 'dotenv/config'

const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
    throw new Error(`No bucket name provided`);
}

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCS_KEYFILE_PATH,
});

const bucket = storage.bucket(bucketName);

export const uploadFileToGCS = async (filePath: string, destination: string) => {
    await bucket.upload(filePath, {
        destination,
    });
};

export const downloadFileFromGCS = async (source: string, destination: string) => {
    await bucket.file(source).download({ destination });
};

export const listFilesFromGCS = async (prefix?: string) => {
    const [files] = await bucket.getFiles({ prefix });
    return files.map(file => ({
        name: file.name,
        timeCreated: file.metadata.timeCreated,
        size: file.metadata.size,
        id: file.id
    }));
};

export const deleteFileFromGCS = async (fileName: string) => {
    await bucket.file(fileName).delete();
};
