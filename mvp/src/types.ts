export interface JobFile {
    fileName: string;
    filePath: string;
    pageCount?: number;
}

export type JobState =
    | 'PENDING'              // Files uploaded, waiting for user message
    | 'AWAITING_CONFIRMATION' // Showing file list, waiting for YES/SKIP
    | 'AWAITING_REMOVAL'     // User said SKIP, waiting for file numbers
    | 'AWAITING_FINAL_CONFIRMATION' // After removal, waiting for final YES
    | 'PROCESSING'           // Processing files
    | 'PRINTING'             // Sending to printer
    | 'COMPLETED'            // Done
    | 'CANCELLED';           // User cancelled or timeout

export interface UserJob {
    phoneNumber: string;
    state: JobState;
    files: JobFile[];
    filesExcluded: string[]; // File names to skip
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;         // 24 hours from creation
}

export interface MessageTemplate {
    fileList: (files: JobFile[], totalPages: number, totalCost: number) => string;
    confirmPrintAll: () => string;
    removeFiles: () => string;
    filesRemoved: (removed: string[], remaining: JobFile[], totalPages: number, totalCost: number) => string;
    processing: () => string;
    completed: (fileCount: number, totalPages: number, totalCost: number, phoneNumber: string) => string;
    error: (message: string) => string;
}
