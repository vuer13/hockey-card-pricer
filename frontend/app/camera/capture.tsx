import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '@/lib/api';

export default function capture() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const { side, existingFrontUri, existingFrontKey, existingBackUri, existingBackKey } = useLocalSearchParams();
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

            console.log("Detecting side:", side);

            formData.append('image_type', side as string);

            const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME;

            // Send to backend
            const response = await apiFetch(`/detect-card`, {
                method: 'POST',
                body: formData
            });

            const json = await response.json();
            console.log("Detection response:", json);

            // Verification
            if (json.status === 'ok') {
                console.log("Card detected successfully. Confirming Now.");
                router.push({
                    pathname: '/camera/confirm',
                    params: {
                        originalUri: uri,
                        bbox: JSON.stringify(json.data.bbox),
                        s3_key_original: json.data.s3_key_original,
                        s3_key_crop: json.data.s3_key_crop,
                        side: side,
                        existingFrontUri,
                        existingFrontKey,
                        existingBackUri,
                        existingBackKey
                    }
                });
            } else {
                router.push({
                    pathname: '/camera/confirm',
                    params: {
                        originalUri: uri,
                        s3_key_original: "manual_upload",
                        side: side,
                        existingFrontUri,
                        existingFrontKey,
                        existingBackUri,
                        existingBackKey
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