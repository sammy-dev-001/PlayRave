/**
 * Avatar can be stored as:
 *   - a plain emoji string: "🐱"
 *   - an object: { id: string, emoji: string, name: string }
 *   - null / undefined
 *
 * Always call getAvatarEmoji() before rendering in JSX.
 */
export const getAvatarEmoji = (avatar) => {
    if (!avatar) return '👤';
    if (typeof avatar === 'string') return avatar;
    if (typeof avatar === 'object') return avatar.emoji || avatar.name || '👤';
    return '👤';
};
