import React from 'react';

import AuthScreen from '../../screens/AuthScreen';

export const AuthGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Group>
);
