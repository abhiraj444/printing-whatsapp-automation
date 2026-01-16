import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    downloadMediaMessage,
    WASocket,
    proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { CONFIG } from './config';
import { getOrCreateJob, addFileToJob, getJob } from './job-manager';
import { handleUserMessage } from './workflow';
import { formatPDFOnly } from './messages';

let sock: WASocket;

// Store timers per user for 60-second wait
const notificationTimers = new Map<string, NodeJS.Timeout>();

export async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_PATH);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // We handle QR printing manually
        // logger: logger as any // Use pino logger if compatible, or default
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n🔗 Scan this QR code with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.warn({ error: lastDisconnect?.error, shouldReconnect }, 'Connection closed');

            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            logger.info('✅ WhatsApp connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            await handleIncomingMessage(msg);
        }
    });

    return sock;
}

async function handleIncomingMessage(msg: proto.IWebMessageInfo) {
    try {
        if (!msg.key || msg.key.fromMe) return;

        const phoneNumber = msg.key.remoteJid?.replace('@s.whatsapp.net', '').replace('@lid', '');
        if (!phoneNumber) return;

        const messageType = Object.keys(msg.message || {})[0];
        logger.info({ phoneNumber, type: messageType }, 'Received message');

        // Handle Document (PDF)
        if (messageType === 'documentMessage' || messageType === 'documentWithCaptionMessage') {
            await handleDocumentMessage(msg, phoneNumber);
            return;
        }

        // Handle Text
        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            await handleTextMessage(phoneNumber, text, msg);
            return;
        }

    } catch (error) {
        logger.error({ error }, 'Error handling message');
    }
}

async function handleDocumentMessage(msg: proto.IWebMessageInfo, phoneNumber: string) {
    try {
        if (!msg.key || !msg.key.remoteJid) return;

        const document = msg.message?.documentMessage || msg.message?.documentWithCaptionMessage?.message?.documentMessage;

        if (!document) return;

        const fileName = document.fileName || 'document.pdf';
        const mimeType = document.mimetype || '';

        // Check if it's a PDF
        if (mimeType !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
            await sendMessageToUser(msg.key.remoteJid, formatPDFOnly());
            return;
        }

        // Check if user has a job in progress
        const existingJob = getJob(phoneNumber);
        if (existingJob && (existingJob.state === 'PROCESSING' || existingJob.state === 'PRINTING')) {
            await sendMessageToUser(msg.key.remoteJid, '⚠️ Previous job is in progress. Please wait for completion.');
            return;
        }

        // Download
        const buffer = await downloadMediaMessage(
            msg as any,
            'buffer',
            {},
            {
                logger: console as any,
                reuploadRequest: sock.updateMediaMessage
            }
        );

        // Save to user folder
        const userDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
        await fs.mkdir(userDir, { recursive: true });

        const filePath = path.join(userDir, fileName);
        await fs.writeFile(filePath, buffer);

        logger.info({ phoneNumber, fileName, size: buffer.length }, 'Downloaded PDF');

        // Add to job
        addFileToJob(phoneNumber, { fileName, filePath });

        // Clear existing timer if any
        if (notificationTimers.has(phoneNumber)) {
            clearTimeout(notificationTimers.get(phoneNumber)!);
        }

        // Capture remoteJid for the callback
        const remoteJid = msg.key.remoteJid;

        // Set 60-second timer for notification
        const timer = setTimeout(async () => {
            if (remoteJid) {
                await sendFileReceivedNotification(phoneNumber, remoteJid);
            }
            notificationTimers.delete(phoneNumber);
        }, 6000); // 60 seconds

        notificationTimers.set(phoneNumber, timer);

        logger.info({ phoneNumber }, 'Set 60s timer for notification');

    } catch (error: any) {
        logger.error({ error: error?.message || error }, 'Failed to download document');
        if (msg.key && msg.key.remoteJid) {
            await sendMessageToUser(msg.key.remoteJid, '❌ Failed to download file. Please try again.');
        }
    }
}

async function sendFileReceivedNotification(phoneNumber: string, remoteJid: string) {
    try {
        const job = getJob(phoneNumber);
        if (!job || job.files.length === 0) return;

        // Send acknowledgment to customer
        const fileList = job.files.map((f, idx) => `${idx + 1}. ${f.fileName}`).join('\n');
        const message = `📄 *Files Received*\n\nTotal: ${job.files.length} PDF(s)\n\n${fileList}\n\n💬 Reply with any message when ready to print!`;

        await sendMessageToUser(remoteJid, message);

        // Notify shop owner (if enabled)
        if (CONFIG.NOTIFY_OWNER) {
            const ownerMessage = `📥 *New Files Downloaded*\n\n👤 From: ${phoneNumber}\n📄 Files: ${job.files.length}\n${fileList}\n\n📁 Folder: downloads/${phoneNumber}/`;
            await sendMessageToUser(`${CONFIG.OWNER_PHONE}@s.whatsapp.net`, ownerMessage);
        }

        logger.info({ phoneNumber, fileCount: job.files.length }, 'Sent notification after 60s');
    } catch (error: any) {
        logger.error({ error: error?.message || error }, 'Failed to send notification');
    }
}

async function handleTextMessage(phoneNumber: string, text: string, msg: proto.IWebMessageInfo) {
    // Cancel notification timer since user sent a message
    if (notificationTimers.has(phoneNumber)) {
        clearTimeout(notificationTimers.get(phoneNumber)!);
        notificationTimers.delete(phoneNumber);
        logger.info({ phoneNumber }, 'Cancelled notification timer (user sent message)');
    }

    const sendMessageFunc = async (text: string) => {
        if (msg.key && msg.key.remoteJid) {
            await sendMessageToUser(msg.key.remoteJid, text);
        }
    };

    const ownerNotifyFunc = CONFIG.NOTIFY_OWNER
        ? async (text: string) => {
            await sendMessageToUser(`${CONFIG.OWNER_PHONE}@s.whatsapp.net`, text);
        }
        : undefined;

    await handleUserMessage(phoneNumber, text, sendMessageFunc, ownerNotifyFunc);
}

async function sendMessageToUser(jid: string, text: string) {
    try {
        await sock.sendMessage(jid, { text });
        logger.info({ jid, preview: text.substring(0, 50) }, 'Sent message');
    } catch (error: any) {
        logger.error({
            jid,
            errorMessage: error?.message || 'Unknown error',
            errorName: error?.name
        }, 'Failed to send message');
    }
}
