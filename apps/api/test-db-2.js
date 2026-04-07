import "dotenv/config";
import { initDb } from './src/core/database.js';

(async () => {
    try {
        console.log('Testing initDb with proper env...');
        await initDb();
        console.log('Done');
        process.exit(0);
    } catch(e) {
        console.error('Crash:', e);
        process.exit(1);
    }
})();
