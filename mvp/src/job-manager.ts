import { UserJob, JobFile } from './types';
import { CONFIG } from './config';
import { logger } from './logger';
import fs from 'fs/promises';
import path from 'path';

// Global job storage (in-memory for MVP, could be database later)
export const activeJobs = new Map<string, UserJob>();

export function createJob(phoneNumber: string): UserJob {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CONFIG.JOB_RETENTION_HOURS * 60 * 60 * 1000);

    const job: UserJob = {
        phoneNumber,
        state: 'PENDING',
        files: [],
        filesExcluded: [],
        createdAt: now,
        lastActivityAt: now,
        expiresAt
    };

    activeJobs.set(phoneNumber, job);
    logger.info({ phoneNumber }, 'Created new job');
    return job;
}

export function getJob(phoneNumber: string): UserJob | undefined {
    return activeJobs.get(phoneNumber);
}

export function getOrCreateJob(phoneNumber: string): UserJob {
    let job = getJob(phoneNumber);
    if (!job) {
        job = createJob(phoneNumber);
    }
    return job;
}

export function updateJobState(phoneNumber: string, newState: UserJob['state']) {
    const job = getJob(phoneNumber);
    if (job) {
        job.state = newState;
        job.lastActivityAt = new Date();
        logger.info({ phoneNumber, newState }, 'Updated job state');
    }
}

export function addFileToJob(phoneNumber: string, file: JobFile) {
    const job = getOrCreateJob(phoneNumber);

    // If job was in a completed/cancelled state, reset it
    if (job.state === 'COMPLETED' || job.state === 'CANCELLED') {
        job.state = 'PENDING';
        job.files = [];
        job.filesExcluded = [];
    }

    job.files.push(file);
    job.lastActivityAt = new Date();
    logger.info({ phoneNumber, fileName: file.fileName }, 'Added file to job');
}

export function deleteJob(phoneNumber: string) {
    activeJobs.delete(phoneNumber);
    logger.info({ phoneNumber }, 'Deleted job');
}

async function deleteUserFiles(phoneNumber: string) {
    try {
        // Delete download folder
        const downloadDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
        try {
            await fs.rm(downloadDir, { recursive: true, force: true });
            logger.info({ phoneNumber, folder: 'downloads' }, 'Deleted user download folder');
        } catch (err) {
            // Folder might not exist, that's okay
            logger.debug({ phoneNumber, folder: 'downloads' }, 'Download folder not found (already deleted)');
        }

        // Delete processed folder
        const processedDir = path.join(CONFIG.PROCESSED_PATH, phoneNumber);
        try {
            await fs.rm(processedDir, { recursive: true, force: true });
            logger.info({ phoneNumber, folder: 'processed' }, 'Deleted user processed folder');
        } catch (err) {
            logger.debug({ phoneNumber, folder: 'processed' }, 'Processed folder not found (already deleted)');
        }
    } catch (error) {
        logger.error({ error, phoneNumber }, 'Error deleting user files');
    }
}

export async function cleanupExpiredJobs() {
    const now = new Date();
    let cleaned = 0;

    for (const [phoneNumber, job] of activeJobs.entries()) {
        if (now > job.expiresAt) {
            // Delete files from disk
            await deleteUserFiles(phoneNumber);

            // Remove from memory
            activeJobs.delete(phoneNumber);
            cleaned++;
            logger.info({ phoneNumber }, 'Cleaned up expired job (memory + files)');
        }
    }

    if (cleaned > 0) {
        logger.info({ count: cleaned }, 'Cleaned up expired jobs');
    }

    return cleaned;
}

// Run cleanup every hour
setInterval(cleanupExpiredJobs, 60 * 60 * 1000);

