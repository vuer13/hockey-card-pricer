import { signInWithEmail } from '@/auth/supabase';
import React from 'react'
import { View } from 'react-native';

export default function Login() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async () => {
        const {error} = await signInWithEmail(email, password);
        if (error) {
            setError(error.message);
        }
    };
    
    return (
        <View>
            {/* Login Screen Content */}
        </View>
    );
}