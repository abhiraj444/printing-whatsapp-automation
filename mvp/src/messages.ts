import { CONFIG } from './config';
import { JobFile } from './types';

export function formatFileList(files: JobFile[], totalPages: number, totalCost: number): string {
    const fileListText = files
        .map((file, index) => {
            const pageText = file.pageCount ? ` (${file.pageCount} pages)` : '';
            return `     ${index + 1}️⃣ ${file.fileName}${pageText}`;
        })
        .join('\n');

    return `📄 You have ${files.length} PDF${files.length > 1 ? 's' : ''} ready to print:

${fileListText}
     
📊 Total: ${totalPages} pages
💰 Cost: ₹${totalCost.toFixed(2)}

Reply:
• YES - Print all files
• SKIP - Remove some files first`;
}

export function formatRemovalPrompt(): string {
    return `Which files to skip? Reply with numbers (comma-separated)
Example: 1,3 or just 2`;
}

export function formatFilesRemoved(
    removed: string[],
    remaining: JobFile[],
    totalPages: number,
    totalCost: number
): string {
    const removedText = removed.map(name => `  ❌ ${name}`).join('\n');
    const remainingText = remaining.map((file, idx) => {
        const pageText = file.pageCount ? ` (${file.pageCount} pages)` : '';
        return `     ${idx + 1}️⃣ ${file.fileName}${pageText}`;
    }).join('\n');

    return `✅ Removed:
${removedText}

📄 Printing these files:
${remainingText}

📊 Total: ${totalPages} pages
💰 Cost: ₹${totalCost.toFixed(2)}

Confirm? Reply YES`;
}

export function formatProcessing(): string {
    return '🖨️ Processing your print job... please wait.';
}

export function formatCompleted(
    fileCount: number,
    totalPages: number,
    totalCost: number,
    phoneNumber: string
): string {
    return `✅ Print job sent to mailbox!

📄 Files: ${fileCount}
📊 Total Pages: ${totalPages}
💰 Total Cost: ₹${totalCost.toFixed(2)}

🖨️ Files in mailbox: ${phoneNumber}
📍 Collect from shop & pay ₹${totalCost.toFixed(2)}

Thank you! 🙏`;
}

export function formatError(message: string): string {
    return `❌ ${message}`;
}

export function formatPDFOnly(): string {
    return '⚠️ Sorry, only PDF files are supported.\nPlease send PDF documents only.';
}

export function formatJobInProgress(): string {
    return '⚠️ Your previous job is still in progress.\nPlease wait for completion.';
}

export function calculatePrice(totalPages: number): number {
    return totalPages * CONFIG.PRICE_PER_PAGE;
}
