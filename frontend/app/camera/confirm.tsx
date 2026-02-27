import { View, Text, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const Confirm = () => {
    const router = useRouter();
    const params = useLocalSearchParams(); // To get information

    console.log("Screen Params:", JSON.stringify(params, null, 2));

    // Previous params from capture
    const currentUri = params.originalUri as string; // Current uri
    const bbox = params.bbox ? JSON.parse(params.bbox as string) : null; // Bounding box for cropping
    const { s3_key_crop, side, existingFrontUri, existingFrontKey, existingBackUri, existingBackKey } = params; // where the image is stored and which side

    const [displayedUri, setDisplayedUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("useEffect triggered.");

        if (currentUri && bbox) {
            autoCrop();
        }
    }, [currentUri, params.bbox]);

    const autoCrop = async () => {
        console.log("Starting auto-crop with bbox:", bbox);
        // No BBox case
        if (!bbox) {
            console.log('No bounding box provided');
            setDisplayedUri(currentUri);
            setLoading(false);
            return;
        }

        try {
            const { width: imgW, height: imgH } = await new Promise<{ width: number, height: number }>((resolve, reject) => {
                Image.getSize(currentUri, (w, h) => resolve({ width: w, height: h }), reject);
            });

            const MAX_SIDE = 1600;
            const currentLongSide = Math.max(imgW, imgH);
            const scale = currentLongSide > MAX_SIDE ? currentLongSide / MAX_SIDE : 1;

            // Round to integers incase cropping returns floats
            let x1 = bbox[0] * scale;
            let y1 = bbox[1] * scale;
            let x2 = bbox[2] * scale;
            let y2 = bbox[3] * scale;

            // Crop box stays strictly inside the image
            const originX = Math.max(0, Math.round(x1));
            const originY = Math.max(0, Math.round(y1));

            // Width is (Right - Left), Height is (Bottom - Top)
            let w = Math.round(x2 - x1);
            let h = Math.round(y2 - y1);

            console.log({
                w: w,
                h: h,
                imgW: imgW,
                imgH: imgH,
                originX: originX,
                originY: originY,
                remainingX: imgW - originX,
                remainingY: imgH - originY
            });

            let width = Math.min(w, imgW - originX);
            let height = Math.min(h, imgH - originY);

            console.log({
                imgW, imgH,
                originX, originY,
                calculatedW: w, calculatedH: h,
                finalWidth: width, finalHeight: height
            });

            // Ensure at least 1 pixel
            width = Math.max(1, width);
            height = Math.max(1, height);

            const result = await ImageManipulator.manipulateAsync(
                currentUri,
                [{
                    crop: {
                        originX: originX,
                        originY: originY,
                        width: width,
                        height: height
                    }
                }],
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );


            console.log("Auto-cropping successful:", result.uri);
            setDisplayedUri(result.uri);
        } catch (error) {
            setDisplayedUri(currentUri); // Fallback to original
            console.log("Auto-cropping failed, showing original image.", error);
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
                aspect: [9, 16],
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
            console.log("Manual-cropping failed.", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        const isFront = side === 'front';

        router.push({
            pathname: "/camera/staging",
            params: {
                finalFrontUri: isFront ? displayedUri : existingFrontUri,
                finalFrontKey: isFront ? s3_key_crop : existingFrontKey,

                finalBackUri: isFront ? existingBackUri : displayedUri,
                finalBackKey: isFront ? existingBackKey : s3_key_crop,
            }
        });
    };

    return (
        <View className="flex-1 bg-background px-6 pt-10">

            <Text className="text-primary text-3xl font-bold text-center mb-6 capitalize">
                Confirm {side}
            </Text>

            <View className="flex-1 bg-white rounded-2xl mb-8 justify-center items-center overflow-hidden border border-border shadow-sm">
                {loading || !displayedUri ? (
                    <ActivityIndicator size="large" color="#1E40AF" />
                ) : (
                    <Image
                        source={{ uri: displayedUri }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                )}
            </View>

            <View className="flex-row gap-4 mb-6">
                <TouchableOpacity
                    onPress={manualCrop}
                    className="flex-1 border border-border py-4 rounded-2xl items-center bg-white"
                >
                    <Text className="text-primary font-semibold text-lg">
                        Manually Fix Crop
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConfirm}
                    className="flex-1 bg-primary py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-semibold text-lg">
                        Confirm Crop
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default Confirm