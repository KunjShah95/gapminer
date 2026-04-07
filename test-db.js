import { initDb } from './apps/api/src/core/database.js';

(async () => {
    try {
        console.log('Testing initDb...');
        await initDb();
        console.log('Done');
        process.exit(0);
    } catch(e) {
        console.error('Crash:', e);
        process.exit(1);
    }
})();
