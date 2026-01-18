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
            // TODO - fetch history
        }
    }, [id]);

    const fetchHistory = async () => {
        // TODO - API call to get history
    };
    
    return (
        <View>
            {/* TODO - Render price history and chart */}
        </View>
    )
}

export default PriceDetails