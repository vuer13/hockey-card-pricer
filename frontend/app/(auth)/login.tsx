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
        <View className="flex-1 justify-center bg-background px-6">
            <View className="mb-24 items-center">
                <Text className="text-5xl font-semibold">
                    Welcome to the
                </Text>
                <Text className="text-3xl font-semibold text-primary">
                    Hockey Price Evaluator
                </Text>
            </View>
            <View className="w-full max-w-md self-center">
                <Text className='text-4xl text-primary font-bold mb-5'>
                    Login
                </Text>

                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#000000"
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    className="border border-primary rounded-lg px-4 py-3 mb-4"
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#000000"
                    secureTextEntry
                    onChangeText={setPassword}
                    className="border border-primary rounded-lg px-4 py-3 mb-4"
                />

                <Pressable
                    onPress={handleLogin}
                    className="bg-secondary rounded-lg py-3 items-center mb-3"
                >
                    <Text className="text-white">Login</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/signup")}
                    className="bg-white rounded-lg py-3 items-center mb-3"
                >
                    <Text>Sign up</Text>
                </Pressable>

                {error ? (
                    <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                        <Text className="text-red-600 text-center">
                            {error.charAt(0).toUpperCase() + error.slice(1)}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}