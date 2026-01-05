import { View, Text, Alert, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';

type CardData = {
    id: number;
    name: string;
    card_series: string;
    card_number: string;
    team_name?: string;
    card_type: string;
    front_image_key: string;
    back_image_key: string;
};

const CardDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Grabs id from filename 

    const [card, setCard] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCardDetails();
        }
    }, [id]);

    const fetchCardDetails = async () => {
        try {
            const API_URL = process.env.API_BASE_HOME
            const response = await fetch(`${API_URL}/cards/${id}`);
            const json = await response.json();

            if (json.status === 'ok') {
                setCard(json.data);
            } else {
                Alert.alert("Error", "Card not found");
                router.back();
            }
        } catch (error) {
            console.error('Error fetching card details:', error);
            Alert.alert('Error', 'Failed to fetch card details.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }

    if (!card) {
        return null;
    }

    return (
        <View>
            <Text>CardDetails</Text>
        </View>
    )
}

export default CardDetails