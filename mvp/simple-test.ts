/**
 * Test with whatsapp-web.js 1.23.0 (the working version)
 * Run: npx ts-node simple-test.ts
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🚀 Testing with whatsapp-web.js 1.23.0...\n');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr: string) => {
    console.log('📱 Scan QR code:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp connected!\n');
    console.log('📩 Send any message to test reply.\n');
});

client.on('authenticated', () => {
    console.log('🔐 Authenticated');
});

client.on('message', async (message: any) => {
    if (message.fromMe) return;

    console.log(`📨 Received: "${message.body}" from ${message.from}`);

    try {
        await message.reply(`Echo: ${message.body}`);
        console.log('✅ Reply sent!');
    } catch (error: any) {
        console.log('❌ Failed:', error.message);
    }
});

client.on('auth_failure', (msg: any) => {
    console.error('❌ Auth failed:', msg);
});

console.log('⏳ Initializing...\n');
client.initialize();
