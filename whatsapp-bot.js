const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Create downloads folder if it doesn't exist
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        // Removed printQRInTerminal as it's deprecated
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Display QR code when available
        if (qr) {
            console.log('\n📱 Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;
            
            console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        
        // Ignore messages from yourself
        if (msg.key.fromMe) return;

        const messageType = Object.keys(msg.message || {})[0];
        const chatId = msg.key.remoteJid;
        const senderName = msg.pushName || 'Unknown';

        console.log(`\n📨 New message from ${senderName}:`);
        console.log(`Message type: ${messageType}`);

        try {
            // Handle text messages
            if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
                console.log(`Text: ${textMessage}`);

                // Send a reply
                await sock.sendMessage(chatId, {
                    text: `✅ Message received: "${textMessage}"\n\nI'm ready to receive PDF files! Just send me a PDF and I'll download it and tell you its name.`
                }, { quoted: msg });
            }

            // Handle document messages (including PDFs)
            if (messageType === 'documentMessage' || messageType === 'documentWithCaptionMessage') {
                const document = msg.message.documentMessage || msg.message.documentWithCaptionMessage?.message?.documentMessage;
                
                if (document) {
                    const fileName = document.fileName;
                    const mimeType = document.mimetype;

                    console.log(`Document received: ${fileName}`);
                    console.log(`MIME type: ${mimeType}`);

                    // Check if it's a PDF
                    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
                        // Download the PDF
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            {
                                logger: console,
                                reuploadRequest: sock.updateMediaMessage
                            }
                        );

                        // Save the file
                        const filePath = path.join(downloadFolder, fileName);
                        fs.writeFileSync(filePath, buffer);

                        console.log(`✅ PDF saved to: ${filePath}`);

                        // Send a reply with the filename
                        await sock.sendMessage(chatId, {
                            text: `✅ PDF File Downloaded!\n\n📄 *Filename:* ${fileName}\n📊 *Size:* ${(buffer.length / 1024).toFixed(2)} KB\n💾 *Saved to:* ${filePath}\n\nThe file has been successfully downloaded and saved!`
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ I received a document (${fileName}), but it's not a PDF file.\n\nPlease send a PDF file for me to download.`
                        }, { quoted: msg });
                    }
                }
            }

            // Handle other media types
            if (messageType === 'imageMessage') {
                await sock.sendMessage(chatId, {
                    text: `📷 I received an image! But I'm specifically designed to handle PDF files. Please send a PDF document.`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error processing message:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Sorry, there was an error processing your message. Please try again.`
            }, { quoted: msg });
        }
    });

    return sock;
}

// Start the bot
console.log('🚀 Starting WhatsApp Bot...');
connectToWhatsApp();
