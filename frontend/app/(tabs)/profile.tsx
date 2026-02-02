import { View, Text, Button } from 'react-native'
import React from 'react'
import { signOut } from '@/auth/supabase'

const Profile = () => {
    return (
        <View>
            <Text>Profile</Text>
            <Button title="Logout" onPress={signOut} />
        </View>
    )
}

export default Profile