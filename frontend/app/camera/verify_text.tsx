import { View, Text, TextInput, TouchableOpacity } from 'react-native'
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

    const getPrices = async () => {
        // Navigate to pricing page with verified data
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