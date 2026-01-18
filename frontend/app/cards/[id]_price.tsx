import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react'
import { View } from 'react-native'

const PriceDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [chart, setChart] = useState(null);

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
            const json = await response.json();

            if (json.status === 'ok') {
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

    const processData = (data: any[]) => {
        // TODO - Process data into history and chart set above
    };
    
    return (
        <View>
            {/* TODO - Render price history and chart */}
        </View>
    )
}

export default PriceDetails