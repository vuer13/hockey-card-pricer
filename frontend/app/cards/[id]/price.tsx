import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from "react-native-chart-kit"
import { apiFetch } from '@/lib/api';

const screenWidth = Dimensions.get("window").width;

interface PricePoint {
    created_at: string;
    estimate: number;
    low: number;
    high: number;
}

interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
    }[];
}

const PriceDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const cardId = Array.isArray(id) ? id[0] : id;

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [chartData, setChart] = useState<ChartData | null>(null);

    useEffect(() => {
        if (cardId) {
            fetchHistory();
        }
    }, [cardId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            const response = await apiFetch(`/card/${cardId}/price-trend`);

            if (response.ok) {
                const json = await response.json();
                const data = json.data;
                if (data && Array.isArray(data) && data.length > 0) {
                    processData(data);
                }
            }
        } catch (error) {
            console.error('Error fetching price history:', error);
        } finally {
            setLoading(false);
        }
    };

    const processData = (data: PricePoint[]) => {
        // Reverse data so we get most recent first, then set to display
        // the most recent data at the top
        const listData = [...data].reverse()
        setHistory(listData);

        // Processing chart data
        // Map out all dates
        const labels = data.map(item => {
            const d = new Date(item.created_at);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 100}`;
        });

        // Map out all prices
        const prices = data.map(item => item.estimate);

        // Set chart data
        setChart({
            labels: labels,
            datasets: [
                { data: prices }
            ]
        });
    };

    const renderItem = ({ item }: { item: PricePoint }) => (
        <View className="flex-row justify-between items-center p-5 bg-white mb-3 rounded-2xl mx-6 border border-border shadow-sm">
            <View>
                <Text className="text-primary font-bold text-lg">
                    ${item.estimate.toFixed(2)}
                </Text>
                <Text className="text-dark-200 text-xs">
                    Low: ${item.low}
                </Text>
                <Text className="text-dark-200 text-xs">
                    High: ${item.high}
                </Text>
            </View>
            <View className="items-end">
                <Text className="text-dark-200 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text className="text-gray-400 text-[10px]">
                    {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center px-6 py-4 border-b border-border bg-white">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#1E40AF" />
                    </TouchableOpacity>
                    <Text className="text-primary text-xl font-bold">
                        Price Trends
                    </Text>
                </View>
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#1E40AF" />
                        <Text className="text-dark-200 mt-4">
                            Loading market data...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item, index) => `${item.created_at}-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={() => (
                            <View className="px-6 py-6 border-b border-border mb-4">
                                <Text className="text-dark-200 mb-4 text-xs uppercase tracking-widest">
                                    Valuation History
                                </Text>

                                {chartData ? (
                                    <LineChart
                                        data={chartData}
                                        width={screenWidth - 48}
                                        height={220}
                                        yAxisLabel="$"
                                        yAxisInterval={1}
                                        chartConfig={{
                                            backgroundColor: "#ffffff",
                                            backgroundGradientFrom: "#ffffff",
                                            backgroundGradientTo: "#ffffff",
                                            decimalPlaces: 2,
                                            color: (opacity = 1) =>
                                                `rgba(30, 64, 175, ${opacity})`,
                                            labelColor: (opacity = 1) =>
                                                `rgba(75, 85, 99, ${opacity})`,
                                            style: { borderRadius: 16 },
                                            propsForDots: {
                                                r: "4",
                                                strokeWidth: "2",
                                                stroke: "#1E40AF"
                                            }
                                        }}
                                        bezier
                                        style={{ borderRadius: 16 }}
                                    />
                                ) : (
                                    <View className="h-48 justify-center items-center">
                                        <Text className="text-dark-200">
                                            Not enough data for chart
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    )
}

export default PriceDetails