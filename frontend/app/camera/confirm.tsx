import { View, Text, Alert } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

const confirm = () => {
    const router = useRouter();
    const params = useLocalSearchParams(); // To get previous information from capture

    const [currentUri, setCurrentUri] = useState(params.photoUri as string); // Current uri
    const [loading, setLoading] = useState(false); // Loading state

    const { s3Key, side } = params; // where the image is stored and which side

    const handleConfirm = () => {
        // Send the final URI back to Staging
        router.push({
            pathname: "/camera/staging",
            params: {
                capturedUri: currentUri,
                s3Key: s3Key,
                side: side
            }
        });
    };

    const handleManualCrop = async (result: any) => {
        try {
            setLoading(true);
            // Continue logic
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Could not open crop editor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View>
            <Text>Confirm your photo</Text>
        </View>
    )
}

export default confirm