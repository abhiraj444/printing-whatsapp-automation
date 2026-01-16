import { Client, LocalAuth, Message, Chat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { CONFIG } from './config';
import { getOrCreateJob, addFileToJob, getJob } from './job-manager';
import { handleUserMessage } from './workflow';
import { formatPDFOnly } from './messages';

let client: Client;

// Store timers per user for 60-second wait
const notificationTimers = new Map<string, NodeJS.Timeout>();

// Store last message chat object per user to reply later
const userChats = new Map<string, Chat>();

export async function startBot() {
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: CONFIG.AUTH_PATH
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('\n🔗 Scan this QR code with WhatsApp:\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        logger.info('✅ WhatsApp connected!');
    });

    client.on('authenticated', () => {
        logger.info('WhatsApp authenticated');
    });

    client.on('auth_failure', (msg) => {
        logger.error({ msg }, 'WhatsApp authentication failed');
    });

    client.on('disconnected', (reason) => {
        logger.warn({ reason }, 'WhatsApp disconnected');
    });

    client.on('message', async (message: Message) => {
        await handleIncomingMessage(message);
    });

    await client.initialize();
    return client;
}

async function handleIncomingMessage(message: Message) {
    try {
        // Skip if message is from self or status
        if (message.fromMe || message.from === 'status@broadcast') return;

        const contact = await message.getContact();
        const phoneNumber = contact.number;

        // Store the chat object for later use
        const chat = await message.getChat();
        userChats.set(phoneNumber, chat);

        logger.info({ phoneNumber, type: message.type }, 'Received message');

        // Check if it's a document (PDF)
        if (message.hasMedia && message.type === 'document') {
            await handleDocumentMessage(message, phoneNumber);
            return;
        }

        // Handle text messages
        if (message.type === 'chat') {
            await handleTextMessage(phoneNumber, message.body);
            return;
        }

    } catch (error) {
        logger.error({ error }, 'Error handling message');
    }
}

async function handleDocumentMessage(message: Message, phoneNumber: string) {
    try {
        const media = await message.downloadMedia();

        if (!media) {
            await sendMessageToUser(phoneNumber, '❌ Failed to download file. Please try again.');
            return;
        }

        const fileName = media.filename || 'document.pdf';

        // Check if it's a PDF
        if (!media.mimetype.includes('pdf') && !fileName.toLowerCase().endsWith('.pdf')) {
            await sendMessageToUser(phoneNumber, formatPDFOnly());
            return;
        }

        // Check if user has a job in progress
        const existingJob = getJob(phoneNumber);
        if (existingJob && (existingJob.state === 'PROCESSING' || existingJob.state === 'PRINTING')) {
            await sendMessageToUser(phoneNumber, '⚠️ Previous job is in progress. Please wait for completion.');
            return;
        }

        // Save to user folder
        const userDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
        await fs.mkdir(userDir, { recursive: true });

        const filePath = path.join(userDir, fileName);
        const buffer = Buffer.from(media.data, 'base64');
        await fs.writeFile(filePath, buffer);

        logger.info({ phoneNumber, fileName, size: buffer.length }, 'Downloaded PDF');

        // Add to job
        addFileToJob(phoneNumber, { fileName, filePath });

        // Clear existing timer if any
        if (notificationTimers.has(phoneNumber)) {
            clearTimeout(notificationTimers.get(phoneNumber)!);
        }

        // Set 10-second timer for notification
        const timer = setTimeout(async () => {
            await sendFileReceivedNotification(phoneNumber);
            notificationTimers.delete(phoneNumber);
        }, 10000); // 10 seconds

        notificationTimers.set(phoneNumber, timer);

        logger.info({ phoneNumber }, 'Set 10s timer for notification');

    } catch (error: any) {
        logger.error({ error: error?.message || error }, 'Failed to download document');
    }
}

async function sendFileReceivedNotification(phoneNumber: string) {
    try {
        const job = getJob(phoneNumber);
        if (!job || job.files.length === 0) return;

        // Send acknowledgment to customer
        const fileList = job.files.map((f, idx) => `${idx + 1}. ${f.fileName}`).join('\n');
        const message = `📄 *Files Received*\n\nTotal: ${job.files.length} PDF(s)\n\n${fileList}\n\n💬 Reply with any message when ready to print!`;

        await sendMessageToUser(phoneNumber, message);

        // Notify shop owner (if enabled)
        if (CONFIG.NOTIFY_OWNER) {
            const ownerMessage = `📥 *New Files Downloaded*\n\n👤 From: ${phoneNumber}\n📄 Files: ${job.files.length}\n${fileList}\n\n📁 Folder: downloads/${phoneNumber}/`;
            await sendMessageToUser(CONFIG.OWNER_PHONE, ownerMessage);
        }

        logger.info({ phoneNumber, fileCount: job.files.length }, 'Sent notification after 10s');
    } catch (error: any) {
        logger.error({ error: error?.message || error }, 'Failed to send notification');
    }
}

async function handleTextMessage(phoneNumber: string, text: string) {
    // Cancel notification timer since user sent a message
    if (notificationTimers.has(phoneNumber)) {
        clearTimeout(notificationTimers.get(phoneNumber)!);
        notificationTimers.delete(phoneNumber);
        logger.info({ phoneNumber }, 'Cancelled notification timer (user sent message)');
    }

    const sendMessageFunc = async (msg: string) => {
        await sendMessageToUser(phoneNumber, msg);
    };

    const ownerNotifyFunc = CONFIG.NOTIFY_OWNER
        ? async (msg: string) => {
            await sendMessageToUser(CONFIG.OWNER_PHONE, msg);
        }
        : undefined;

    await handleUserMessage(phoneNumber, text, sendMessageFunc, ownerNotifyFunc);
}

async function sendMessageToUser(phoneNumber: string, text: string) {
    try {
        // Try using stored chat object first (most reliable)
        const storedChat = userChats.get(phoneNumber);
        if (storedChat) {
            await storedChat.sendMessage(text);
            logger.info({ phoneNumber, preview: text.substring(0, 50), method: 'stored-chat' }, 'Sent message');
            return;
        }

        // Fallback: try direct sendMessage
        const chatId = `${phoneNumber}@c.us`;
        await client.sendMessage(chatId, text);
        logger.info({ phoneNumber, preview: text.substring(0, 50), method: 'direct' }, 'Sent message');

    } catch (error: any) {
        logger.error({
            phoneNumber,
            errorMessage: error?.message || 'Unknown error',
            errorName: error?.name
        }, 'Failed to send message - ALL METHODS');
    }
}
