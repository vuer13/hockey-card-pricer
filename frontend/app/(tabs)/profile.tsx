import { View, Text, Button, Pressable } from 'react-native'
import React from 'react'
import { signOut } from '@/auth/supabase'

const Profile = () => {
    return (
        <View className="flex-1 justify-center items-center px-6" >
            <View className="w-full max-w-md items-center">
                <Text className="text-xl mb-6">
                    Profile
                </Text>

                <Pressable
                    onPress={signOut}
                    className="border rounded py-2 px-6"
                >
                    <Text>Logout</Text>
                </Pressable>
            </View>
        </View >
    )
}

export default Profile