import { useLocalSearchParams } from 'expo-router';
import React from 'react'
import { View } from 'react-native'

const PriceDetails = () => {
    const { id } = useLocalSearchParams();
    
    return (
        <View></View>
    )
}

export default PriceDetails