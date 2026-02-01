import { useEffect, useState } from "react";
import { supabase } from "@/auth/supabase";
import AuthLayout from "./(auth)/_layout";
import _layout from "./(tabs)/_layout";

export default function App() {
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!session) return <AuthLayout />;

    return <_layout />;
}
