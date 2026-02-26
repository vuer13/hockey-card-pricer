import { View, Text, ImageBackground, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from "@/constants/images"
import { icons } from '@/constants/icons'

const TabIcon = ({ focused, icon, title }: any) => {
    if (focused) {
        return (
            <View className="flex-row items-center justify-center px-4 py-2 rounded-full bg-primary/10">
                <Image source={icon} tintColor="#1E40AF" className="size-5" />
                <Text className="text-primary text-sm font-semibold ml-2">
                    {title}
                </Text>
            </View>
        )
    }

    return (
        <View className="justify-center items-center">
            <Image source={icon} tintColor="#9CA3AF" className="size-5" />
        </View>
    )
}

const _layout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderRadius: 30,
                    marginHorizontal: 24,
                    marginBottom: 30,
                    height: 64,
                    position: 'absolute',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 5
                }
            }}
        >
            {/* Hides index header route */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} title="Home" />
                    )
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.search} title="Search" />
                    )
                }}
            />

            <Tabs.Screen
                name="saved"
                options={{
                    title: 'Saved',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.save} title="Saved" />
                    )
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.person} title="Profile" />
                    )
                }}
            />
        </Tabs>
    )
}

export default _layout