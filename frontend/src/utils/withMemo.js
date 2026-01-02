import React, { memo, useMemo, useCallback } from 'react';

/**
 * Higher-order component for consistent memoization with custom comparison.
 * Useful for wrapping screen components to prevent unnecessary re-renders.
 * 
 * @param {React.Component} Component - The component to memoize
 * @param {Function} areEqual - Optional custom comparison function
 * @returns {React.MemoExoticComponent} Memoized component
 * 
 * @example
 * const MemoizedScreen = withMemo(MyScreen);
 * 
 * @example
 * // With custom comparison
 * const MemoizedScreen = withMemo(MyScreen, (prevProps, nextProps) => {
 *     return prevProps.room?.id === nextProps.room?.id;
 * });
 */
export function withMemo(Component, areEqual) {
    const MemoizedComponent = memo(Component, areEqual);

    // Preserve display name for debugging
    MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`;

    return MemoizedComponent;
}

/**
 * Default comparison function for route params.
 * Compares only essential props that should trigger re-renders.
 */
export function routePropsAreEqual(prevProps, nextProps) {
    // Compare route params
    const prevParams = prevProps.route?.params || {};
    const nextParams = nextProps.route?.params || {};

    // Compare room ID if present
    if (prevParams.room?.id !== nextParams.room?.id) {
        return false;
    }

    // Compare player name if present
    if (prevParams.playerName !== nextParams.playerName) {
        return false;
    }

    // Compare game type if present
    if (prevParams.gameType !== nextParams.gameType) {
        return false;
    }

    return true;
}

/**
 * Hook for memoizing expensive computations in game screens.
 * 
 * @param {Function} computeFn - The computation function
 * @param {Array} deps - Dependencies array
 * @returns {any} Memoized result
 */
export function useGameMemo(computeFn, deps) {
    return useMemo(computeFn, deps);
}

/**
 * Hook for memoizing game event handlers.
 * Prevents handler recreation on every render.
 * 
 * @param {Function} handler - The event handler function
 * @param {Array} deps - Dependencies array
 * @returns {Function} Memoized handler
 */
export function useGameCallback(handler, deps) {
    return useCallback(handler, deps);
}

/**
 * Creates a shallow comparison function for specific prop keys.
 * 
 * @param {string[]} keysToCompare - Array of prop keys to compare
 * @returns {Function} Comparison function for React.memo
 * 
 * @example
 * const MyComponent = memo(Component, createPropsComparer(['id', 'name']));
 */
export function createPropsComparer(keysToCompare) {
    return (prevProps, nextProps) => {
        for (const key of keysToCompare) {
            if (prevProps[key] !== nextProps[key]) {
                return false;
            }
        }
        return true;
    };
}

/**
 * Deep comparison for objects (use sparingly, can be expensive).
 * Better to use shallow comparison when possible.
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    if (obj1 === null || obj2 === null) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

export default {
    withMemo,
    routePropsAreEqual,
    useGameMemo,
    useGameCallback,
    createPropsComparer,
    deepEqual,
};
