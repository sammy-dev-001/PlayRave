import React, { Suspense } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import GameErrorBoundary from '../components/GameErrorBoundary';

// Wrapper component for lazy-loaded screens
export const withSuspense = (Component) => {
    return (props) => (
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
            <Component {...props} />
        </Suspense>
    );
};

// Wrapper for game screens that adds an Error Boundary
export const withSuspenseAndBoundary = (Component) => {
    return (props) => (
        <GameErrorBoundary navigation={props.navigation}>
            <Suspense fallback={<LoadingScreen message="Loading game..." />}>
                <Component {...props} />
            </Suspense>
        </GameErrorBoundary>
    );
};
