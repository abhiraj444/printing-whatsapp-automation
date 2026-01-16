/**
 * Simple test script to verify message sending works
 * Run with: npx ts-node test-send.ts
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const TEST_PHONE = '918340230105'; // Phone number to send test message to

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n🔗 Scan QR code:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Connected!\n');
    console.log('🧪 Running message send test...\n');

    // Test 1: Direct sendMessage
    console.log('TEST 1: client.sendMessage()');
    try {
        const chatId = `${TEST_PHONE}@c.us`;
        await client.sendMessage(chatId, '🧪 Test 1: Direct sendMessage - SUCCESS!');
        console.log('✅ TEST 1 PASSED\n');
    } catch (error: any) {
        console.log('❌ TEST 1 FAILED:', error.message, '\n');
    }

    // Test 2: getChatById then sendMessage
    console.log('TEST 2: getChatById().sendMessage()');
    try {
        const chatId = `${TEST_PHONE}@c.us`;
        const chat = await client.getChatById(chatId);
        await chat.sendMessage('🧪 Test 2: getChatById - SUCCESS!');
        console.log('✅ TEST 2 PASSED\n');
    } catch (error: any) {
        console.log('❌ TEST 2 FAILED:', error.message, '\n');
    }

    // Test 3: getChats and find
    console.log('TEST 3: getChats().find()');
    try {
        const chats = await client.getChats();
        const chat = chats.find(c => c.id._serialized === `${TEST_PHONE}@c.us`);
        if (chat) {
            await chat.sendMessage('🧪 Test 3: getChats find - SUCCESS!');
            console.log('✅ TEST 3 PASSED\n');
        } else {
            console.log('⚠️ TEST 3 SKIPPED: Chat not found in recent chats\n');
        }
    } catch (error: any) {
        console.log('❌ TEST 3 FAILED:', error.message, '\n');
    }

    console.log('🏁 Tests complete! Check your WhatsApp for messages.');
    console.log('Press Ctrl+C to exit.\n');
});

client.on('message', async (msg) => {
    // Echo test - reply to any incoming message
    if (!msg.fromMe && msg.body.toLowerCase() === 'test') {
        console.log('📩 Received "test" - attempting reply...');
        try {
            await msg.reply('🧪 Reply test - SUCCESS!');
            console.log('✅ Reply test PASSED\n');
        } catch (error: any) {
            console.log('❌ Reply test FAILED:', error.message, '\n');
        }
    }
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failed:', msg);
});

console.log('🚀 Starting test client...\n');
client.initialize();
