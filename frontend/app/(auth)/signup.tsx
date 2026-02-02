import { signUpWithEmail } from '@/auth/supabase';
import { useRouter } from 'expo-router';
import React from 'react'
import { Button, TextInput, View } from 'react-native';
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
        <View>
            <TextInput placeholder="Email" onChangeText={setEmail} />
            <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
            <TextInput placeholder="Confirm Password" secureTextEntry onChangeText={setConfirmPassword} />
            {error && <Text>{error}</Text>}
            <Button title="Create account" onPress={handleSignup} />
        </View>
    );
}