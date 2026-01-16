import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { logger } from './logger';
import { JobFile } from './types';

export async function countPDFPages(filePath: string): Promise<number> {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.numpages;
    } catch (error) {
        logger.error({ error, filePath }, 'Failed to count PDF pages');
        throw new Error('Failed to read PDF');
    }
}

export async function processJobFiles(files: JobFile[]): Promise<void> {
    for (const file of files) {
        try {
            file.pageCount = await countPDFPages(file.filePath);
            logger.info({ fileName: file.fileName, pageCount: file.pageCount }, 'Counted pages');
        } catch (error) {
            logger.error({ error, fileName: file.fileName }, 'Error processing PDF');
            file.pageCount = 0; // Mark as error
        }
    }
}

export function getTotalPages(files: JobFile[]): number {
    return files.reduce((sum, file) => sum + (file.pageCount || 0), 0);
}

export async function renameFilesWithPhone(phoneNumber: string, files: JobFile[], outputDir: string): Promise<string[]> {
    const renamedPaths: string[] = [];

    await fs.mkdir(outputDir, { recursive: true });

    for (const file of files) {
        const newFileName = `${phoneNumber}_${file.fileName}`;
        const newPath = path.join(outputDir, newFileName);

        await fs.copyFile(file.filePath, newPath);
        renamedPaths.push(newPath);

        logger.info({ oldPath: file.filePath, newPath }, 'Renamed file');
    }

    return renamedPaths;
}
