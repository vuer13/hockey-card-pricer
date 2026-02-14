import { View, Text, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '@/lib/api';

const staging = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [frontImage, setFrontImage] = useState<{ uri: string, s3Key: string } | null>(null);
    const [backImage, setBackImage] = useState<{ uri: string, s3Key: string } | null>(null);

    const [loading, setLoading] = useState(false);

    // Listener checking to see if new information as been added
    useEffect(() => {
        if (params.finalFrontUri && params.finalFrontKey) {
            const newUri = params.finalFrontUri as string;
            if (frontImage?.uri !== newUri) {
                setFrontImage({
                    uri: newUri,
                    s3Key: params.finalFrontKey as string
                });
            }
        }

        if (params.finalBackUri && params.finalBackKey) {
            const newUri = params.finalBackUri as string;
            if (backImage?.uri !== newUri) {
                setBackImage({
                    uri: newUri,
                    s3Key: params.finalBackKey as string
                });
            }
        }
    }, [params.finalFrontUri, params.finalFrontKey, params.finalBackUri, params.finalBackKey]);

    const handleScan = (side: 'front' | 'back') => {
        router.push({
            pathname: "/camera/capture",
            params: {
                side: side, // Tells the camera which side is being scanned
                existingFrontUri: frontImage?.uri || "",
                existingFrontKey: frontImage?.s3Key || "",
                existingBackUri: backImage?.uri || "",
                existingBackKey: backImage?.s3Key || ""
            }
        });
    };

    const handleFinalize = () => {
        // Both images MUST be filled
        if (!frontImage || !backImage) {
            Alert.alert("Missing Images", "Please scan both front and back sides.");
            return;
        }

        console.log("Ready to Extract. Front Key:", frontImage.s3Key, "Back Key:", backImage.s3Key);

        setLoading(true);
        extractTextFromImage();
    };

    const extractTextFromImage = async () => {
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: backImage?.uri,
                name: 'backImage.jpg',
                type: 'image/jpeg'
            } as any);

            const API_URL = process.env.EXPO_PUBLIC_API_BASE_HOME;

            const response = await apiFetch(`/extract-text`, {
                method: 'POST',
                body: formData
            });

            const json = await response.json();
            console.log('Extraction Result:', json);

            if (json.status === 'ok') {
                router.push({
                    pathname: '/camera/verify_text',
                    params: {
                        name: json.data.name,
                        card_number: json.data.card_number,
                        card_series: json.data.card_series,
                        card_type: json.data.card_type,
                        team_name: json.data.team_name,
                        frontImage: frontImage?.s3Key,
                        backImage: backImage?.s3Key
                    }
                });
            } else {
                router.push({
                    pathname: '/camera/verify_text',
                    params: {
                        frontImage: frontImage?.s3Key,
                        backImage: backImage?.s3Key
                    }
                });
            }
        } catch (error) {
            console.error('Error extracting text:', error);
            Alert.alert("Extraction Error", "There was an error extracting text from the images.");
        } finally {
            setLoading(false);
        }
    }

    // Since front/back logic is the same in these steps
    const CardSlot = ({ side, data }: { side: 'front' | 'back', data: any }) => (
        <TouchableOpacity
            onPress={() => handleScan(side)} // Start process of getting photo
            className="flex-1 bg-gray-900 rounded-xl border-2 border-dashed border-gray-600 justify-center items-center overflow-hidden m-2"
        >
            {data ? (
                <>
                    <Image source={{ uri: data.uri }} className="w-full h-full" resizeMode="cover" />

                    <View className="absolute bottom-0 items-center">
                        <Text className="text-white font-bold">Retake Photo</Text>
                    </View>
                </>
            ) : (
                //Show plus button if no photo yet
                <View className="items-center">
                    <View className="w-12 h-12 rounded-full bg-gray-700 items-center justify-center mb-2">
                        <Text className="text-white text-2xl">+</Text>
                    </View>
                    <Text className="text-white-400 font-bold uppercase">{side}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-900 rounded-xl mb-6 justify-center overflow-hidden border border-gray-800">
            {loading ? (
                <ActivityIndicator size="large" color="white" />
            ) : (
                <SafeAreaView>
                    <Text className="text-white text-2xl font-bold text-center mb-2">New Entry</Text>

                    <View className="flex-row h-64 mb-8">
                        <CardSlot side="front" data={frontImage} />
                        <CardSlot side="back" data={backImage} />
                    </View>

                    <TouchableOpacity
                        onPress={handleFinalize}
                        className={`w-full py-4 rounded-xl items-center ${(frontImage && backImage) ? 'bg-blue-600' : 'bg-gray-800'
                            }`}
                    >
                        <Text className={`text-lg font-bold ${(frontImage && backImage) ? 'text-white' : 'text-gray-500'
                            }`}>
                            Extract Information
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}
        </View>
    )
}

export default staging