import { signUpWithEmail } from '@/auth/supabase';
import { useRouter } from 'expo-router';
import React from 'react'
import { Button, TextInput, View } from 'react-native';
import { Text } from 'react-native-svg';

export default function SignUp() {
    const router = useRouter();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleSignup = async () => {
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
            {error && <Text>{error}</Text>}
            <Button title="Create account" onPress={handleSignup} />
        </View>
    );
}