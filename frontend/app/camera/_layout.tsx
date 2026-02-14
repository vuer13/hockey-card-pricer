import { Stack } from "expo-router";
import React from 'react'

const _layout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="capture"
                options={{ headerShown: false, gestureEnabled: false }}
            />

            <Stack.Screen
                name="staging"
                options={{ headerShown: false, gestureEnabled: false }}
            />

            <Stack.Screen
                name="confirm"
                options={{ headerShown: false, gestureEnabled: false }}
            />
        </Stack>
    )
}

export default _layout