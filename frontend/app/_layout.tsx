import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
    return (
        <Stack>

            {/* Hides the header for tabs layout router */}
            <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, }}
            />

            {/* Hides card details header route */}
            <Stack.Screen
                name="cards/[id]"
                options={{ headerShown: false, }}
            />
        </Stack>
    )
};
