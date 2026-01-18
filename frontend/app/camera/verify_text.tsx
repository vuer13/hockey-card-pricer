import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

const verify_text = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [name, setName] = useState(params.name as string || '');
    const [card_number, setCardNumber] = useState(params.card_number as string || '');
    const [card_series, setCardSeries] = useState(params.card_series as string || '');
    const [card_type, setCardType] = useState(params.card_type as string || '');
    const [team_name, setTeamName] = useState(params.team_name as string || '');

    const [loading, setLoading] = useState(false);

    const confirmCard = async () => {
        try {
            setLoading(true);

            const payload = {
                name: name,
                card_series: card_series,
                card_number: card_number,
                team_name: team_name,
                card_type: card_type,
                front_image_key: params.frontImage,
                back_image_key: params.backImage
            };

            const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME;

            // POST request to confirm card details
            const response = await fetch(`${API_URL}/confirm-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();
            console.log("Confirm Card Response:", json);

            if (json.status === 'ok') {
                Alert.alert("Success", "Card added to collection!");

                // Navigate back to Home and reset stack
                router.dismissAll();
                router.replace("/");
            } else {
                Alert.alert("Error", "Could not save card: " + json.err);
            }
        } catch (error) {
            console.error("Error confirming card:", error);
            Alert.alert("Network Error", "Failed to confirm card details.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView contentContainerStyle={{ padding: 24 }}>

                <Text className="text-white text-3xl font-bold text-center mb-8">
                    Verify Details
                </Text>

                {/* Input Fields */}
                <View className="space-y-4">
                    <TextInput
                        className="bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-800"
                        onChangeText={setName}
                        defaultValue={name}
                        placeholder="Player Name"
                        placeholderTextColor="#6B7280"
                    />

                    <TextInput
                        className="bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-800"
                        onChangeText={setCardNumber}
                        defaultValue={card_number}
                        placeholder="Card Number"
                        placeholderTextColor="#6B7280"
                    />

                    <TextInput
                        className="bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-800"
                        onChangeText={setCardSeries}
                        defaultValue={card_series}
                        placeholder="Series / Year"
                        placeholderTextColor="#6B7280"
                    />

                    <TextInput
                        className="bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-800"
                        onChangeText={setCardType}
                        defaultValue={card_type}
                        placeholder="Card Type (e.g. Young Guns)"
                        placeholderTextColor="#6B7280"
                    />

                    <TextInput
                        className="bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-800"
                        onChangeText={setTeamName}
                        defaultValue={team_name}
                        placeholder="Team Name"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                <TouchableOpacity
                    onPress={confirmCard}
                    className="bg-green-600 w-full py-5 rounded-xl items-center mt-10 shadow-lg shadow-green-900/40"
                >
                    <Text className="text-white font-bold text-xl">
                        Confirm Card
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    )
}

export default verify_text