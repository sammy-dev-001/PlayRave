const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'screens');

const replacements = [
    // Icon field replacements in data structures
    ["icon: '\u{1F9E0}'", "icon: 'bulb'"],
    ["icon: '\u{1F914}'", "icon: 'help-circle'"],
    ["icon: '\u{1F465}'", "icon: 'people'"],
    ["icon: '\u26A1'", "icon: 'flash'"],
    ["icon: '\u{1F0CF}'", "icon: 'card'"],
    ["icon: '\u{1F3B2}'", "icon: 'dice'"],
    ["icon: '\u{1F92B}'", "icon: 'finger-print'"],
    ["icon: '\u{1F3B0}'", "icon: 'shuffle'"],
    ["icon: '\u{1F575}\uFE0F'", "icon: 'search'"],
    ["icon: '\u{1FA91}'", "icon: 'person'"],
    ["icon: '\u2328\uFE0F'", "icon: 'keypad'"],
    ["icon: '\u{1F9EE}'", "icon: 'calculator'"],
    ["icon: '\u{1F3A8}'", "icon: 'color-palette'"],
    ["icon: '\u2B55'", "icon: 'ellipse'"],
    ["icon: '\u{1F50D}'", "icon: 'search'"],
    ["icon: '\u{1F524}'", "icon: 'text'"],
    ["icon: '\u{1F3AD}'", "icon: 'happy'"],
    ["icon: '\u{1F37E}'", "icon: 'wine'"],
    ["icon: '\u{1F4DD}'", "icon: 'create'"],
    ["icon: '\u{1F4F8}'", "icon: 'camera'"],
    ["icon: '\u{1F3C3}'", "icon: 'walk'"],
    ["icon: '\u{1F528}'", "icon: 'hammer'"],
    ["icon: '\u{1F9E9}'", "icon: 'extension-puzzle'"],
    // Medal replacements
    ["'\u{1F947}'", "'1st'"],
    ["'\u{1F948}'", "'2nd'"],
    ["'\u{1F949}'", "'3rd'"],
    // Inline text emojis with surrounding spaces — header-like patterns
    ['\u{1F3C6} ', ''],
    [' \u{1F3C6}', ''],
    ['\u{1F525} ', ''],
    [' \u{1F525}', ''],
    ['\u26A1 ', ''],
    [' \u26A1', ''],
    ['\u{1F389} ', ''],
    [' \u{1F389}', ''],
    ['\u{1F9E0} ', ''],
    ['\u{1F9EE} ', ''],
    ['\u{1F3C3}\u26A1', ''],
    ['\u{1F3C3} ', ''],
    ['\u{1F3B5} ', ''],
    ['\u{1F3AE} ', ''],
    ['\u{1F3A8} ', ''],
    ['\u{1F50D} ', ''],
    ['\u{1F4DD} ', ''],
    ['\u{1F3AD} ', ''],
    ['\u2328\uFE0F ', ''],
    ['\u{1F916} ', ''],
    ['\u{1F441}\uFE0F ', ''],
    ['\u{1F451} ', ''],
    ['\u2713 ', ''],
    ['\u{1F680} ', ''],
    // Standalone emojis as NeonText children
    ['\u{1F3C6}', ''],
    ['\u{1F9E0}', ''],
    ['\u{1F451}', ''],
    ['\u{1F389}', ''],
    ['\u{1F916}', ''],
    ['\u{1F605}', ''],
    ['\u{1F680}', ''],
    ['\u2713', ''],
];

// Files already processed
const skip = new Set([
    'WouldYouRatherScreen.js',
    'WhotGameScreen.js',
    'GameSelectionScreen.js',
    'LocalGameSelectionScreen.js',
    'HotSeatScreen.js',
    'ProfileScreen.js',
    'LeaderboardScreen.js',
    'RapidFireScreen.js',
    'RapidFireCategoryScreen.js',
]);

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !skip.has(f));
let totalChanges = 0;
const changedFiles = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    replacements.forEach(([search, replace]) => {
        content = content.split(search).join(replace);
    });

    if (content !== originalContent) {
        // Add Ionicons import if not present
        if (!content.includes('@expo/vector-icons')) {
            content = content.replace(
                /(import React.*?;\r?\n)(import \{[^}]+\} from 'react-native';)/,
                "$1$2\nimport { Ionicons } from '@expo/vector-icons';"
            );
        }
        fs.writeFileSync(filePath, content, 'utf8');
        totalChanges++;
        changedFiles.push(file);
    }
});

console.log('Changed', totalChanges, 'files:');
changedFiles.forEach(f => console.log(' -', f));
