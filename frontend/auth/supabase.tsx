import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_API!;

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
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
