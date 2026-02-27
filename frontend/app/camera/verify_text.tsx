import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import * as React from "react";
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '@/lib/api';
import { useState } from 'react';

const Verify_Text = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [name, setName] = useState(params.name as string || '');
    const [card_number, setCardNumber] = useState(params.card_number as string || '');
    const [card_series, setCardSeries] = useState(params.card_series as string || '');
    const [card_type, setCardType] = useState(params.card_type as string || '');
    const [team_name, setTeamName] = useState(params.team_name as string || '');

    const confirmCard = async () => {
        try {
            const payload = {
                name: name,
                card_series: card_series,
                card_number: card_number,
                team_name: team_name,
                card_type: card_type,
                front_image_key: params.frontImage,
                back_image_key: params.backImage
            };

            // POST request to confirm card details
            const response = await apiFetch(`/confirm-card`, {
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
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{
                flexGrow: 1,
                padding: 24,
                justifyContent: "center",
            }}>

                <Text className="text-primary text-3xl font-bold text-center mb-8">
                    Verify Details
                </Text>

                <View className="space-y-4">

                    <TextInput
                        className="bg-white text-black text-lg p-4 rounded-2xl border border-border"
                        style={{ textAlignVertical: "center" }}
                        onChangeText={setName}
                        defaultValue={name}
                        placeholder="Player Name"
                        placeholderTextColor="#9CA3AF"
                    />

                    <TextInput
                        className="bg-white text-black text-lg p-4 rounded-2xl border border-border"
                        style={{ textAlignVertical: "center" }}
                        onChangeText={setCardNumber}
                        defaultValue={card_number}
                        placeholder="Card Number"
                        placeholderTextColor="#9CA3AF"
                    />

                    <TextInput
                        className="bg-white text-black text-lg p-4 rounded-2xl border border-border"
                        style={{ textAlignVertical: "center" }}
                        onChangeText={setCardSeries}
                        defaultValue={card_series}
                        placeholder="Series / Year"
                        placeholderTextColor="#9CA3AF"
                    />

                    <TextInput
                        className="bg-white text-black text-lg p-4 rounded-2xl border border-border"
                        style={{ textAlignVertical: "center" }}
                        onChangeText={setCardType}
                        defaultValue={card_type}
                        placeholder="Card Type (e.g. Young Guns)"
                        placeholderTextColor="#9CA3AF"
                    />

                    <TextInput
                        className="bg-white text-black text-lg p-4 rounded-2xl border border-border"
                        style={{ textAlignVertical: "center" }}
                        onChangeText={setTeamName}
                        defaultValue={team_name}
                        placeholder="Team Name"
                        placeholderTextColor="#9CA3AF"
                    />

                </View>

                <TouchableOpacity
                    onPress={confirmCard}
                    className="bg-primary w-full py-5 rounded-2xl items-center mt-10"
                >
                    <Text className="text-white font-bold text-xl">
                        Confirm Card
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    )
}

export default Verify_Text