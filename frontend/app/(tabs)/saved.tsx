import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from "@/constants/images";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_HOME;

interface Card {
    id: string;
    name: string;
    card_series: string;
    card_number: string;
    team_name: string;
    image: string;
}

const CardItem = ({ item }: { item: Card }) => (
    <View className="w-full mb-6 bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-white/10">
        <Image
            source={{ uri: item.image }}
            className="w-full h-80"
            resizeMode="cover"
        />
        <View className="p-4">
            <View className="flex-row justify-between items-center">
                <Text className="text-white font-bold text-xl">{item.name}</Text>
            </View>
            <Text className="text-gray-400 text-sm mt-1">
                {item.card_series} #{item.card_number}
            </Text>
        </View>
    </View>
)

const Saved = () => {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    // Runs every time when navigated to this tab
    useFocusEffect(
        useCallback(() => {
            fetchSavedCards();
        }, [])
    );

    const fetchSavedCards = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/saved-cards`);
            const json = await response.json();

            if (json.status === 'ok') {
                setCards(json.cards);
            }
        } catch (error) {
            console.error('Error fetching saved cards:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <Image source={images.bg} className="absolute w-full z-0" />

            <SafeAreaView className="flex-1 px-4">
                <Text className="text-white text-2xl font-bold my-6">
                    Saved Collection
                </Text>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#16a34a" />
                    </View>
                ) : (
                    <FlatList
                        data={cards}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}

                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => router.push(`/cards/${item.id}`)}>
                                <CardItem item={item} />
                            </TouchableOpacity>
                        )}

                        ListEmptyComponent={
                            <View className="mt-20 items-center">
                                <Text className="text-gray-500 text-lg">No saved cards yet.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    )
}

export default Saved