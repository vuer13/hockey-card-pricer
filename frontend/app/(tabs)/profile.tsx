import { View, Text, Pressable, ScrollView } from 'react-native'
import * as React from "react";
import { signOut } from '@/auth/supabase'

const Profile = () => {
    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1 }} >
            <View className="flex-1 bg-background px-6">
                <View className="flex-1 justify-center items-center">

                    <View className="w-full max-w-md">
                        <Text className="text-3xl font-bold text-center text-text mb-10">
                            Profile
                        </Text>

                        <View className="bg-white rounded-xl p-6 border border-border mb-8 items-center">
                            <View className="w-20 h-20 bg-primary rounded-full mb-4 justify-center items-center">
                                <Text className="text-white text-2xl font-bold">
                                    U
                                </Text>
                            </View>

                            <Text className="text-lg font-semibold text-text">
                                User Name
                            </Text>

                            <Text className="text-sm text-gray-500 mt-1">
                                user@email.com
                            </Text>
                        </View>

                        <View className="bg-white rounded-xl border border-border divide-y divide-border">

                            <Pressable className="py-4 px-4">
                                <Text className="text-base">Edit Profile</Text>
                            </Pressable>

                            <Pressable className="py-4 px-4">
                                <Text className="text-base">Information</Text>
                            </Pressable>

                            <Pressable className="py-4 px-4">
                                <Text className="text-base">Settings</Text>
                            </Pressable>

                            <Pressable className="py-4 px-4">
                                <Text className="text-red-500 text-base">
                                    Delete Account
                                </Text>
                            </Pressable>

                        </View>

                        <Pressable
                            onPress={signOut}
                            className="mt-8 bg-secondary rounded-xl py-3 items-center"
                        >
                            <Text className="text-white font-semibold">
                                Logout
                            </Text>
                        </Pressable>

                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

export default Profile