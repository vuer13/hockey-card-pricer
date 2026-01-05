import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

const verify_text = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [name, setName] = useState(params.name as string || '');
    const [card_number, setCardNumber] = useState(params.card_number as string || '');
    const [card_series, setCardSeries] = useState(params.card_series as string || '');
    const [card_type, setCardType] = useState(params.card_type as string || '');
    const [team_name, setTeamName] = useState(params.team_name as string || '');
    
    const [loading, setLoading] = useState(false);

    const getPrices = async () => {
        try {
            setLoading(true);

            const payload = {
                name: name,                
                card_series: card_series,   
                card_number: card_number,   
                team_name: team_name,      
                card_type: card_type,      
                front_image_key: params.frontImage, 
                back_image_key: params.backImage   
            };

            const API_URL = process.env.API_BASE_HOME;

            // POST request to confirm card details
            const response = await fetch(`${API_URL}/confirm-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.status === 'ok') {
                Alert.alert("Success", "Card added to collection!");

                // Price the cards now
            } else {
                Alert.alert("Error", "Could not save card: " + json.msg);
            }
        } catch (error) {
            console.error("Error confirming card:", error);
            Alert.alert("Network Error", "Failed to confirm card details.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View>
            <Text>Verify and Edit Extracted Text</Text>
            <TextInput
                onChangeText={newName => setName(newName)}
                defaultValue={name}
                placeholder='Name'
            />
            <TextInput
                onChangeText={newCardNumber => setCardNumber(newCardNumber)}
                defaultValue={card_number}
                placeholder='Card Number'
            />
            <TextInput
                onChangeText={newCardSeries => setCardSeries(newCardSeries)}
                defaultValue={card_series}
                placeholder='Card Series'
            />
            <TextInput
                onChangeText={newCardType => setCardType(newCardType)}
                defaultValue={card_type}
                placeholder='Card Type'
            />
            <TextInput
                onChangeText={newTeamName => setTeamName(newTeamName)}
                defaultValue={team_name}
                placeholder='Team Name'
            />

            <TouchableOpacity
                onPress={getPrices}
            >
                <Text>
                    Find Price
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default verify_text