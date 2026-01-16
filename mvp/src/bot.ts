import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    downloadMediaMessage,
    WAMessage,
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

export async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_PATH);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger as any,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n🔗 Scan this QR code with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.info({ shouldReconnect }, 'Connection closed');

            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            logger.info('✅ WhatsApp connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
            await handleIncomingMessage(sock, message);
        }
    });

    return sock;
}

async function handleIncomingMessage(sock: any, message: WAMessage) {
    try {
        // Skip if message is from self or status broadcast
        if (!message.message || message.key.fromMe) return;

        const phoneNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
        if (!phoneNumber) return;

        logger.info({ phoneNumber, messageType: Object.keys(message.message || {})[0] }, 'Received message');

        // Check if it's a document (PDF)
        const documentMessage = message.message?.documentMessage;
        if (documentMessage) {
            await handleDocumentMessage(sock, message, phoneNumber, documentMessage);
            return;
        }

        // Check if it's a text message
        const textMessage = message.message?.conversation ||
            message.message?.extendedTextMessage?.text;
        if (textMessage) {
            await handleTextMessage(sock, phoneNumber, textMessage);
            return;
        }

    } catch (error) {
        logger.error({ error }, 'Error handling message');
    }
}

async function handleDocumentMessage(
    sock: any,
    message: WAMessage,
    phoneNumber: string,
    documentMessage: proto.Message.IDocumentMessage
) {
    const fileName = documentMessage.fileName || 'document.pdf';
    const mimeType = documentMessage.mimetype || '';

    // Check if it's a PDF
    if (!mimeType.includes('pdf') && !fileName.toLowerCase().endsWith('.pdf')) {
        await sendMessage(sock, phoneNumber, formatPDFOnly());
        return;
    }

    // Check if user has a job in progress (PROCESSING or PRINTING state)
    const existingJob = getJob(phoneNumber);
    if (existingJob && (existingJob.state === 'PROCESSING' || existingJob.state === 'PRINTING')) {
        await sendMessage(sock, phoneNumber, '⚠️ Previous job is in progress. Please wait for completion.');
        return;
    }

    try {
        // Download the file
        const buffer = await downloadMediaMessage(message, 'buffer', {}) as Buffer;

        // Save to user folder
        const userDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
        await fs.mkdir(userDir, { recursive: true });

        const filePath = path.join(userDir, fileName);
        await fs.writeFile(filePath, buffer);

        logger.info({ phoneNumber, fileName, size: buffer.length }, 'Downloaded PDF');

        // Add to job
        addFileToJob(phoneNumber, { fileName, filePath });

        // Send acknowledgment to customer
        await sendMessage(sock, phoneNumber, `📄 Received: ${fileName}`);

        // Notify shop owner (if enabled)
        if (CONFIG.NOTIFY_OWNER) {
            const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(2);
            await sendMessage(
                sock,
                CONFIG.OWNER_PHONE,
                `📥 *New File Downloaded*\n\n👤 From: ${phoneNumber}\n📄 File: ${fileName}\n📊 Size: ${sizeInMB} MB\n📁 Folder: downloads/${phoneNumber}/`
            );
        }

    } catch (error) {
        logger.error({ error, phoneNumber, fileName }, 'Failed to download document');
        await sendMessage(sock, phoneNumber, '❌ Failed to download file. Please try again.');
    }
}

async function handleTextMessage(sock: any, phoneNumber: string, text: string) {
    const sendMessageFunc = (msg: string) => sendMessage(sock, phoneNumber, msg);
    const ownerNotifyFunc = CONFIG.NOTIFY_OWNER
        ? (msg: string) => sendMessage(sock, CONFIG.OWNER_PHONE, msg)
        : undefined;
    await handleUserMessage(phoneNumber, text, sendMessageFunc, ownerNotifyFunc);
}

async function sendMessage(sock: any, phoneNumber: string, text: string) {
    try {
        await sock.sendMessage(`${phoneNumber}@s.whatsapp.net`, { text });
        logger.info({ phoneNumber, preview: text.substring(0, 50) }, 'Sent message');
    } catch (error) {
        logger.error({ error, phoneNumber }, 'Failed to send message');
    }
}
