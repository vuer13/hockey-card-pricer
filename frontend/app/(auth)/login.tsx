import { signInWithEmail } from '@/auth/supabase';
import { useRouter } from 'expo-router';
import React from 'react'
import { Button, TextInput, View } from 'react-native';
import { Text } from 'react-native-svg';

export default function Login() {
    const router = useRouter();
    
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async () => {
        const { error } = await signInWithEmail(email, password);
        if (error) {
            setError(error.message);
        }
    };

    return (
        <View>
            <TextInput placeholder="Email" onChangeText={setEmail} />
            <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
            {error && <Text>{error}</Text>}
            <Button title="Login" onPress={handleLogin} />
            <Button title="Sign up" onPress={() => router.push("/signup")} />
        </View>
    );
}