import { createClient } from "@supabase/supabase-js";

const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_API!;

export const supabase = createClient(
    EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Auth helpers
export const signInWithEmail = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

export const signOut = () =>
    supabase.auth.signOut();

export const getSession = () =>
    supabase.auth.getSession();
