import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for debouncing callbacks
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} The debounced callback
 */
export function useDebouncedCallback(callback, delay, deps = []) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay, ...deps]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Custom hook for throttling callbacks
 * @param {Function} callback - The callback to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} The throttled callback
 */
export function useThrottledCallback(callback, limit, deps = []) {
    const lastCallRef = useRef(0);
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const throttledCallback = useCallback((...args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallRef.current;

        if (timeSinceLastCall >= limit) {
            lastCallRef.current = now;
            callbackRef.current(...args);
        } else if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
                lastCallRef.current = Date.now();
                callbackRef.current(...args);
                timeoutRef.current = null;
            }, limit - timeSinceLastCall);
        }
    }, [limit, ...deps]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return throttledCallback;
}

/**
 * Custom hook for rate-limited actions
 * @param {number} maxActions - Maximum number of actions allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ canAction: boolean, recordAction: Function, reset: Function }}
 */
export function useRateLimiter(maxActions, windowMs) {
    const actionsRef = useRef([]);
    const [canAction, setCanAction] = useState(true);

    const checkCanAction = useCallback(() => {
        const now = Date.now();
        actionsRef.current = actionsRef.current.filter(time => now - time < windowMs);
        const allowed = actionsRef.current.length < maxActions;
        setCanAction(allowed);
        return allowed;
    }, [maxActions, windowMs]);

    const recordAction = useCallback(() => {
        actionsRef.current.push(Date.now());
        checkCanAction();
    }, [checkCanAction]);

    const tryAction = useCallback(() => {
        if (checkCanAction()) {
            recordAction();
            return true;
        }
        return false;
    }, [checkCanAction, recordAction]);

    const reset = useCallback(() => {
        actionsRef.current = [];
        setCanAction(true);
    }, []);

    return {
        canAction,
        recordAction,
        tryAction,
        reset,
        checkCanAction,
    };
}

export default {
    useDebounce,
    useDebouncedCallback,
    useThrottledCallback,
    useRateLimiter,
};
