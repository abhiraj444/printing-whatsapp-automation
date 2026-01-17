const fs = require('fs');
const path = require('path');

const authFolder = path.join(__dirname, 'auth_info_baileys');

console.log('🧹 Cleaning authentication data...');

if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
    console.log('✅ Old authentication data removed');
} else {
    console.log('ℹ️  No existing authentication data found');
}

console.log('✨ Ready for fresh start! Now run: npm start');
