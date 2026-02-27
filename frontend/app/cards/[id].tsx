import { View, Text, Alert, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';

type CardData = {
    id: string;
    name: string;
    card_series: string;
    card_number: string;
    team_name?: string;
    card_type: string;
    front_image_key: string;
    back_image_key: string;
    saved: boolean;
};

const CardDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Grabs id from filename 

    const rawId = Array.isArray(id) ? id[0] : id;
    const cleanId = rawId?.replace('_price', '') || '';

    const [card, setCard] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [priceLoading, setPriceLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Card Price stuff
    const [price, setPrice] = useState(null);
    const [priceLow, setPriceLow] = useState(null);
    const [priceHigh, setPriceHigh] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const [numSales, setNumSales] = useState(null);

    useEffect(() => {
        if (cleanId) {
            fetchCardDetails();
        }
    }, [cleanId]);

    useEffect(() => {
        if (card) {
            setIsSaved(card.saved || false);
        }
    }, [card]);

    const fetchCardDetails = async () => {
        try {
            const response = await apiFetch(`/card/${cleanId}`);
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

    const handlePrice = async () => {
        try {
            setPriceLoading(true);

            const query = {
                card_id: cleanId,
                name: card?.name,
                card_series: card?.card_series,
                card_number: card?.card_number,
                card_type: card?.card_type
            };

            const response = await apiFetch(`/price-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(query),
            });
            const json = await response.json();

            if (json.status === 'ok') {
                setPrice(json.data.estimate);
                setPriceLow(json.data.low);
                setPriceHigh(json.data.high);
                setConfidence(json.data.confidence);
                setNumSales(json.data.num_sales);
            } else {
                Alert.alert('Error', 'Failed to fetch price.');
            }
        } catch (error) {
            console.error('Error fetching price:', error);
            Alert.alert('Error', 'Failed to fetch price.');
        } finally {
            setPriceLoading(false);
        }
    };

    const viewPriceHistory = async () => {
        router.push(`/cards/${cleanId}/price`);
    };

    const saveCard = async () => {
        try {
            const newStatus = !isSaved;

            const response = await apiFetch(`/card/${cleanId}/save`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    saved: newStatus
                }),
            });

            const json = await response.json();

            if (json.status === 'ok') {
                setIsSaved(newStatus);
            } else {
                Alert.alert("Error", "Could not save card status");
            }
        } catch (error) {
            console.error('Error saving card:', error);
            Alert.alert('Error', 'Failed to save card.');
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

    const S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET;
    const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION;
    const base_url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`

    return (
        <View className="flex-1 bg-background">
            {priceLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : (
                <SafeAreaView className="flex-1">
                    <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-white">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#1E40AF" />
                        </TouchableOpacity>

                        <Text className="text-primary text-xl font-bold">
                            Card Details
                        </Text>

                        <TouchableOpacity onPress={saveCard}>
                            <Text className="text-primary font-semibold">
                                {isSaved ? "Unsave" : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
                        <View className="h-96 w-full bg-white rounded-2xl mb-8 overflow-hidden border border-border shadow-sm">
                            <Image
                                source={{ uri: `${base_url}${card.front_image_key}` }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </View>
                        <View className="bg-white rounded-2xl p-6 mb-8 border border-border shadow-sm">
                            <DetailRow label="Player Name" value={card.name} />
                            <DetailRow label="Team" value={card.team_name || 'N/A'} />
                            <DetailRow label="Series" value={card.card_series} />
                            <DetailRow label="Card #" value={card.card_number} />
                            <DetailRow label="Type" value={card.card_type} />
                        </View>
                        <TouchableOpacity
                            onPress={handlePrice}
                            className="bg-primary w-full py-4 rounded-2xl items-center mb-4"
                        >
                            <Text className="text-white font-bold text-lg">
                                Get eBay Price
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={viewPriceHistory}
                            className="border border-border bg-white w-full py-4 rounded-2xl items-center mb-6"
                        >
                            <Text className="text-primary font-semibold text-lg">
                                View Price History
                            </Text>
                        </TouchableOpacity>
                        {price ? (
                            <View className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                                <Text className="text-dark-200 text-sm mb-1">
                                    Estimated Value
                                </Text>
                                <Text className="text-primary text-3xl font-bold mb-4">
                                    ${price}
                                </Text>

                                <DetailRow label="Low" value={`$${priceLow}`} />
                                <DetailRow label="High" value={`$${priceHigh}`} />
                                <DetailRow label="Confidence" value={`${confidence}`} />
                                <DetailRow label="Sales" value={`${numSales}`} />
                            </View>
                        ) : (
                            <View className="mt-6 items-center">
                                <Text className="text-dark-200">
                                    No price data available.
                                </Text>
                            </View>
                        )}

                    </ScrollView>
                </SafeAreaView>
            )}
        </View>
    )
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between items-center border-b border-border pb-3 mb-3">
        <Text className="text-dark-200 text-base">
            {label}
        </Text>
        <Text className="text-black text-lg font-semibold">
            {value}
        </Text>
    </View>
);

export default CardDetails