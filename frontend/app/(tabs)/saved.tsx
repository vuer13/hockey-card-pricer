import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_HOME;

interface Card {
    id: string;
    name: string;
    card_series: string;
    card_number: string;
    team_name: string;
    image: string;
}

const Saved = () => {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSavedCards();
    }, []);

    const fetchSavedCards = async () => {
        // TODO
    };

    return (
        <View>
            <Text>saved</Text>
        </View>
    )
}

export default Saved