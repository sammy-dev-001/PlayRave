const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('frontend/src', function(filePath) {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Remove `, Platform}` completely
    content = content.replace(/\s*,\s*Platform\s*\}\s*from\s*'react-native';/g, "\n} from 'react-native';");
    
    // 2. Remove dangling commas before }
    content = content.replace(/,\s*\}\s*from\s*'react-native';/g, "\n} from 'react-native';");

    // Extract the react-native import block to check safely
    let rnImportMatch = content.match(/import\s+\{([\s\S]+?)\}\s+from\s+['"]react-native['"];/);
    if (rnImportMatch) {
        let importBody = rnImportMatch[1];
        
        // If Platform is used in the file, but not in the react-native import block
        if (content.includes('Platform') && !/\bPlatform\b/.test(importBody)) {
            let newImportBody = importBody.trim();
            // Remove trailing comma if any
            newImportBody = newImportBody.replace(/,$/, '');
            content = content.replace(rnImportMatch[0], `import {\n    ${newImportBody},\n    Platform\n} from 'react-native';`);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed correctly', filePath);
    }
});
