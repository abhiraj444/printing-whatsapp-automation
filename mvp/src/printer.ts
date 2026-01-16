import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG } from './config';
import { logger } from './logger';

const execAsync = promisify(exec);

export async function printToPrinter(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
        try {
            // Use PowerShell to print (relies on default application for the file type)
            // This is more robust for modern printers and PDFs
            const psCommand = `Start-Process -FilePath "${filePath}" -Verb Print`;
            await execAsync(`powershell -Command "${psCommand}"`);

            logger.info({ filePath }, 'Sent to printer via PowerShell');

            // Small delay between files to avoid overwhelming the spooler
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            logger.error({ error, filePath }, 'Failed to print file');
            throw new Error(`Printer error: ${error}`);
        }
    }
}

// Alternative: Use PowerShell for more control
export async function printViaPowerShell(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
        try {
            const psCommand = `Start-Process -FilePath "${filePath}" -Verb Print`;
            await execAsync(`powershell -Command "${psCommand}"`);

            logger.info({ filePath }, 'Sent to printer via PowerShell');
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            logger.error({ error, filePath }, 'Failed to print via PowerShell');
            throw new Error(`Printer error: ${error}`);
        }
    }
}
