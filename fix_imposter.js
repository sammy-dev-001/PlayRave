const fs = require('fs');
let file = fs.readFileSync('frontend/src/screens/ImposterScreen.js', 'utf8');

file = file.replace(/const handlePhaseChange = \(\{ phase: newPhase \}\) => \{\s*setPhase\(newPhase\);\s*fadeAnim\.setValue\(0\);/g, "const handlePhaseChange = ({ phase: newPhase }) => {\r\n        setPhase(newPhase);");

file = file.replace(/\/\/ Fade in animation\s*Animated\.timing\(fadeAnim, \{/g, "// Fade in animation\r\n        fadeAnim.setValue(0);\r\n        Animated.timing(fadeAnim, {");

fs.writeFileSync('frontend/src/screens/ImposterScreen.js', file);
console.log('Regex replace complete.');
