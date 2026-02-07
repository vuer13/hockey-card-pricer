import { signUpWithEmail } from '@/auth/supabase';
import { useRouter } from 'expo-router';
import React from 'react'
import { Button, Pressable, TextInput, View } from 'react-native';
import { Text } from 'react-native-svg';

export default function SignUp() {
    const router = useRouter();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleSignup = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        const { error } = await signUpWithEmail(email, password);
        if (error) {
            setError(error.message);
        } else {
            router.replace("/login");
        }
    };

    return (
        <View className="flex-1 justify-center items-center px-6">
            <View className="w-full max-w-md">
                <Text>
                    Create Account
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
                    className="border rounded px-3 py-2 mb-4"
                />

                <TextInput
                    placeholder="Confirm Password"
                    secureTextEntry
                    onChangeText={setConfirmPassword}
                    className="border rounded px-3 py-2 mb-4"
                />

                {error ? (
                    <Text>
                        {error}
                    </Text>
                ) : null}

                <Pressable
                    onPress={handleSignup}
                    className="border rounded py-2 items-center"
                >
                    <Text>Create account</Text>
                </Pressable>
            </View>
        </View>
    );
}