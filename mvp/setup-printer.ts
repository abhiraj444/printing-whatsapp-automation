import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const SUMATRA_URL = 'https://www.sumatrapdfreader.org/dl/rel/3.5.2/SumatraPDF-3.5.2-64.exe';
const DESTINATION = path.join(__dirname, 'SumatraPDF.exe');

async function downloadSumatra() {
    console.log('⬇️ Downloading SumatraPDF for reliable printing...');

    try {
        const response = await axios({
            method: 'GET',
            url: SUMATRA_URL,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(DESTINATION);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('✅ SumatraPDF downloaded successfully!');
                console.log(`📍 Location: ${DESTINATION}`);
                resolve(true);
            });
            writer.on('error', reject);
        });
    } catch (error: any) {
        console.error('❌ Failed to download SumatraPDF:', error.message);
        throw error;
    }
}

downloadSumatra().catch(console.error);
