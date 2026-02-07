import { supabase } from "@/auth/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME

export async function apiFetch(path: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const token = session?.access_token;

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
};    