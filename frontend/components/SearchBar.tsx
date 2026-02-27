import { View, Image, TextInput } from 'react-native'
import React from 'react'
import { icons } from '@/constants/icons'

interface Props {
    placeholder: string;
    onPress?: () => void;
    onChangeText?: (text: string) => void;
    value?: string;
}

const SearchBar = ({ placeholder, onPress, onChangeText, value }: Props) => {
    return (
        <View className="flex-row items-center bg-white rounded-2xl px-5 py-4 border border-border">
            <Image
                source={icons.search}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="#1E40AF"
            />
            <TextInput
                onPress={onPress}
                style={{ textAlignVertical: "center" }}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-black text-base"
                editable={!onPress}
            />
        </View>
    )
}

export default SearchBar