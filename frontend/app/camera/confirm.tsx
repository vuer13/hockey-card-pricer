import { View, Text, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const confirm = () => {
    const router = useRouter();
    const params = useLocalSearchParams(); // To get previous information from capture

    // Previous params from capture
    const currentUri = params.originalUri as string; // Current uri
    const bbox = params.bbox ? JSON.parse(params.bbox as string) : null; // Bounding box for cropping
    const { s3Key, side } = params; // where the image is stored and which side

    const [displayedUri, setDisplayedUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        autoCrop();
    }, []);

    const autoCrop = async () => {
        if (!bbox) {
            // No bounding box, show original photo
            setDisplayedUri(currentUri);
            setLoading(false);
            return;
        }

        try {
            const [x, y, w, h] = bbox;
            const result = await manipulateAsync(
                currentUri,
                [{ crop: { originX: x, originY: y, width: w, height: h } }],
                { compress: 1, format: SaveFormat.JPEG }
            );

            setDisplayedUri(result.uri);
        } catch (error) {
            setDisplayedUri(currentUri); // Fallback to original
        } finally {
            setLoading(false);
        }
    };

    const manualCrop = async () => {
        try {
            setLoading(true);

            // Gallery access permission to temp save photo
            const permission = await MediaLibrary.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert("Permission Denied", "Cannot access media library for manual cropping.");
                setLoading(false);
                return;
            }

            // Temp save of photo to gallery
            const asset = await MediaLibrary.createAssetAsync(currentUri);

            // Open System Editor and allow for manual change
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [2.5, 3.5],
                quality: 1,
            });

            // Update with manual edit after clicking done
            if (!result.canceled) {
                setDisplayedUri(result.assets[0].uri);
            }

            // allows access to delete temp photo
            await MediaLibrary.deleteAssetsAsync([asset]);
        } catch (error) {
            Alert.alert("Error", "Manual cropping failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        // Send the final URI back to Staging
        router.push({
            pathname: "/camera/staging",
            params: {
                capturedUri: displayedUri,
                s3Key: s3Key,
                side: side
            }
        });
    };

    return (
        < View className="flex-1 bg-black p-4 pt-12" >
            <Text className="text-white text-2xl font-bold text-center mb-6 capitalize">
                Confirm {side}
            </Text>

            <View className="flex-1 bg-gray-900 rounded-xl mb-6 justify-center overflow-hidden border border-gray-800">
                {loading || !displayedUri ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <Image
                        source={{ uri: displayedUri }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                )}
            </View>

            <View className="flex-row gap-4 mb-4">
                <TouchableOpacity
                    onPress={manualCrop}
                    className="flex-1 bg-gray-600 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Manually Fix Crop</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConfirm}
                    className="flex-1 bg-blue-600 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Confirm Crop</Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default confirm