const fs = require('fs');

// 1. DrawBattleScreen
try {
    let drawBattle = fs.readFileSync('src/screens/DrawBattleScreen.js', 'utf8');
    drawBattle = drawBattle.replace(
        /const BRUSH_COLORS = \[COLORS\.white[^\]]+\];\s+const DrawBattleScreen = \(\{ route, navigation \}\) => \{\s+const \{ COLORS \} = useTheme\(\);/m,
        `const DrawBattleScreen = ({ route, navigation }) => {\n    const { COLORS } = useTheme();\n    const BRUSH_COLORS = React.useMemo(() => [COLORS.white, COLORS.neonCyan, COLORS.hotPink, COLORS.limeGlow, COLORS.electricPurple, '#ff9900'], [COLORS]);`
    );
    fs.writeFileSync('src/screens/DrawBattleScreen.js', drawBattle);
    console.log('Fixed DrawBattleScreen');
} catch(e) { console.error('DrawBattleScreen failed', e); }

// 2. HotSeatCategoryScreen
try {
    let hotSeat = fs.readFileSync('src/screens/HotSeatCategoryScreen.js', 'utf8');
    hotSeat = hotSeat.replace(/const CATEGORIES = \[/, 'const getCategories = (COLORS) => [');
    hotSeat = hotSeat.replace(
        /const HotSeatCategoryScreen = \(\{ route, navigation \}\) => \{/,
        `const HotSeatCategoryScreen = ({ route, navigation }) => {\n    const { COLORS } = useTheme();\n    const CATEGORIES = React.useMemo(() => getCategories(COLORS), [COLORS]);`
    );
    // remove the previous const { COLORS } = useTheme(); which is duplicated now if we inserted above it
    hotSeat = hotSeat.replace(
        /const CATEGORIES = React\.useMemo\(\(\) => getCategories\(COLORS\), \[COLORS\]\);\s+const \{ COLORS: oldColors \} = useTheme\(\);/m, 
        `const CATEGORIES = React.useMemo(() => getCategories(COLORS), [COLORS]);`
    );
    // actually, let's just make it simpler. HotSeatCategoryScreen might already have const { COLORS } = useTheme();
    // let's do a smarter replace.
    let hotSeat2 = fs.readFileSync('src/screens/HotSeatCategoryScreen.js', 'utf8');
    hotSeat2 = hotSeat2.replace(/const CATEGORIES = \[/, 'const getCategories = (COLORS) => [');
    hotSeat2 = hotSeat2.replace(
        /const HotSeatCategoryScreen = \(\{ route, navigation \}\) => \{\s+const \{ COLORS \} = useTheme\(\);/,
        `const HotSeatCategoryScreen = ({ route, navigation }) => {\n    const { COLORS } = useTheme();\n    const CATEGORIES = React.useMemo(() => getCategories(COLORS), [COLORS]);`
    );
    fs.writeFileSync('src/screens/HotSeatCategoryScreen.js', hotSeat2);
    console.log('Fixed HotSeatCategoryScreen');
} catch(e) { console.error('HotSeatCategoryScreen failed', e); }

// 3. Soundboard
try {
    let soundboard = fs.readFileSync('src/components/Soundboard.js', 'utf8');
    soundboard = soundboard.replace(
        /const SoundButton = \(\{ sound, onPress, disabled \}\) => \(\s*<TouchableOpacity/,
        `const SoundButton = ({ sound, onPress, disabled }) => {\n    const { COLORS } = useTheme();\n    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);\n    return (\n        <TouchableOpacity`
    );
    soundboard = soundboard.replace(
        /<\/NeonText>\s*<\/TouchableOpacity>\s*\);/m,
        `</NeonText>\n        </TouchableOpacity>\n    );\n};`
    );
    fs.writeFileSync('src/components/Soundboard.js', soundboard);
    console.log('Fixed Soundboard');
} catch(e) { console.error('Soundboard failed', e); }

// 4. AvatarPicker
try {
    let avatarPicker = fs.readFileSync('src/components/AvatarPicker.js', 'utf8');
    avatarPicker = avatarPicker.replace(
        /export const AvatarDisplay = \(\{ avatar, color, size = 40, onPress, isCustomPhoto \}\) => \{\s+const Component/,
        `export const AvatarDisplay = ({ avatar, color, size = 40, onPress, isCustomPhoto }) => {\n    const { COLORS } = useTheme();\n    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);\n    const Component`
    );
    fs.writeFileSync('src/components/AvatarPicker.js', avatarPicker);
    console.log('Fixed AvatarPicker');
} catch(e) { console.error('AvatarPicker failed', e); }
