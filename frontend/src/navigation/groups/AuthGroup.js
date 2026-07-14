import React, { lazy } from 'react';
import { withSuspense } from '../NavigationUtils';

const AuthScreen = lazy(() => import('../../screens/AuthScreen'));

export const AuthGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="Auth" component={withSuspense(AuthScreen)} />
    </Stack.Group>
);
