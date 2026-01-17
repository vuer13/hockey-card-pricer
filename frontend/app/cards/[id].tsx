import { View, Text, Alert, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
    const [priceLoading, setPriceLoading] = useState(false);

    // Card Price stuff
    const [price, setPrice] = useState(null);
    const [priceLow, setPriceLow] = useState(null);
    const [priceHigh, setPriceHigh] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const [numSales, setNumSales] = useState(null);

    useEffect(() => {
        if (id) {
            fetchCardDetails();
        }
    }, [id]);

    const fetchCardDetails = async () => {
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME;
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

    const handlePrice = async () => {
        try {
            setPriceLoading(true);
            const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME;
            const response = await fetch(`${API_URL}/price_card`);
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
        // TODO - view price history
    };

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
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row items-center p-4 border-b border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Card Details</Text>
            </View>

            <ScrollView className="p-4">
                <View className="h-96 w-full bg-gray-900 rounded-xl mb-6 overflow-hidden border border-gray-700">
                    <Image
                        source={{ uri: `${base_url}${card.front_image_key}` }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                </View>

                {/* Info Section */}
                <View className="bg-gray-900 rounded-xl p-6 gap-4">
                    <DetailRow label="Player Name" value={card.name} />
                    <DetailRow label="Team" value={card.team_name || 'N/A'} />
                    <DetailRow label="Series" value={card.card_series} />
                    <DetailRow label="Card #" value={card.card_number} />
                    <DetailRow label="Type" value={card.card_type} />
                </View>

                <View className="absolute bottom-10 left-0 right-0 p-4">
                    <TouchableOpacity
                        onPress={handlePrice}
                        className="bg-green-600 w-full py-4 rounded-xl items-center shadow-lg"
                    >
                        <Text className="text-white font-bold text-lg">
                            Get eBay Price
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={viewPriceHistory}
                        className="bg-green-600 w-full py-4 rounded-xl items-center shadow-lg"
                    >
                        <Text className="text-white font-bold text-lg">
                            View Price History
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View className="flex-row justify-between items-center border-b border-gray-800 pb-2 mb-2">
        <Text className="text-gray-400 text-base">{label}</Text>
        <Text className="text-white text-lg font-bold">{value}</Text>
    </View>
);

export default CardDetails