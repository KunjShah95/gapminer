const fs = require('fs');
const path = require('path');

function migrate(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            migrate(fullPath);
        } else if (fullPath.endsWith('.js')) {
            const newPath = fullPath.replace(/\.js$/, '.ts');
            try {
                fs.renameSync(fullPath, newPath);
                console.log('Renamed', fullPath);
            } catch (err) {
                console.error('Failed to rename', fullPath, err.message);
            }
        }
    }
}
migrate(path.join(__dirname, 'src'));
