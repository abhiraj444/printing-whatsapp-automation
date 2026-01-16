import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG } from './src/config';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function testPrinting() {
    const printerName = CONFIG.PRINTER_NAME;
    console.log(`🖨️ Testing printing to: "${printerName}"`);

    // 1. Create a dummy test file
    const testFileName = 'test-print.txt';
    const testFilePath = path.resolve(testFileName);
    fs.writeFileSync(testFilePath, 'This is a test print from the WhatsApp Bot.\nIf you can read this, the basic print command works.');
    console.log(`📄 Created test file: ${testFilePath}`);

    // 2. Test Method 1: 'print' command (Text file)
    console.log('\n--- Test 1: Windows "print" command (Text File) ---');
    try {
        const command = `print /D:"${printerName}" "${testFilePath}"`;
        console.log(`> Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        console.log('✅ Command executed successfully.');
        if (stdout) console.log('Output:', stdout);
        if (stderr) console.error('Error Output:', stderr);
    } catch (error: any) {
        console.error('❌ Test 1 Failed:', error.message);
    }

    // 3. Test Method 2: PowerShell (PDF/Text)
    // We'll use the same text file for safety, but this method is better for PDFs
    console.log('\n--- Test 2: PowerShell "Start-Process -Verb Print" ---');
    try {
        const psCommand = `Start-Process -FilePath "${testFilePath}" -Verb Print`;
        console.log(`> Executing PowerShell: ${psCommand}`);
        await execAsync(`powershell -Command "${psCommand}"`);
        console.log('✅ Command executed successfully.');
        console.log('ℹ️ Note: This uses the default application for the file type to print.');
    } catch (error: any) {
        console.error('❌ Test 2 Failed:', error.message);
    }

    console.log('\n---------------------------------------------------');
    console.log('❓ Please check your printer to see if any pages were printed.');
    console.log('   - Test 1 uses the raw "print" command (often good for text/raw).');
    console.log('   - Test 2 uses the "Print" verb (like right-clicking a file and selecting Print).');
    console.log('   - If you want to test a real PDF, change the "testFileName" variable in this script.');
}

testPrinting().catch(console.error);
