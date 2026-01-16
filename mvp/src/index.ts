import { startBot } from './bot';
import { logger } from './logger';
import { CONFIG } from './config';

async function main() {
    logger.info('🚀 Starting WhatsApp Print Bot MVP...');
    logger.info({ config: CONFIG }, 'Configuration loaded');

    try {
        await startBot();
    } catch (error) {
        logger.error({ error }, 'Fatal error starting bot');
        process.exit(1);
    }
}

main();
