import { Slot, Stack, useRouter, useSegments } from "expo-router";
import './globals.css';
import { useEffect, useState } from "react";
import { supabase } from "@/auth/supabase";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        const isAuthRoute = segments[0] === "(auth)";

        if (!session && !isAuthRoute) {
            router.replace("/(auth)/login");
        }
        if (session && isAuthRoute) {
            router.replace("/(tabs)");
        }
    }, [session, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Slot />
    )
};
