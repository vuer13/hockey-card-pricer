import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Image, View, Text, ActivityIndicator, FlatList, TouchableOpacity } from "react-native";
import SearchBar from "@/components/SearchBar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_HOME;

interface Card {
    id: string;
    name: string;
    card_series: string;
    card_number: string;
    team_name: string;
    card_type: string;
    image: string;
}

const CardItem = ({ item }: { item: Card }) => (
    <View className="w-full mb-6 bg-dark-100 rounded-2xl overflow-hidden shadow-lg border border-white/10">
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

export default function Index() {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState('');

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await apiFetch(`${API_BASE}/cards?limit=30`);
            const data = await response.json();
            console.log("RAW RESPONSE:", data);
            if (data.status === 'ok') {
                setCards(data.data);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCards = query 
        ? (cards || []).filter(card =>
            (card.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
            (card.team_name?.toLowerCase() || '').includes(query.toLowerCase()) ||
            (card.card_number?.toString().toLowerCase() || '').includes(query.toLowerCase())
          )
        : cards; // Return all cards if query is empty

    return (
        <View className="flex-1 bg-primary">
            <Image source={images.bg} className="absolute w-full z-0" />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            ) : (
                <FlatList
                    data={filteredCards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => router.push(`/cards/${item.id}`)}>
                            <CardItem item={item} />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={() => (
                        <View className="mb-6">
                            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
                            <SearchBar
                                value={query}
                                onChangeText={(text: string) => setQuery(text)}
                                placeholder="Search for cards with name, team name or card series"
                            />
                            <Text className="text-white text-2xl font-bold mt-8">
                                {query ? "Search Results" : "Your Latest Cards"}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}