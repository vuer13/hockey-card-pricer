import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function capture() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const side = (params.side as string)
    const [status, setStatus] = useState("Initialization")

    // Runs when component loads
    useEffect(() => {
        takePhotoDetect();
    }, []);

    const takePhotoDetect = async () => {
        try {
            // Camera Permissions
            const permission = await ImagePicker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                Alert.alert("Permission Denied", "Camera access is required to take photos.");
                router.back();
                return;
            }

            // Launch Camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1
            });

            // Handle Cancelation
            if (result.canceled) {
                router.back();
                return;
            }

            await detectCard(result.assets[0].uri);
        } catch (error) {
            console.error("Error taking photo:", error);
            Alert.alert("Error", "An error occurred while taking the photo.");
            router.back();
        }
    }

    const detectCard = async (uri: string) => {
        setStatus("Analyzing");

        // Upload
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: 'photo.jpg',
                type: 'image/jpeg'
            } as any);

            const API_URL = process.env.API_BASE_HOME;

            // Send to backend
            const response = await fetch(`${API_URL}/detect-card`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const json = await response.json();

            // Verification
            if (json.status === 'ok') {
                router.push({
                    pathname: '/camera/confirm',
                    params: {
                        originalUri: uri,
                        bbox: JSON.stringify(json.bbox),
                        s3Key: json.data.s3_key,
                        side: side
                    }
                });
            } else {
                // Incase backend cannot find card or an error is present, then we need to manually upload
                router.push({
                    pathname: '/camera/confirm',
                    params: {
                        originalUri: uri,
                        s3Key: "manual_upload",
                        side: side
                    }
                });
            }
        } catch (error) {
            console.error("Error detecting card:", error);
            Alert.alert("Error", "An error occurred while processing the photo.");
            router.back();
        }
    }

    return (
        <View className="flex-1 bg-black justify-center items-center">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white mt-5 text-lg font-bold">{status}</Text>
        </View>
    );
}