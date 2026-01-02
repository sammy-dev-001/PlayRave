# TypeScript Migration Guide for PlayRave

This document outlines how to gradually migrate the PlayRave codebase to TypeScript for improved type safety and developer experience.

## Current Setup

The TypeScript configuration has been added (`tsconfig.json`) with the following features:
- `allowJs: true` - Allows JavaScript files alongside TypeScript
- `checkJs: false` - Doesn't enforce type checking on JS files
- `strict: false` - Relaxed mode for gradual migration
- Path aliases configured for cleaner imports

## Getting Started

### 1. Install TypeScript Dependencies

```bash
cd frontend
npm install --save-dev typescript @types/react @types/react-native
```

### 2. Install Type Definitions

```bash
npm install --save-dev @types/node
```

## Migration Strategy

### Phase 1: Add Types to New Files
- Write any new files as `.ts` or `.tsx`
- Start with utility files and services

### Phase 2: Convert Utilities and Hooks
Priority files to convert:
1. `src/utils/validation.ts`
2. `src/utils/useDebounce.ts`
3. `src/utils/socketErrorHandler.ts`
4. `src/utils/withMemo.ts`

### Phase 3: Convert Services
1. `src/services/socket.ts`
2. `src/services/SoundService.ts`
3. `src/services/ProfileService.ts`

### Phase 4: Convert Context
1. `src/context/GameContext.ts`

### Phase 5: Convert Components
Start with reusable components:
1. `src/components/NeonButton.tsx`
2. `src/components/NeonText.tsx`
3. `src/components/NeonContainer.tsx`

### Phase 6: Convert Screens
Convert screens one at a time, starting with simpler ones.

## Type Definitions

### Example: Player Type

```typescript
// src/types/player.ts
export interface Player {
    id: string;
    name: string;
    avatar: string;
    avatarColor: string;
    isHost: boolean;
    isReady: boolean;
    score?: number;
}
```

### Example: Room Type

```typescript
// src/types/room.ts
import { Player } from './player';

export interface Room {
    id: string;
    hostId: string;
    players: Player[];
    gameType: string | null;
    customQuestions?: Question[];
    createdAt: Date;
}
```

### Example: Socket Events

```typescript
// src/types/socketEvents.ts
export interface CreateRoomPayload {
    playerName: string;
    avatar: string;
    avatarColor: string;
}

export interface JoinRoomPayload {
    roomId: string;
    playerName: string;
    avatar: string;
    avatarColor: string;
}

export interface SocketEvents {
    'create-room': (payload: CreateRoomPayload) => void;
    'join-room': (payload: JoinRoomPayload) => void;
    'room-created': (room: Room) => void;
    'room-joined': (room: Room) => void;
    'room-updated': (room: Room) => void;
    // ... add more events
}
```

## Converting a File

### Before (JavaScript)

```javascript
// validation.js
export function validatePlayerName(name) {
    if (!name) return { isValid: false, error: 'Name is required' };
    return { isValid: true, error: null };
}
```

### After (TypeScript)

```typescript
// validation.ts
interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

export function validatePlayerName(name: string): ValidationResult {
    if (!name) return { isValid: false, error: 'Name is required' };
    return { isValid: true, error: null };
}
```

## Best Practices

1. **Don't use `any`** - Use `unknown` and type guards instead
2. **Define interfaces** - Create a `types` folder for shared types
3. **Use strict null checks** - Handle null/undefined explicitly
4. **Export types** - Make types reusable across files
5. **Use generics** - For flexible, reusable code

## Enabling Strict Mode

Once most files are converted, enable strict mode gradually:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## IDE Support

For best developer experience:
- Use VS Code with the TypeScript extension
- Install ESLint with TypeScript parser
- Enable "Format on Save"

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Native TypeScript Template](https://reactnative.dev/docs/typescript)
