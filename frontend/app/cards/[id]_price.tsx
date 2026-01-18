import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react'
import { View } from 'react-native'

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

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [chartData, setChart] = useState<ChartData | null>(null);

    useEffect(() => {
        if (id) {
            fetchHistory();
        }
    }, [id]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            const API_BASE = process.env.EXPO_PUBLIC_API_BASE_HOME;

            const response = await fetch(`${API_BASE}/price-trend/${id}`);

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

    return (
        <View>
            {/* TODO - Render price history and chart */}
        </View>
    )
}

export default PriceDetails