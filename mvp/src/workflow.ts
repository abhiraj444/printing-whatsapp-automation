import { getJob, updateJobState, deleteJob } from './job-manager';
import { processJobFiles, getTotalPages, renameFilesWithPhone } from './pdf-processor';
import { printToPrinter } from './printer';
import {
    formatFileList,
    formatRemovalPrompt,
    formatFilesRemoved,
    formatProcessing,
    formatCompleted,
    formatError,
    formatJobInProgress,
    calculatePrice
} from './messages';
import { CONFIG } from './config';
import { logger } from './logger';
import { JobFile } from './types';

export async function handleUserMessage(
    phoneNumber: string,
    messageText: string,
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>
) {
    const job = getJob(phoneNumber);

    if (!job) {
        // No pending job
        return;
    }

    const text = messageText.trim().toUpperCase();

    try {
        switch (job.state) {
            case 'PENDING':
                // User sent a message, show file list
                await handlePendingJob(phoneNumber, sendMessage);
                break;

            case 'AWAITING_CONFIRMATION':
                if (text === 'YES') {
                    await handleConfirmPrint(phoneNumber, sendMessage, ownerNotify);
                } else if (text === 'SKIP') {
                    await handleSkipRequest(phoneNumber, sendMessage);
                } else {
                    await sendMessage(formatFileList(job.files, getTotalPages(job.files), calculatePrice(getTotalPages(job.files))));
                }
                break;

            case 'AWAITING_REMOVAL':
                await handleFileRemoval(phoneNumber, messageText, sendMessage);
                break;

            case 'AWAITING_FINAL_CONFIRMATION':
                if (text === 'YES') {
                    await handleConfirmPrint(phoneNumber, sendMessage, ownerNotify);
                } else {
                    await sendMessage('Reply YES to confirm printing');
                }
                break;

            case 'PROCESSING':
            case 'PRINTING':
                await sendMessage(formatJobInProgress());
                break;
        }
    } catch (error) {
        logger.error({ error, phoneNumber }, 'Error handling user message');
        await sendMessage(formatError('Something went wrong. Please try again or contact support.'));
    }
}

async function handlePendingJob(phoneNumber: string, sendMessage: (text: string) => Promise<void>) {
    const job = getJob(phoneNumber);
    if (!job) return;

    // Count pages for all files
    await processJobFiles(job.files);

    const totalPages = getTotalPages(job.files);
    const totalCost = calculatePrice(totalPages);

    updateJobState(phoneNumber, 'AWAITING_CONFIRMATION');
    await sendMessage(formatFileList(job.files, totalPages, totalCost));
}

async function handleConfirmPrint(
    phoneNumber: string,
    sendMessage: (text: string) => Promise<void>,
    ownerNotify?: (text: string) => Promise<void>
) {
    const job = getJob(phoneNumber);
    if (!job) return;

    updateJobState(phoneNumber, 'PROCESSING');
    await sendMessage(formatProcessing());

    // Filter out excluded files
    const filesToPrint = job.files.filter(f => !job.filesExcluded.includes(f.fileName));

    if (filesToPrint.length === 0) {
        await sendMessage(formatError('No files selected for printing'));
        deleteJob(phoneNumber);
        return;
    }

    // Rename files with phone number
    const outputDir = `${CONFIG.PROCESSED_PATH}/${phoneNumber}`;
    const renamedPaths = await renameFilesWithPhone(phoneNumber, filesToPrint, outputDir);

    // Send to printer
    updateJobState(phoneNumber, 'PRINTING');
    await printToPrinter(renamedPaths);

    // Calculate final stats
    const totalPages = getTotalPages(filesToPrint);
    const totalCost = calculatePrice(totalPages);

    // Send completion message to customer
    updateJobState(phoneNumber, 'COMPLETED');
    await sendMessage(formatCompleted(filesToPrint.length, totalPages, totalCost, phoneNumber));

    // Notify shop owner (if enabled)
    if (CONFIG.NOTIFY_OWNER && ownerNotify) {
        const fileList = filesToPrint.map(f => `  • ${f.fileName} (${f.pageCount} pages)`).join('\n');
        await ownerNotify(
            `🖨️ *Print Job Sent to Mailbox*\n\n👤 Customer: ${phoneNumber}\n📄 Files: ${filesToPrint.length}\n${fileList}\n\n📊 Total Pages: ${totalPages}\n💰 Amount: ₹${totalCost.toFixed(2)}\n📁 Mailbox: Files start with ${phoneNumber}_*`
        );
    }

    // Clean up job after some time
    setTimeout(() => deleteJob(phoneNumber), 60000); // Delete after 1 minute
}

async function handleSkipRequest(phoneNumber: string, sendMessage: (text: string) => Promise<void>) {
    updateJobState(phoneNumber, 'AWAITING_REMOVAL');
    await sendMessage(formatRemovalPrompt());
}

async function handleFileRemoval(phoneNumber: string, messageText: string, sendMessage: (text: string) => Promise<void>) {
    const job = getJob(phoneNumber);
    if (!job) return;

    // Parse numbers from message (e.g., "1,3" or "2" or "1, 2, 3")
    const numbers = messageText
        .split(/[,\s]+/)
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n) && n > 0 && n <= job.files.length);

    if (numbers.length === 0) {
        await sendMessage('Invalid numbers. Please reply with file numbers to skip (e.g., 1,3)');
        return;
    }

    // Mark files for exclusion (convert to 0-indexed)
    const filesToExclude = numbers.map(n => job.files[n - 1].fileName);
    job.filesExcluded = filesToExclude;

    // Get remaining files
    const remainingFiles = job.files.filter(f => !job.filesExcluded.includes(f.fileName));

    if (remainingFiles.length === 0) {
        await sendMessage(formatError('Cannot remove all files. Please select at least one file to print.'));
        job.filesExcluded = [];
        updateJobState(phoneNumber, 'AWAITING_REMOVAL');
        return;
    }

    const totalPages = getTotalPages(remainingFiles);
    const totalCost = calculatePrice(totalPages);

    updateJobState(phoneNumber, 'AWAITING_FINAL_CONFIRMATION');
    await sendMessage(formatFilesRemoved(filesToExclude, remainingFiles, totalPages, totalCost));
}
