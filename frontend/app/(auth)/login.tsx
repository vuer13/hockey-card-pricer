import { signInWithEmail } from '@/auth/supabase';
import { useRouter } from 'expo-router';
import React from 'react'
import { Pressable, TextInput, View, Text } from 'react-native';

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async () => {
        const { error } = await signInWithEmail(email, password);
        if (error) {
            setError(error.message);
            console.log("Login error:", error);
        }
    };

    return (
        <View className="flex-1 justify-center items-center px-6">
            <View className="w-full max-w-md">
                <Text>
                    Login
                </Text>

                <TextInput
                    placeholder="Email"
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    className="border rounded px-3 py-2 mb-4"
                />

                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={setPassword}
                    className="border rounded px-3 py-2 mb-2"
                />

                {error ? (
                    <Text>
                        {error}
                    </Text>
                ) : null}

                <Pressable
                    onPress={handleLogin}
                    className="border rounded py-2 items-center mb-3"
                >
                    <Text>Login</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/signup")}
                    className="border rounded py-2 items-center"
                >
                    <Text>Sign up</Text>
                </Pressable>
            </View>
        </View>
    );
}